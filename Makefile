# SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
# SPDX-License-Identifier: MIT

.PHONY: all test lint it tsc clean
.ONESHELL:
.SHELLFLAGS := -e -o pipefail -c
.SECONDARY:
SHELL := bash
TSS=$(shell find . -not -path './.opencode/**' -not -path './node_modules/**' -not -path './test/**' -name '*.ts')

all: test lint it tsc

lint:
	npx -y eslint . --config eslint.config.mjs

test:
	node --experimental-vm-modules node_modules/.bin/jest --config jest.config.ts --no-color --ci

it:
	mkdir -p temp
	npx -y @modelcontextprotocol/inspector --config test/fixtures/claude-desktop-config.json --server zerocracy --cli --method tools/list > temp/tools.json
	jq empty temp/tools.json || (cat temp/tools.json; ./index.ts; exit 1)

tsc: $(TSS)
	npx -y tsc --outDir dist --skipLibCheck $(TSS)

clean:
	rm -rf dist temp coverage
