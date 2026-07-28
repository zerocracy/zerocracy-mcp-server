#!/usr/bin/env -S npx tsx

// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from './src/server.js';
import './src/tools.js';
import './src/resources.js';
import './src/prompts.js';

(async (): Promise<void> => {
  await server.connect(new StdioServerTransport());
})().catch((err: unknown): void => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
