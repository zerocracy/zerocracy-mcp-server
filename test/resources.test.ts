// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { baza } from '../src/baza';
import { once } from './helpers/once';

jest.mock('../src/baza');

describe('resources', () => {
  const mock = jest.mocked(baza);

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
});
