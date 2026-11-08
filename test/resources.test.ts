// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, test, jest, beforeEach } from '@jest/globals';

type Baza = (
  path: string, method: string,
  params: Record<string, string>, body: string
) => Promise<string>;
const mock = jest.fn<Baza>();

jest.unstable_mockModule('../src/baza.js', () => ({
  baza: mock,
}));

const { once } = await import('./helpers/once.js');

const listing = async (
  csv: string
): Promise<Array<{ name: string; uri: string; description?: string }>> => {
  mock.mockImplementation(async (path, method, params, body) => {
    if (path === '/products' && method === 'GET') {
      return csv;
    }
    return body;
  });
  const answer = await once({
    jsonrpc: '2.0' as const,
    id: 1,
    method: 'resources/list'
  });
  return answer.result?.resources as Array<{
    name: string; uri: string; description?: string
  }>;
};

describe('resources', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for product ${params.product}`;
      }
      return body;
    });
  });

  test('lists the products from baza', async (): Promise<void> => {
    const resources = await listing('product1\nproduct2\nproduct3');
    expect(resources.map((r) => r.name)).toStrictEqual([
      'product1',
      'product2',
      'product3'
    ]);
  });

  test('lists products under their products:// URIs', async (): Promise<void> => {
    const resources = await listing('product1\nproduct2\nproduct3');
    expect(resources.map((r) => r.uri)).toStrictEqual([
      'products://product1',
      'products://product2',
      'products://product3'
    ]);
  });

  test('describes each product by its name', async (): Promise<void> => {
    const resources = await listing('product1\nproduct2\nproduct3');
    expect(resources.map((r) => r.description)).toStrictEqual([
      'A software product named "product1" is being developed by'
        + ' a team of programmers under the supervision of Zerocracy.',
      'A software product named "product2" is being developed by'
        + ' a team of programmers under the supervision of Zerocracy.',
      'A software product named "product3" is being developed by'
        + ' a team of programmers under the supervision of Zerocracy.'
    ]);
  });

  test('reads a product by a fixed URI', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/read',
      params: {
        uri: 'products://product1'
      }
    });
    expect(answer.result?.contents?.[0].text).toBe('Details for product product1');
  });

  test('returns the requested URI in the read contents', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/read',
      params: {
        uri: 'products://product1'
      }
    });
    expect(answer.result?.contents?.[0].uri).toBe('products://product1');
  });

  test('skips blank and whitespace-only product records', async (): Promise<void> => {
    const resources = await listing('product1\n\n   \n\t\nproduct2\n');
    expect(resources.map((r) => r.name)).toStrictEqual(['product1', 'product2']);
  });

  test('trims surrounding whitespace from product names', async (): Promise<void> => {
    const resources = await listing('  product one  \n\tproduct2\t\n');
    expect(resources.map((r) => r.name)).toStrictEqual(['product one', 'product2']);
  });

  test('handles CRLF product records', async (): Promise<void> => {
    const resources = await listing('product1\r\n   \r\nproduct2\r\n');
    expect(resources.map((r) => r.name)).toStrictEqual(['product1', 'product2']);
  });

  test('filters empty records after a trailing newline', async (): Promise<void> => {
    const resources = await listing('product1\nproduct2\n');
    expect(resources.map((r) => r.name)).toStrictEqual(['product1', 'product2']);
  });
});
