// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { afterAll, beforeAll, describe, expect, jest, test, beforeEach } from '@jest/globals';

type Baza = (
  path: string, method: string,
  params: Record<string, string>, body: string
) => Promise<string>;
const mock = jest.fn<Baza>();

jest.unstable_mockModule('../src/baza.js', () => ({
  baza: mock,
}));

const { FakeTransport } = await import('./fakes/FakeTransport.js');
const { FakeBaza } = await import('./fakes/FakeBaza.js');
const { server } = await import('../src/server.js');
const { once } = await import('./helpers/once.js');
await import('../src/tools.js');
await import('../src/resources.js');
await import('../src/prompts.js');

describe('server', () => {
  const before = process.env.ZEROCRACY_TOKEN;
  const fake = new FakeBaza();

  beforeAll(async (): Promise<void> => {
    process.env.ZEROCRACY_HOST = await fake.start();
  });

  afterAll(async (): Promise<void> => {
    delete process.env.ZEROCRACY_HOST;
    await fake.close();
  });

  beforeEach(() => {
    process.env.ZEROCRACY_TOKEN = '00000000-0000-0000-0000-000000000000';
    jest.resetAllMocks();
    mock.mockImplementation(async (path, method, params) => {
      if (path === '/products' && method === 'GET') {
        return 'product1\nproduct2\nproduct3';
      }
      if (path === '/mcp/tool' && method === 'PUT' && params.name === 'advice') {
        return `Advice for ${params.product}`;
      }
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for ${params.product}`;
      }
      return '';
    });
  });

  afterEach(async () => {
    if (server.isConnected()) {
      await server.close();
    }
    if (before === undefined) {
      delete process.env.ZEROCRACY_TOKEN;
    } else {
      process.env.ZEROCRACY_TOKEN = before;
    }
  });

  test('connects to transport', async (): Promise<void> => {
    const transport = new FakeTransport();
    await server.connect(transport);
    expect(server.isConnected()).toBe(true);
    await server.close();
  });

  test('lists all tools', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'tools/list',
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('tools');
    expect(Array.isArray(answer.result?.tools)).toBe(true);
    expect(answer.result?.tools?.length).toBeGreaterThan(0);
  });

  test('takes advice from baza', async (): Promise<void> => {
    const csv = await mock('/products', 'GET', {}, '');
    const product = csv.split('\n')[0];
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

  test('lists resources from baza', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('resources');
    expect(Array.isArray(answer.result?.resources)).toBe(true);
    expect(answer.result?.resources?.length).toBeGreaterThan(0);
    const resource = answer.result?.resources?.[0];
    expect(resource).toHaveProperty('name');
    expect(resource).toHaveProperty('uri');
    expect(resource).toHaveProperty('description');
  });

  test('fetches resource details', async (): Promise<void> => {
    const list = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
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

  test('lists prompts', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'prompts/list'
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('prompts');
    expect(Array.isArray(answer.result?.prompts)).toBe(true);
    expect(answer.result?.prompts?.length).toBeGreaterThan(0);
    const prompt = answer.result?.prompts?.[0];
    expect(prompt).toHaveProperty('name');
    expect(prompt).toHaveProperty('arguments');
  });

  test('reads one prompt', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'prompts/get',
      params: {
        name: 'investigate-productivity-bottlenecks',
        arguments: {
          product: 'foo'
        }
      }
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('messages');
    expect(Array.isArray(answer.result?.messages)).toBe(true);
    expect(answer.result?.messages?.length).toBeGreaterThan(0);
    const message = answer.result?.messages?.[0];
    expect(message).toHaveProperty('content');
  });
});
