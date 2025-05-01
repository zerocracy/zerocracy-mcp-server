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
      if (path === '/mcp/tool' && method === 'PUT' && params.name === 'advice') {
        return `Some advice for product ${params.product}`;
      }
      return body;
    });
  });

  test('takes fake advice from baza', async (): Promise<void> => {
    const csv = await baza('/products', 'GET', {}, '');
    if (csv.length === 0) {
      return;
    }
    const product = csv.split("\n")[0];
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'tools/call',
      params: {
        name: 'give_management_advice',
        arguments: {
          product: product,
          concern: 'what is going on?'
        }
      },
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('content');
    expect(Array.isArray(answer.result?.content)).toBe(true);
    expect(answer.result?.content?.length).toBeGreaterThan(0);
    const text = answer.result?.content?.[0].text;
    expect(text).not.toContain('HTTP error');
  });
});
