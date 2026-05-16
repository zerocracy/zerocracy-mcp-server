// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

export const baza = async function(path: string, method: string,
  params: Record<string, string>, body: string): Promise<string> {
  const base = 'https://www.zerocracy.com';
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
  let response: Response;
  try {
    response = await fetch(uri, meta);
  } catch (err) {
    const cause = err as Error;
    const error = new Error(
      `Network failure for ${method} ${uri}: ${cause.message}`
    );
    (error as Error & { cause?: unknown }).cause = err;
    throw error;
  }
  if (response.status != 200) {
    let error = `HTTP error ${response.status}`;
    const why = response.headers.get('X-Zerocracy-Failure');
    if (why) {
      error += `: ${why}`;
    }
    throw new Error(error);
  }
  return await response.text();
}
