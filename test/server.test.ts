// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { Readable, Writable } from "node:stream";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { ReadBuffer, serializeMessage } from "@modelcontextprotocol/sdk/shared/stdio.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { describe, expect, test } from '@jest/globals';
import { server } from '../src/server';
import { FakeTransport } from './fake-transport';

describe('server', () => {
  test('connects to transport', async () => {
    const transport = new FakeTransport();
    await server.connect(transport);
    expect(server.isConnected()).toBe(true);
  });

  test('lists all tools', async () => {
    const serializedMessage = serializeMessage({
      jsonrpc: "2.0" as const,
      id: 1,
      method: 'tools/list',
    });
    const stdin = new Readable({
      read() {
        this.push(serializedMessage);
        this.push(null);
      }
    });
    const buffer = new ReadBuffer();
    const stdout = new Writable({
      write(chunk, encoding, callback) {
        buffer.append(chunk);
        callback();
      }
    });
    await server.connect(new StdioServerTransport(stdin, stdout));
    await new Promise(resolve => setTimeout(resolve, 500));
    await server.close();
    const answer = buffer.readMessage();
    expect(answer).not.toBeNull();
    // expect(answer['result']['tools'].length).toBeGreaterThan(0);
  });
});
