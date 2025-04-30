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

server.resource(
  'product',
  new ResourceTemplate('products://{name}', { list: listProducts }),
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
