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

describe('tools', () => {
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
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'tools/call',
      params: {
        name: 'give_management_advice',
        arguments: {
          product: 'product1',
          concern: 'what is going on?'
        }
      },
    });
    expect(answer.result).not.toHaveProperty('isError', true);
    expect(answer.result?.content).toEqual([
      { type: 'text', text: 'Some advice for product product1' }
    ]);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(
      '/mcp/tool', 'PUT', { name: 'advice', product: 'product1' }, 'what is going on?'
    );
  });

  test.each([
    { field: 'product', kind: 'empty', value: '' },
    { field: 'product', kind: 'whitespace-only', value: ' \t\n ' },
    { field: 'concern', kind: 'empty', value: '' },
    { field: 'concern', kind: 'whitespace-only', value: ' \t\n ' }
  ])('rejects $kind $field without calling baza', async ({ field, value }): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'tools/call',
      params: {
        name: 'give_management_advice',
        arguments: {
          product: 'product1',
          concern: 'what is going on?',
          [field]: value
        }
      }
    });
    expect(answer.result).toHaveProperty('isError', true);
    expect(answer.result?.content?.[0].text).toContain('Input validation error');
    expect(answer.result?.content?.[0].text).toContain(field);
    expect(mock).not.toHaveBeenCalled();
  });

  test('trims valid arguments before calling baza', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'tools/call',
      params: {
        name: 'give_management_advice',
        arguments: {
          product: ' \tproduct1\n ',
          concern: '\n what is going on? \t'
        }
      }
    });
    expect(answer.result).not.toHaveProperty('isError', true);
    expect(answer.result?.content).toEqual([
      { type: 'text', text: 'Some advice for product product1' }
    ]);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(
      '/mcp/tool', 'PUT', { name: 'advice', product: 'product1' }, 'what is going on?'
    );
  });
});
