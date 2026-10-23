import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

test('compiled Vercel entry loads in native Node ESM without the tsx resolver', () => {
  const directory = mkdtempSync(join(tmpdir(), 'claw-vercel-entry-'));
  try {
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }));
    for (const source of ['api/relay.ts', 'server/relay.ts']) {
      const output = join(directory, source.replace(/\.ts$/, '.js'));
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(
        output,
        ts.transpileModule(readFileSync(resolve(source), 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
          fileName: source,
        }).outputText,
      );
    }
    const entry = pathToFileURL(join(directory, 'api/relay.js')).href;
    const script = `const {default:handler}=await import(${JSON.stringify(entry)});
      for(const path of ['health','state','me']) {
        const response=await handler.fetch(new Request('https://web.example/api/'+path));
        if(response.status!==503)throw new Error('Expected a controlled configuration response');
      }
      console.log('entry loaded');`;
    const result = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '', API_UPSTREAM: '', PROXY_TOKEN: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.match(result, /entry loaded/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
