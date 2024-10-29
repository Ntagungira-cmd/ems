

## Description

## EMS
```
Employee management system made with Nest js.
```

## Project setup

```bash
$ npm install
```
## Add the following environment variables to .env
```bash
# Application
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Database
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=

# JWT
JWT_SECRET=

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=<use your gmail>
MAIL_PASSWORD=<use your google app password>
MAIL_FROM=

# OpenAI
OPENAI_API_KEY=<replace with your OPENAI API KEY>
OPENAI_MODEL= gpt-4

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<replace with a redis password of choice>

```
## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```
## Run a redis-server container using docker for the Bull Mail Queue

```bash
docker run -d --name redis-server -p 6379:6379 -e REDIS_PASSWORD=<password> redis redis-server --requirepass <password>
```

## Run tests

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

