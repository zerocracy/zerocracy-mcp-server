// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, jest, test } from '@jest/globals';

describe('index', () => {
  afterEach((): void => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('reports server connection failures before exiting', async (): Promise<void> => {
    const failure = new Error('stdio connection failed');
    const connect = jest.fn<() => Promise<void>>().mockRejectedValue(failure);
    jest.unstable_mockModule('../src/server', () => ({
      server: { connect }
    }));
    jest.unstable_mockModule(
      '@modelcontextprotocol/sdk/server/stdio.js',
      () => ({
        StdioServerTransport: jest.fn(() => ({}))
      })
    );
    jest.unstable_mockModule('../src/tools', () => ({}));
    jest.unstable_mockModule('../src/resources', () => ({}));
    jest.unstable_mockModule('../src/prompts', () => ({}));
    const logged = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exited = jest.spyOn(process, 'exit').mockImplementation((): never => {
      return undefined as never;
    });
    const unhandled = jest.fn();
    process.prependOnceListener('unhandledRejection', unhandled);

    await import('../index.js');
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    process.removeListener('unhandledRejection', unhandled);
    expect(logged).toHaveBeenCalledWith('Failed to start MCP server:', failure);
    expect(exited).toHaveBeenCalledWith(1);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
