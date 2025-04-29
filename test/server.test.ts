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

  test('returns simple answer from baza', async () => {
    const stdin = new Readable(
      {
        read: () => serializeMessage(
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
          }
        )
      }
    );
    const buffer = new ReadBuffer();
    const stdout = new Writable(
      {
        write(chunk, encoding, callback) {
          buffer.append(chunk);
          console.log('boom!');
          callback();
        }
      }
    );
    await server.connect(new StdioServerTransport(stdin, stdout));
    await server.close();
    expect(buffer.readMessage()).not.toBeNull();
  });
});
