// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

// import fetch, { Headers } from 'node-fetch';

export const baza = async function(path: string, method: string,
  params: Record<string, string>, body: string): Promise<string> {
  const base = 'https://www.zerocracy.com';
  const query = new URLSearchParams(params);
  const uri = `${base}${path}?${query.toString()}`;
  const headers: HeadersInit = new Headers();
  headers.set('Content-Type', 'text/plain');
  const token = process.env.ZEROCRACY_TOKEN;
  if (token) {
    headers.set('X-Zerocracy-Token', token);
  }
  const meta: Record<string, any> = {
    method: method,
    headers: headers,
    redirect: 'manual'
  };
  if (body.length > 0) {
    meta['body'] = body;
  }
  const response = await fetch(uri, meta);
  if (response.status != 200) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return await response.text();
}
