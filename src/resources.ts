// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { baza } from './baza.js';
import { to_gpt } from './to_gpt.js';
import { server } from './server.js';

// The name of a product goes into the URI encoded, the way the
// `products://{name}` template expands it, so that every URI this listing
// hands out can be read back. Pasting the name in raw made a name with a
// space produce an "Invalid URL", and one with a slash stop matching the
// template at all, while the listing kept advertising both.
export type Resource = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};

// The template hands the variable back exactly as it stands in the URI,
// still encoded, so the name of the product is decoded here before it is
// asked about. A URI typed by hand may carry a percent that starts nothing,
// which cannot be decoded; such a name is taken as it stands, the way every
// name was taken before any of them were encoded.
const decoded = (name: string): string => {
  let plain: string;
  try {
    plain = decodeURIComponent(name);
  } catch {
    plain = name;
  }
  return plain;
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
          const products = csv.split("\n").filter((p) => p.length > 0);
          // The name goes into the URI encoded, the way the
          // `products://{name}` template expands it, so that every URI this
          // listing hands out can be read back. Pasted in raw, a name with a
          // space answered "Invalid URL" and one with a slash stopped
          // matching the template, while the listing advertised both.
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
        { name: 'product', product: decoded(String(name)) },
        ''
      )
    }]
  })
);
