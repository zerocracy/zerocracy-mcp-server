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

const mulberry = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const exotic = ['é', 'ü', 'Ω', '日', 'ß', 'ñ', 'λ', 'ø'];
const reserved = ['/', '?', '#', '%', '&', '=', '+', ',', ':', ';', '@', '*', '[', ']'];
const blanks = [' ', '\t'];

const seededNames = (seed: number): string[] => {
  const rnd = mulberry(seed);
  const pick = (pool: string[]): string => pool[Math.floor(rnd() * pool.length)];
  const names: string[] = [];
  while (names.length < 3) {
    const name = pick(exotic) + pick(reserved) + pick(blanks)
      + pick(reserved) + pick(exotic);
    if (!names.includes(name)) {
      names.push(name);
    }
  }
  return names;
};

const seed = Number(process.env.SEED ?? Math.floor(Math.random() * 0xffffffff));

const { once } = await import('./helpers/once.js');

describe('resources', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return seededNames(seed).join('\n');
      }
      if (path === '/mcp/resource' && method === 'PUT' && params.name === 'product') {
        return `Details for product ${params.product}`;
      }
      return body;
    });
  });

  test('lists fake resources from baza', async (): Promise<void> => {
    const names = seededNames(seed);
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    expect(answer.result).toHaveProperty('resources');
    const resources = answer.result?.resources as Array<{name: string; uri: string}>;
    expect([seed, resources.map((r) => r.name)]).toStrictEqual([seed, names]);
    expect([seed, resources.length]).toStrictEqual([seed, 3]);
    for (const r of resources) {
      expect([seed, /[^\x00-\x7f]/.test(r.name)]).toStrictEqual([seed, true]);
      expect([seed, /\s/.test(r.name)]).toStrictEqual([seed, true]);
      expect([seed, /[/?#%&=+,:;@!$'()*\[\]]/.test(r.name)]).toStrictEqual([seed, true]);
      expect([seed, r.uri.startsWith('products://')]).toStrictEqual([seed, true]);
    }
  });

  test('fetches fake resource details', async (): Promise<void> => {
    const names = seededNames(seed);
    const list = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'resources/list'
    });
    const resources = list.result?.resources as Array<{name: string; uri: string}>;
    expect([seed, resources.length]).toStrictEqual([seed, names.length]);
    for (const resource of resources) {
      const answer = await once({
        jsonrpc: '2.0' as const,
        id: 2,
        method: 'resources/read',
        params: {
          uri: resource.uri
        }
      });
      const content = answer.result?.contents?.[0];
      expect([seed, content?.text]).toStrictEqual([
        seed, `Details for product ${resource.name}`
      ]);
    }
  });

  test('skips blank and whitespace-only product records', async (): Promise<void> => {
    const names = seededNames(seed);
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return `${names[0]}\n\n   \n\t\n${names[1]}\n`;
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
    expect([seed, resources.map((r) => r.name)]).toStrictEqual([seed, names.slice(0, 2)]);
  });

  test('trims surrounding whitespace from product names', async (): Promise<void> => {
    const names = seededNames(seed);
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return `  ${names[0]}  \n\t${names[1]}\t\n`;
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
    expect([seed, resources.map((r) => r.name)]).toStrictEqual([seed, names.slice(0, 2)]);
    const tail = `${names[0].slice(-1)}"`;
    expect([seed, resources[0].description.includes(tail)]).toStrictEqual([seed, true]);
  });

  test('handles CRLF product records', async (): Promise<void> => {
    const names = seededNames(seed);
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return `${names[0]}\r\n   \r\n${names[1]}\r\n`;
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
    expect([seed, resources.map((r) => r.name)]).toStrictEqual([seed, names.slice(0, 2)]);
  });

  test('filters empty products from trailing newlines', async (): Promise<void> => {
    const names = seededNames(seed);
    mock.mockImplementation(async (path, method, params, body) => {
      if (path === '/products' && method === 'GET') {
        return `${names[0]}\n${names[1]}\n`;
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
    expect(answer.result).toHaveProperty('resources');
    const resources = answer.result?.resources as Array<{name: string; uri: string}>;
    expect([seed, resources.map((r) => r.name)]).toStrictEqual([seed, names.slice(0, 2)]);
    for (const r of resources) {
      expect([seed, r.uri.startsWith('products://')]).toStrictEqual([seed, true]);
    }
  });
});
