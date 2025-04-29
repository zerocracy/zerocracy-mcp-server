# SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
# SPDX-License-Identifier: MIT

.PHONY: all test
TSS=$(shell find . -not -path './node_modules/**' -not -path './test/**' -name '*.ts')

all: test lint it tsc

lint:
	npx eslint . --config eslint.config.mjs

test:
	npx jest --preset ts-jest

it:
	npx @modelcontextprotocol/inspector --config fixtures/claude-desktop-config.json --server zerocracy --cli --method tools/list | jq empty

run:
	./index.ts

tsc: $(TSS)
	npx tsc --target es2020 --module nodenext --outDir dist $(TSS)
