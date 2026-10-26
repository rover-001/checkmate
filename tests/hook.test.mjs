import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const HOOK_SCRIPT = join(ROOT_DIR, 'hooks', 'checkmate-instructions.js');

const CORE_RULES = readFileSync(join(ROOT_DIR, 'rules', 'checkmate.md'), 'utf8').trim();
const FULL_DELTA = readFileSync(join(ROOT_DIR, 'rules', 'modes', 'full.md'), 'utf8').trim();
const LITE_DELTA = readFileSync(join(ROOT_DIR, 'rules', 'modes', 'lite.md'), 'utf8').trim();
const ULTRA_DELTA = readFileSync(join(ROOT_DIR, 'rules', 'modes', 'ultra.md'), 'utf8').trim();

/**
 * Helper to spawn the hook script with temporary state and config dirs.
 * Guarantees real user home directory (~/.config/checkmate) is never touched.
 */
function runHook({ env = {}, state = null, config = null, args = [], input = null } = {}) {
  const tempDir = mkdtempSync(join(tmpdir(), 'checkmate-hook-test-'));
  const stateDir = join(tempDir, 'state');
  const configDir = join(tempDir, 'config');
  mkdirSync(stateDir, { recursive: true });
  mkdirSync(configDir, { recursive: true });

  if (state !== null) {
    const stateFile = join(stateDir, 'state.json');
    writeFileSync(
      stateFile,
      typeof state === 'string' ? state : JSON.stringify(state, null, 2),
      'utf8'
    );
  }

  if (config !== null) {
    const configFile = join(configDir, 'config.json');
    writeFileSync(
      configFile,
      typeof config === 'string' ? config : JSON.stringify(config, null, 2),
      'utf8'
    );
  }

  const childEnv = { ...process.env };
  delete childEnv.CHECKMATE_DEFAULT_MODE;
  delete childEnv.CHECKMATE_STATE_DIR;
  delete childEnv.CHECKMATE_CONFIG_DIR;

  Object.assign(childEnv, {
    CHECKMATE_STATE_DIR: stateDir,
    CHECKMATE_CONFIG_DIR: configDir,
    CLAUDE_PLUGIN_ROOT: ROOT_DIR,
    ...env,
  });

  try {
    const stdout = execFileSync(process.execPath, [HOOK_SCRIPT, ...args], {
      env: childEnv,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      input: input !== null ? (typeof input === 'string' ? input : JSON.stringify(input)) : undefined,
    });

    let savedState = null;
    const stateFile = join(stateDir, 'state.json');
    try {
      savedState = JSON.parse(readFileSync(stateFile, 'utf8'));
    } catch {
      // no state file or unparseable
    }

    return { stdout, exitCode: 0, state: savedState };
  } catch (err) {
    return {
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || '',
      exitCode: err.status ?? 1,
      state: null,
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('checkmate hook instructions', () => {
  describe('mode precedence (env > state > config > default "full")', () => {
    it('defaults to full mode when no env, state, or config is present', () => {
      const res = runHook();
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(FULL_DELTA));
    });

    it('uses config when only config is provided', () => {
      const res = runHook({ config: { defaultMode: 'lite' } });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(LITE_DELTA));
    });

    it('state takes precedence over config', () => {
      const res = runHook({
        config: { defaultMode: 'lite' },
        state: { mode: 'ultra' },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(ULTRA_DELTA));
      assert.ok(!res.stdout.includes(LITE_DELTA));
    });

    it('env variable takes precedence over state and config', () => {
      const res = runHook({
        env: { CHECKMATE_DEFAULT_MODE: 'lite' },
        state: { mode: 'ultra' },
        config: { defaultMode: 'full' },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(LITE_DELTA));
      assert.ok(!res.stdout.includes(ULTRA_DELTA));
    });

    it('env variable is case-insensitive', () => {
      const res = runHook({
        env: { CHECKMATE_DEFAULT_MODE: 'ULTRA' },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(ULTRA_DELTA));
    });
  });

  describe('invalid values fall through', () => {
    it('invalid env falls through to state', () => {
      const res = runHook({
        env: { CHECKMATE_DEFAULT_MODE: 'invalid_mode' },
        state: { mode: 'ultra' },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(ULTRA_DELTA));
    });

    it('invalid state falls through to config', () => {
      const res = runHook({
        state: { mode: 'nonsense' },
        config: { defaultMode: 'lite' },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(LITE_DELTA));
    });

    it('invalid config falls through to full default', () => {
      const res = runHook({
        config: { defaultMode: 'bogus' },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(FULL_DELTA));
    });

    it('invalid env, state, and config all fall through to full default', () => {
      const res = runHook({
        env: { CHECKMATE_DEFAULT_MODE: 'unknown' },
        state: { mode: 'not_a_mode' },
        config: { defaultMode: 'also_invalid' },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(FULL_DELTA));
    });
  });

  describe('\'off\' produces empty stdout', () => {
    it('produces empty stdout with exit 0 when env is off', () => {
      const res = runHook({
        env: { CHECKMATE_DEFAULT_MODE: 'off' },
      });
      assert.equal(res.exitCode, 0);
      assert.equal(res.stdout, '');
    });

    it('produces empty stdout with exit 0 when state is off', () => {
      const res = runHook({
        state: { mode: 'off' },
      });
      assert.equal(res.exitCode, 0);
      assert.equal(res.stdout, '');
    });

    it('produces empty stdout with exit 0 when config is off', () => {
      const res = runHook({
        config: { defaultMode: 'off' },
      });
      assert.equal(res.exitCode, 0);
      assert.equal(res.stdout, '');
    });
  });

  describe('corrupt JSON -> exit 0 and full payload', () => {
    it('corrupt state.json exits 0 and falls through to full payload', () => {
      const res = runHook({
        state: '{ "mode": "ultra", broken json ...',
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(FULL_DELTA));
    });

    it('corrupt config.json exits 0 and falls through to full payload', () => {
      const res = runHook({
        config: 'not json at all {{{{',
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(FULL_DELTA));
    });

    it('both state and config corrupt exits 0 and returns full payload', () => {
      const res = runHook({
        state: '<<<corrupt>>>',
        config: '<<<corrupt>>>',
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(CORE_RULES));
      assert.ok(res.stdout.includes(FULL_DELTA));
    });
  });

  describe('payload byte size < 2048 for each mode', () => {
    const modes = ['lite', 'full', 'ultra'];
    for (const mode of modes) {
      it(`mode "${mode}" payload byte size is strictly less than 2048 bytes`, () => {
        const res = runHook({
          env: { CHECKMATE_DEFAULT_MODE: mode },
        });
        assert.equal(res.exitCode, 0);
        const byteSize = Buffer.byteLength(res.stdout, 'utf8');
        assert.ok(
          byteSize < 2048,
          `Payload for mode "${mode}" is ${byteSize} bytes, expected < 2048`
        );
        assert.ok(byteSize > 0, `Payload for mode "${mode}" should not be empty`);
      });
    }
  });

  describe('CLI setter (--set <mode>)', () => {
    it('sets mode to lite, writes project state, and prints lite payload', () => {
      const res = runHook({ args: ['--set', 'lite'] });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(LITE_DELTA));
      assert.equal(res.state?.projects?.[process.cwd()], 'lite');
    });

    it('sets mode to off, writes project state, and outputs "checkmate: off"', () => {
      const res = runHook({ args: ['--set', 'off'] });
      assert.equal(res.exitCode, 0);
      assert.equal(res.stdout, 'checkmate: off\n');
      assert.equal(res.state?.projects?.[process.cwd()], 'off');
    });

    it('isolates mode per project directory without leaking to other projects', () => {
      const projectA = '/tmp/fake-project-a';
      const projectB = '/tmp/fake-project-b';
      const res = runHook({
        args: ['--set', 'ultra', '--project', projectA],
      });
      assert.equal(res.exitCode, 0);
      assert.equal(res.state?.projects?.[projectA], 'ultra');

      // Hook run in project A resolves ultra
      const resA = runHook({
        state: res.state,
        env: { CHECKMATE_PROJECT_DIR: projectA },
      });
      assert.ok(resA.stdout.includes(ULTRA_DELTA));

      // Hook run in project B with res.state unchanged falls back to full (does NOT leak ultra)
      const resB = runHook({
        state: res.state,
        env: { CHECKMATE_PROJECT_DIR: projectB },
      });
      assert.ok(resB.stdout.includes(FULL_DELTA));
      assert.ok(!resB.stdout.includes(ULTRA_DELTA));
    });

    it('--set --global updates top-level global mode', () => {
      const res = runHook({ args: ['--set', 'ultra', '--global'] });
      assert.equal(res.exitCode, 0);
      assert.equal(res.state?.mode, 'ultra');
    });

    it('resolves session and project directory from Claude Code hook stdin JSON', () => {
      const sessionId = 'claude-sess-999';
      const projectDir = '/tmp/project-from-hook-stdin';
      const res = runHook({
        state: {
          sessions: { [sessionId]: 'ultra' },
          projects: { [projectDir]: 'lite' },
        },
        input: {
          session_id: sessionId,
          cwd: projectDir,
        },
      });
      assert.equal(res.exitCode, 0);
      // Session takes precedence over project
      assert.ok(res.stdout.includes(ULTRA_DELTA));

      // Project resolves when session has no override
      const resProject = runHook({
        state: {
          projects: { [projectDir]: 'lite' },
        },
        input: {
          session_id: 'unknown-session',
          cwd: projectDir,
        },
      });
      assert.equal(resProject.exitCode, 0);
      assert.ok(resProject.stdout.includes(LITE_DELTA));
    });

    it('isolates mode per session id', () => {
      const sessionId = 'session-12345';
      const res = runHook({
        state: {
          mode: 'lite',
          sessions: { [sessionId]: 'ultra' },
        },
        env: { CHECKMATE_SESSION_ID: sessionId },
      });
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes(ULTRA_DELTA));
    });
  });

  describe('Windows APPDATA configuration resolution', () => {
    it('writes state to APPDATA/checkmate when platform is win32 and APPDATA is present', () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'checkmate-win-test-'));
      const fakeAppData = join(tempDir, 'AppData', 'Roaming');
      mkdirSync(fakeAppData, { recursive: true });
      try {
        const testScript = `
          Object.defineProperty(process, 'platform', { value: 'win32' });
          process.env.APPDATA = ${JSON.stringify(fakeAppData)};
          delete process.env.CHECKMATE_STATE_DIR;
          delete process.env.CHECKMATE_CONFIG_DIR;
          await import(${JSON.stringify(HOOK_SCRIPT)});
        `;
        execFileSync(process.execPath, ['--input-type=module', '-e', testScript, '--', '--set', 'ultra', '--global'], {
          encoding: 'utf8',
        });
        const writtenState = join(fakeAppData, 'checkmate', 'state.json');
        assert.ok(existsSync(writtenState));
        const state = JSON.parse(readFileSync(writtenState, 'utf8'));
        assert.equal(state.mode, 'ultra');
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('reads state from APPDATA/checkmate when platform is win32 and APPDATA is present', () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'checkmate-win-test-'));
      const fakeAppData = join(tempDir, 'AppData', 'Roaming');
      const stateDir = join(fakeAppData, 'checkmate');
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(join(stateDir, 'state.json'), JSON.stringify({ mode: 'lite' }), 'utf8');
      try {
        const testScript = `
          Object.defineProperty(process, 'platform', { value: 'win32' });
          process.env.APPDATA = ${JSON.stringify(fakeAppData)};
          delete process.env.CHECKMATE_STATE_DIR;
          delete process.env.CHECKMATE_CONFIG_DIR;
          delete process.env.CHECKMATE_DEFAULT_MODE;
          await import(${JSON.stringify(HOOK_SCRIPT)});
        `;
        const stdout = execFileSync(process.execPath, ['--input-type=module', '-e', testScript], {
          encoding: 'utf8',
        });
        assert.ok(stdout.includes(LITE_DELTA));
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
