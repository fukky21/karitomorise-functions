.DEFAULT_GOAL := usage

install:
	cd functions && npm install

lint:
	cd functions && npm run lint

lint-fix:
	cd functions && npm run lint-fix

start:
	firebase use default
	firebase emulators:start

deploy:
	firebase use default
	firebase deploy --only functions

deploy-staging:
	firebase use staging
	firebase deploy --only functions

deploy-production:
	firebase use production
	firebase deploy --only functions

usage:
	@echo usage: [install, lint, lint-fix, start, deploy, deploy-staging, deploy-production]
