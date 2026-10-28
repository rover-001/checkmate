import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GAIN = join(__dirname, '..', 'skills', 'checkmate-gain', 'gain.mjs');

function assistantLine(id, text) {
  return JSON.stringify({ type: 'assistant', message: { id, usage: { output_tokens: 10 }, content: [{ type: 'text', text }] } });
}

describe('checkmate-gain session classifier', () => {
  it('classifies only SessionStart-injected sessions as checkmate sessions', () => {
    const root = mkdtempSync(join(tmpdir(), 'checkmate-gain-test-'));
    const projects = join(root, 'projects');

    const injected = join(projects, 'proj-a');
    mkdirSync(injected, { recursive: true });
    writeFileSync(join(injected, 'session.jsonl'), [
      JSON.stringify({ type: 'attachment', attachment: { type: 'hook_success', hookEvent: 'SessionStart', stdout: '# checkmate\n\nGoal-driven mode. Reach the user\'s win condition.\n' } }),
      assistantLine('a1', 'working'),
    ].join('\n') + '\n');

    const reviewed = join(projects, 'proj-b');
    mkdirSync(reviewed, { recursive: true });
    writeFileSync(join(reviewed, 'session.jsonl'), [
      JSON.stringify({ type: 'user', message: { content: 'Read rules/checkmate.md' } }),
      JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: '# checkmate\n\nGoal-driven mode. Reach the user\'s win condition.' }] } }),
      assistantLine('b1', 'reviewed'),
    ].join('\n') + '\n');

    const out = execFileSync(process.execPath, [GAIN], {
      env: { ...process.env, CLAUDE_PROJECTS_DIR: projects, CHECKMATE_SUMMARY: join(root, 'missing.json') },
      encoding: 'utf8',
    });

    assert.match(out, /Checkmate Sessions \(1 sessions/);
    assert.match(out, /Baseline Sessions \(1 sessions/);
  });
});
