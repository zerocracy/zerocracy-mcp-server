// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { Readable, Writable } from "node:stream";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { ReadBuffer, serializeMessage } from "@modelcontextprotocol/sdk/shared/stdio.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { describe, expect, test } from '@jest/globals';
import { server } from '../src/server';
import { baza } from '../src/baza';
import { FakeTransport } from './fake-transport';
import '../src/tools';
import '../src/resources';
import '../src/prompts';

const waitForResponse = async (buffer: ReadBuffer, msec = 5000): Promise<JSONRPCMessage | null> => {
  const start = Date.now();
  let message: JSONRPCMessage | null = null;
  while (Date.now() - start < msec) {
    message = buffer.readMessage();
    if (message !== null) {
      return message;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timeout waiting for response');
};

type ResponseType = JSONRPCMessage & {
  result?: {
    content?: Array<Record<string, unknown>>,
    tools?: Array<Record<string, unknown>>,
    resources?: Array<Record<string, unknown>>,
    prompts?: Array<Record<string, unknown>>,
    messages?: Array<Record<string, unknown>>,
    contents?: Array<Record<string, unknown>>
  }
};

const processOne = async (message: JSONRPCMessage): Promise<ResponseType> => {
  const stdin = new Readable({
    read(): void {
      this.push(serializeMessage(message));
      this.push(null);
    }
  });
  const buffer = new ReadBuffer();
  const stdout = new Writable({
    write(chunk, encoding, callback): void {
      buffer.append(chunk);
      callback();
    }
  });
  await server.connect(new StdioServerTransport(stdin, stdout));
  const answer = await waitForResponse(buffer, 10000);
  await server.close();
  if (answer == null) {
    throw new Error('No message returned');
  }
  return answer as ResponseType;
};

describe('server', () => {
  const before = process.env.ZEROCRACY_TOKEN;

  beforeEach(() => {
    process.env.ZEROCRACY_TOKEN = '00000000-0000-0000-0000-000000000000';
  });

  // Restore after each test
  afterEach(() => {
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
  });

  test('lists all tools', async (): Promise<void> => {
    const answer = await processOne({
      jsonrpc: "2.0" as const,
      id: 1,
      method: 'tools/list',
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('tools');
    expect(Array.isArray(answer.result?.tools)).toBe(true);
    expect(answer.result?.tools?.length).toBeGreaterThan(0);
  });

  test('takes advice from baza', async (): Promise<void> => {
    const csv = await baza('/products', 'GET', {}, '');
    if (csv.length === 0) {
      return;
    }
    const product = csv.split("\n")[0];
    const answer = await processOne({
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
    const answer = await processOne({
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

  test('fetches resource details', async (): Promise<void> => {
    const list = await processOne({
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
    const answer = await processOne({
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
    const answer = await processOne({
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
    const answer = await processOne({
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
