// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const server = new McpServer(
  {
    capabilities: {
      resources: {},
      tools: {}
    },
    name: 'zerocracy-mcp-server',
    version: '0.0.5'
  },
);
