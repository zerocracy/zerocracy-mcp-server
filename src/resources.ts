// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { baza } from './baza';
import { to_gpt } from './to_gpt';
import { server } from './server';

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
        let list: Array<Resource> = [];
        if (csv.length !== 0) {
          const products = csv.split("\n");
          list = products.map((product) => ({
            uri: `products://${product}`,
            name: product,
            description: to_gpt(
              `
              A software product named \"${product}\" is being developed by
              a team of programmers under the supervision of Zerocracy.
              `
            ),
            mimeType: 'text/plain'
          }));
        }
        return { resources: list };
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
