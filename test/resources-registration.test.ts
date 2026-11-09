// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, jest, test } from '@jest/globals';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

const { server } = await import('../src/server.js');
const registered = jest.spyOn(server, 'registerResource');
const tools = jest.spyOn(server, 'registerTool');
const prompts = jest.spyOn(server, 'registerPrompt');
const deprecated = jest.spyOn(server, 'resource');
await import('../src/resources.js');
await import('../src/tools.js');
await import('../src/prompts.js');

describe('resources registration', () => {
  test('registers every capability through the current API', (): void => {
    expect(deprecated).not.toHaveBeenCalled();
    expect(registered).toHaveBeenCalledTimes(1);
    expect(tools).toHaveBeenCalledTimes(1);
    expect(prompts).toHaveBeenCalledTimes(1);
    const [name, template, config] = registered.mock.calls[0];
    expect(name).toBe('product');
    expect(template).toBeInstanceOf(ResourceTemplate);
    expect(config).toStrictEqual({});
  });
});
