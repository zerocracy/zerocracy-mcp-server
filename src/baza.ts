// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

export const baza = async function(path: string, method: string,
  params: Record<string, string>, body: string, signal?: AbortSignal): Promise<string> {
  const base = process.env.ZEROCRACY_HOST ?? 'https://www.zerocracy.com';
  const query = new URLSearchParams(params);
  const uri = `${base}${path}?${query.toString()}`;
  const headers: HeadersInit = new Headers();
  headers.set('Content-Type', 'text/plain');
  const token = process.env.ZEROCRACY_TOKEN;
  if (!token) {
    throw new Error("You must set ZEROCRACY_TOKEN environment variable");
  }
  headers.set('X-Zerocracy-Token', token);
  const meta: Record<string, unknown> = {
    method: method,
    headers: headers,
    redirect: 'manual',
    signal: signal
  };
  if (body.length > 0) {
    meta['body'] = body;
  }
  const timeout = Number(process.env.ZEROCRACY_TIMEOUT_MS ?? '30000');
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 2147483647) {
    throw new Error('ZEROCRACY_TIMEOUT_MS must be an integer between 1 and 2147483647');
  }
  const controller = new AbortController();
  const cancel = (): void => controller.abort(signal?.reason);
  if (signal?.aborted) {
    cancel();
  } else {
    signal?.addEventListener('abort', cancel, { once: true });
  }
  meta['signal'] = controller.signal;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    let response: Response;
    try {
      response = await fetch(uri, meta);
      if (response.status === 200) {
        return await response.text();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const why = controller.signal.aborted && !signal?.aborted
        ? `timed out after ${timeout}ms` : message;
      throw new Error(`Network failure for ${method} ${uri}: ${why}`);
    }
    let error = `HTTP error ${response.status}`;
    const why = response.headers.get('X-Zerocracy-Failure');
    if (why) {
      error += `: ${why}`;
    }
    throw new Error(error);
  } finally {
    signal?.removeEventListener('abort', cancel);
    clearTimeout(timer);
    controller.abort();
  }
}
