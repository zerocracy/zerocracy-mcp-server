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

const decode = (name: string): string => {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
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
          const products = csv
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
          list = products.map((product) => ({
            uri: `products://${encodeURIComponent(product)}`,
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
        { name: 'product', product: decode(String(name)) },
        ''
      )
    }]
  })
);
