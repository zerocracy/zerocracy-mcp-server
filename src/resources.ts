// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { baza } from './baza.js';
import { to_gpt } from './to_gpt.js';
import { server } from './server.js';

export type Resource = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};

server.resource(
  'product',
  new ResourceTemplate(
    'products://{name}',
    {
      list: async (): Promise<{ resources: Resource[] }> => {
        const csv = await baza('/products', 'GET', {}, '');
        return {
          resources: csv
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
            .map((product) => ({
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
      }
    }
  ),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: await baza(
        '/mcp/resource', 'PUT',
        { name: 'product', product: String(name) },
        ''
      )
    }]
  })
);
