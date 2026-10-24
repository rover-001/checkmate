import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const BUILD_SCRIPT = join(ROOT_DIR, 'scripts', 'build.mjs');
const DIST_DIR = join(ROOT_DIR, 'dist');

const CORE_RULES_RAW = readFileSync(join(ROOT_DIR, 'rules', 'checkmate.md'), 'utf8');
const CORE_RULES_TRIMMED = CORE_RULES_RAW.trim();

function hashDist(dir) {
  const hashes = {};
  function walk(current) {
    const entries = readdirSync(current).sort((a, b) => a.localeCompare(b));
    for (const entry of entries) {
      const full = join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile()) {
        const rel = relative(dir, full);
        const content = readFileSync(full);
        hashes[rel] = createHash('sha256').update(content).digest('hex');
      }
    }
  }
  walk(dir);
  return hashes;
}

describe('checkmate build system', () => {
  before(() => {
    execFileSync(process.execPath, [BUILD_SCRIPT], { cwd: ROOT_DIR });
  });

  describe('directory structure and payloads', () => {
    it('generates dist/claude-code with full plugin payload', () => {
      const claudeDir = join(DIST_DIR, 'claude-code');
      assert.ok(existsSync(join(claudeDir, '.claude-plugin', 'plugin.json')));
      assert.ok(existsSync(join(claudeDir, 'hooks', 'hooks.json')));
      assert.ok(existsSync(join(claudeDir, 'hooks', 'checkmate-instructions.js')));
      assert.ok(existsSync(join(claudeDir, 'commands', 'checkmate.md')));
      assert.ok(existsSync(join(claudeDir, 'rules', 'checkmate.md')));
      assert.ok(existsSync(join(claudeDir, 'rules', 'modes', 'full.md')));
      assert.ok(existsSync(join(claudeDir, 'skills', 'checkmate', 'SKILL.md')));
    });

    it('generates dist/codex with AGENTS.md and skill file noting @checkmate', () => {
      const codexDir = join(DIST_DIR, 'codex');
      const agentsFile = join(codexDir, 'AGENTS.md');
      const skillFile = join(codexDir, 'skills', 'checkmate', 'SKILL.md');

      assert.ok(existsSync(agentsFile));
      assert.ok(existsSync(skillFile));

      const agentsText = readFileSync(agentsFile, 'utf8');
      assert.ok(agentsText.includes('@checkmate'), 'AGENTS.md must note @checkmate trigger');
      assert.ok(agentsText.includes('## Modes'), 'AGENTS.md must include Modes section');

      const skillText = readFileSync(skillFile, 'utf8');
      assert.ok(skillText.includes('@checkmate'), 'Codex SKILL.md must note @checkmate trigger');
      assert.ok(skillText.includes('name: checkmate'));
    });

    it('generates dist/opencode with command file and AGENTS.md instructions', () => {
      const opencodeDir = join(DIST_DIR, 'opencode');
      const cmdFile = join(opencodeDir, '.opencode', 'command', 'checkmate.md');
      const agentsFile = join(opencodeDir, 'AGENTS.md');

      assert.ok(existsSync(cmdFile), 'OpenCode command file must exist');
      assert.ok(existsSync(agentsFile), 'OpenCode AGENTS.md must exist');

      const cmdText = readFileSync(cmdFile, 'utf8');
      assert.match(cmdText, /^---\r?\ndescription:/, 'OpenCode command must have YAML frontmatter');

      const agentsText = readFileSync(agentsFile, 'utf8');
      assert.ok(agentsText.includes('## Modes'), 'OpenCode AGENTS.md must include Modes section');
    });

    it('generates dist/cursor with .cursor/rules/checkmate.mdc and valid frontmatter', () => {
      const cursorRule = join(DIST_DIR, 'cursor', '.cursor', 'rules', 'checkmate.mdc');
      assert.ok(existsSync(cursorRule), 'Cursor checkmate.mdc must exist');

      const text = readFileSync(cursorRule, 'utf8');
      assert.match(text, /^---\r?\n/, 'Cursor rule must start with YAML frontmatter');
      assert.match(text, /description:\s*["'].+["']/, 'Cursor rule must have description');
      assert.match(text, /globs:\s*["']?["']?/, 'Cursor rule must have empty globs');
      assert.match(text, /alwaysApply:\s*true/, 'Cursor rule must have alwaysApply: true');
    });
  });

  describe('verbatim core rules guarantee', () => {
    const agentFiles = [
      'claude-code/rules/checkmate.md',
      'claude-code/skills/checkmate/SKILL.md',
      'codex/AGENTS.md',
      'codex/skills/checkmate/SKILL.md',
      'opencode/AGENTS.md',
      'opencode/.opencode/command/checkmate.md',
      'cursor/.cursor/rules/checkmate.mdc',
    ];

    for (const relPath of agentFiles) {
      it(`dist/${relPath} contains rules/checkmate.md text verbatim`, () => {
        const fullPath = join(DIST_DIR, relPath);
        assert.ok(existsSync(fullPath), `File dist/${relPath} must exist`);
        const content = readFileSync(fullPath, 'utf8');
        assert.ok(
          content.includes(CORE_RULES_TRIMMED),
          `File dist/${relPath} does not contain rules/checkmate.md text verbatim`
        );
      });
    }
  });

  describe('idempotency and determinism', () => {
    it('produces identical file lists and hashes when run twice', () => {
      execFileSync(process.execPath, [BUILD_SCRIPT], { cwd: ROOT_DIR });
      const firstRunHashes = hashDist(DIST_DIR);

      execFileSync(process.execPath, [BUILD_SCRIPT], { cwd: ROOT_DIR });
      const secondRunHashes = hashDist(DIST_DIR);

      const filesFirst = Object.keys(firstRunHashes).sort();
      const filesSecond = Object.keys(secondRunHashes).sort();

      assert.deepStrictEqual(
        filesFirst,
        filesSecond,
        'File list must be identical across build runs'
      );

      for (const file of filesFirst) {
        assert.strictEqual(
          firstRunHashes[file],
          secondRunHashes[file],
          `Hash mismatch for file ${file} across build runs`
        );
      }
    });

    it('contains no timestamps or non-deterministic artifacts', () => {
      const hashes = hashDist(DIST_DIR);
      for (const file of Object.keys(hashes)) {
        const content = readFileSync(join(DIST_DIR, file), 'utf8');
        assert.ok(!content.includes('Build time:'), `File ${file} contains build timestamp`);
        assert.ok(!content.includes('Generated on:'), `File ${file} contains timestamp`);
      }
    });
  });
});
