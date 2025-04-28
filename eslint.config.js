// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import js from '@eslint/js';
const { configs } = js;

export default [
  {
    ...configs.all,
    files: ['**/*.js', '**/*.ts'],
    ignores: ['dist/', 'node_modules/'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      ...configs.all.rules,
      'indent': ['error', 2],
      'max-len': ['error', { code: 100 }],
      'no-magic-numbers': 'off'
    }
  }
];
