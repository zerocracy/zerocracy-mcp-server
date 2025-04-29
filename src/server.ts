// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';

export const server = new McpServer(
  {
    capabilities: {
      tools: {}
    },
    name: 'zerocracy-mcp-server',
    version: '0.0.0'
  },
);

server.tool(
  'give_an_advice',
  `
  Analyze the most critical concern related to product development,
  providing clear insights into the underlying issues, identifying areas for
  improvement, and outlining specific corrective and preventive actions. The
  objective is to directly address and resolve this concern, helping the team
  become more productive, focused, and result-oriented. These recommendations can
  later be converted into new GitHub issues or added as comments to existing
  issues or pull requests.
  `,
  { concern: z.string(), product: z.string() },
  ({ concern, product }) => ({
    content: [{
      text: `The development of your product ("${product}") goes well: ${concern}!`,
      type: 'text'
    }]
  })
);
