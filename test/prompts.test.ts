// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, test } from '@jest/globals';
import { once } from './helpers/once.js';
import '../src/prompts';

describe('prompts', () => {
  test('lists all prompts', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'prompts/list',
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('prompts');
    expect(Array.isArray(answer.result?.prompts)).toBe(true);
    expect(answer.result?.prompts?.length).toBeGreaterThan(0);
  });

  test('returns prompt with given product name', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'prompts/get',
      params: {
        name: 'investigate-productivity-bottlenecks',
        arguments: {
          product: 'test-app'
        }
      }
    });
    expect(answer).toHaveProperty('result');
    expect(answer.result).toHaveProperty('messages');
    expect(answer.result?.messages?.length).toBeGreaterThan(0);
    const content = answer.result?.messages?.[0]?.content as { text?: string };
    expect(content?.text).toContain('test-app');
    expect(content?.text).not.toContain('\n');
  });

  test('handles empty product name', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'prompts/get',
      params: {
        name: 'investigate-productivity-bottlenecks',
        arguments: {
          product: ''
        }
      }
    });
    expect(answer.result?.messages?.length).toBeGreaterThan(0);
    const content = answer.result?.messages?.[0]?.content as { text?: string };
    expect(typeof content?.text).toBe('string');
  });

  test('handles special characters in product name', async (): Promise<void> => {
    const answer = await once({
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'prompts/get',
      params: {
        name: 'investigate-productivity-bottlenecks',
        arguments: {
          product: 'foo/bar@v1.0!'
        }
      }
    });
    expect(answer.result?.messages?.length).toBeGreaterThan(0);
    const content = answer.result?.messages?.[0]?.content as { text?: string };
    expect(content?.text).toContain('foo/bar@v1.0!');
  });
});
