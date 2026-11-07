#!/usr/bin/env node

// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

const { spawn } = require('node:child_process');
const { constants } = require('node:os');

const child = spawn(process.execPath, [
  require.resolve('tsx/cli'), require.resolve('./index.ts'), ...process.argv.slice(2)
], { stdio: 'inherit' });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 128 + constants.signals[signal] : 1);
});
