# SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
# SPDX-License-Identifier: MIT

.PHONY: all test lint it tsc clean
.ONESHELL:
.SHELLFLAGS := -e -o pipefail -c
.SECONDARY:
SHELL := bash

all: test lint it tsc

lint:
	npx -y eslint . --config eslint.config.mjs

test:
	node --experimental-vm-modules node_modules/.bin/jest --config jest.config.ts --no-color --ci

it:
	mkdir -p temp
	npx -y @modelcontextprotocol/inspector --config test/fixtures/claude-desktop-config.json \
		--server zerocracy --cli --method tools/list > temp/tools.json
	jq empty temp/tools.json || { cat temp/tools.json; exit 1; }
	rm -rf temp

tsc:
	npx -y tsc --noEmit --project tsconfig.json

clean:
	rm -rf dist temp coverage
