// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { baza } from '../src/baza';
import { once } from '../helpers/once';

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
      return '';
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
});