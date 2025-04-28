#! /usr/bin/env npx ts-node

// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer(
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
  Analyze the current situation in product development and provide
  insights into existing issues, identify areas for improvement,
  and outline the necessary corrective and preventive actions.
  The goal is to enhance team productivity, maintain focus,
  and ensure a result-oriented approach. Recommendations provided can be
  transformed into new GitHub issues, comments on existing issues, or pull requests.
  `,
  { concern: z.string(), product: z.string() },
  ({ concern, product }) => ({
    content: [{
      text: `The development of your product ("${product}") goes well: ${concern}!`,
      type: 'text'
    }]
  })
);

await server.connect(new StdioServerTransport());
