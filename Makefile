.DEFAULT_GOAL := usage

install:
	cd functions && npm install

lint:
	cd functions && npm run lint

lint-fix:
	cd functions && npm run lint-fix

start:
	firebase emulators:start

usage:
	@echo usage: [install, lint, lint-fix, start]
