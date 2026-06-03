// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';

const mockConnect = jest.fn<() => Promise<void>>();

jest.mock('../src/server', () => ({
  server: {
    connect: mockConnect,
    tool: jest.fn(),
    resource: jest.fn(),
    prompt: jest.fn(),
  }
}));

describe('index', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as () => never);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('handles server connect failure', async () => {
    mockConnect.mockRejectedValue(new Error('Connection failed'));
    await import('../index');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(console.error).toHaveBeenCalledWith(
      'Failed to start MCP server:', expect.any(Error)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
