// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, jest, test } from '@jest/globals';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

const { server } = await import('../src/server.js');
const registered = jest.spyOn(server, 'registerResource');
const deprecated = jest.spyOn(server, 'resource');
await import('../src/resources.js');

describe('resources registration', () => {
  test('registers the product template with registerResource', (): void => {
    expect(deprecated).not.toHaveBeenCalled();
    expect(registered).toHaveBeenCalledTimes(1);
    const [name, template, config] = registered.mock.calls[0];
    expect(name).toBe('product');
    expect(template).toBeInstanceOf(ResourceTemplate);
    expect(config).toStrictEqual({});
  });
});
