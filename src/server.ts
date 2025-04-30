// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { baza } from './baza';
import { to_gpt } from './to_gpt';

export const server = new McpServer(
  {
    capabilities: {
      resources: {},
      tools: {}
    },
    name: 'zerocracy-mcp-server',
    version: '0.0.0'
  },
);

server.tool(
  'give_management_advice',
  to_gpt(
    `
    Analyze the most critical concern related to product development,
    providing clear insights into the underlying issues, identifying areas for
    improvement, and outlining specific corrective and preventive actions. The
    objective is to directly address and resolve this concern, helping the team
    become more productive, focused, and result-oriented. These recommendations can
    later be converted into new GitHub issues or added as comments to existing
    issues or pull requests.
    `
  ),
  { concern: z.string(), product: z.string() },
  async ({ concern, product }) => {
    return ({
      content: [{
        text: await baza(
          '/mcp/tool', 'PUT',
          { name: 'advice', product: product },
          concern
        ),
        type: 'text'
      }]
    });
  }
);

// Type definition for a resource
type Resource = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};

// Define a function to list products
const listProducts = async (): Promise<{ resources: Resource[] }> => {
  const csv = await baza('/products', 'GET', {}, '');
  const products = csv.split("\n");
  return {
    resources: products.map((product) => ({
      uri: `products://${product}`,
      name: product,
      description: to_gpt(
        `
        A software product named \"${product}\" is being developed by
        a team of programmers under the supervision of Zerocracy.
        `
      ),
      mimeType: 'text/plain'
    }))
  };
};

// Register the product-details resource with list handler
server.resource(
  'product-details',
  new ResourceTemplate('products://{name}/details', { list: listProducts }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: await baza(
        '/mcp/resource', 'PUT',
        { name: 'product-details', product: String(name) },
        ''
      )
    }]
  })
);
