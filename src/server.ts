// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const server = new McpServer(
  {
    name: 'zerocracy-mcp-server',
    version: '0.0.0'
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
);
