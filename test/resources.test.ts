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

describe('resources', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return 'product1\nproduct2\nproduct3';
      }
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for product ${params.product}`;
      }
      return body;
    });
  });

  test('lists fake resources from baza', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('resources');
    expect(Array.isArray(answer.result?.resources)).toBe(true);
    if (answer.result?.resources?.length === 0) {
      return;
    }
    const resource = answer.result?.resources?.[0];
    expect(resource).toHaveProperty('name');
    expect(resource).toHaveProperty('uri');
    expect(resource).toHaveProperty('description');
  });

  test('fetches fake resource details', async (): Promise<void> => {
    const list = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    if (list.result?.resources?.length === 0) {
      return;
    }
    const name = list.result?.resources?.[0].name;
    expect(name).toBeDefined();
    expect(name).not.toBeNull();
    const rname = name as string;
    expect(rname.length).toBeGreaterThan(0);
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 2,
      method: 'resources/read',
      params: {
        uri: `products://${rname}`
      }
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('contents');
    expect(Array.isArray(answer.result?.contents)).toBe(true);
    expect(answer.result?.contents?.length).toBeGreaterThan(0);
    const content = answer.result?.contents?.[0];
    expect(content).toHaveProperty('uri');
    expect(content).toHaveProperty('text');
  });

  test('skips blank and whitespace-only product records', async (): Promise<void> => {
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return 'product1\n\n   \n\t\nproduct2\n';
      }
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for product ${params.product}`;
      }
      return body;
    });
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    const resources = answer.result?.resources as Array<{name: string; uri: string}>;
    expect(resources.map((r) => r.name)).toStrictEqual(['product1', 'product2']);
    expect(resources.map((r) => r.uri)).toStrictEqual([
      'products://product1',
      'products://product2'
    ]);
  });

  test('trims surrounding whitespace from product names', async (): Promise<void> => {
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return '  product one  \n\tproduct2\t\n';
      }
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for product ${params.product}`;
      }
      return body;
    });
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    const resources = answer.result?.resources as Array<{
      name: string; uri: string; description: string
    }>;
    expect(resources.map((r) => r.name)).toStrictEqual(['product one', 'product2']);
    expect(resources.map((r) => r.uri)).toStrictEqual([
      'products://product one',
      'products://product2'
    ]);
    expect(resources[0].description).toContain('"product one"');
  });

  test('handles CRLF product records', async (): Promise<void> => {
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return 'product1\r\n   \r\nproduct2\r\n';
      }
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for product ${params.product}`;
      }
      return body;
    });
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    const resources = answer.result?.resources as Array<{name: string; uri: string}>;
    expect(resources.map((r) => r.name)).toStrictEqual(['product1', 'product2']);
  });

  test('filters empty products from trailing newlines', async (): Promise<void> => {
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return 'product1\nproduct2\n';
      }
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for product ${params.product}`;
      }
      return body;
    });
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('resources');
    const resources = answer.result?.resources as Array<{name: string; uri: string}>;
    expect(resources.length).toBe(2);
    for (const r of resources) {
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.uri).toMatch(/^products:\/\//);
    }
  });
});
