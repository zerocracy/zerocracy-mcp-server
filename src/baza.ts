// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

const MAX_RETRIES = 3;

const retriable = (method: string, status: number): boolean =>
  (method === 'GET' || method === 'PUT') && (status === 429 || status >= 500);

const pause = async (response: Response, attempt: number): Promise<void> => {
  const raw = response.headers.get('Retry-After')?.trim() ?? '';
  let ms = Number(raw) * 1000;
  if (raw === '' || !Number.isFinite(ms)) {
    const date = Date.parse(raw);
    ms = Number.isNaN(date) ? NaN : date - Date.now();
  }
  if (!Number.isFinite(ms) || ms < 0) {
    ms = 250 * 2 ** attempt;
  }
  // shortcut: waits capped at 10 s, raise the cap if Baza asks for longer waits
  ms = Math.min(ms, 10000);
  await new Promise<void>((resolve): void => {
    setTimeout(resolve, ms);
  });
};

export const baza = async function(path: string, method: string,
  params: Record<string, string>, body: string): Promise<string> {
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
    redirect: 'manual'
  };
  if (body.length > 0) {
    meta['body'] = body;
  }
  let attempt = 0;
  while (true) {
    let response: Response;
    try {
      response = await fetch(uri, meta);
    } catch (e) {
      throw new Error(
        `Network failure for ${method} ${uri}: ${(e as Error).message}`
      );
    }
    if (response.status === 200) {
      return await response.text();
    }
    if (attempt < MAX_RETRIES && retriable(method, response.status)) {
      await pause(response, attempt);
      attempt += 1;
      continue;
    }
    let error = `HTTP error ${response.status}`;
    const why = response.headers.get('X-Zerocracy-Failure');
    if (why) {
      error += `: ${why}`;
    }
    throw new Error(error);
  }
};
