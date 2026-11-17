// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = process.cwd();
const npm = process.platform === 'win32'
  ? [process.execPath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')]
  : ['npm'];
const runNpm = (args, options) => execFileSync(npm[0], [...npm.slice(1), ...args], options);
const scratch = mkdtempSync(join(tmpdir(), 'mcp packed runtime '));
const prefix = join(scratch, 'installed');
const outside = join(scratch, 'unrelated');
const cache = join(scratch, 'empty-cache');
for (const path of [prefix, outside, cache]) mkdirSync(path);
let client;
let deadline;
try {
  const result = JSON.parse(runNpm([
    'pack', '--ignore-scripts', '--json', '--pack-destination', scratch
  ], { cwd: root, encoding: 'utf8' }));
  runNpm([
    'install', '--prefix', prefix, '--omit=dev', '--ignore-scripts',
    '--no-audit', '--no-fund', '--package-lock=false', join(scratch, result[0].filename)
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const pkg = JSON.parse(readFileSync(join(prefix, 'node_modules/zerocracy-mcp-server/package.json'), 'utf8'));
  console.log(`Packed bin=${pkg.bin.index}; production tsx=${pkg.dependencies.tsx ?? 'missing'}`);
  const transport = new StdioClientTransport({
    command: process.platform === 'win32' ? process.execPath : join(prefix, 'node_modules/.bin/index'),
    args: process.platform === 'win32'
      ? [join(prefix, 'node_modules/zerocracy-mcp-server', pkg.bin.index)] : [],
    cwd: outside,
    env: {
      ...process.env, ZEROCRACY_TOKEN: 'test-only', npm_config_offline: 'true',
      npm_config_registry: 'http://127.0.0.1:9', npm_config_cache: cache, npm_config_yes: 'false'
    },
    stderr: 'pipe'
  });
  transport.stderr.on('data', (chunk) => process.stderr.write(chunk));
  client = new Client({ name: 'packed-runtime-test', version: '1.0.0' });
  await Promise.race([
    client.connect(transport),
    new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('Packed startup timed out')), 10000); })
  ]);
  const tools = await client.listTools();
  assert(tools.tools.length > 0);
  console.log('PASS: installed bin starts outside the package with empty npm cache and offline registry');
} finally {
  clearTimeout(deadline);
  if (client) await client.close();
  rmSync(scratch, { recursive: true, force: true });
}
