# Promocodes API

REST API for promocodes built with NestJS, TypeScript, PostgreSQL, and Prisma.

## Quick Start

Install dependencies:

```bash
npm install
```

Run integration tests:

```bash
npm run test:integration
```

Run the application in Docker:

```bash
npm run docker:start
```

The API will be available at `http://localhost:3000`.

Swagger UI is available at `http://localhost:3000/docs`.

Useful grouped commands:

```bash
npm run check
npm run docker:start
npm run test:integration
```

## Features

- Promocode CRUD: create, list, read, update, delete.
- Promocode activation by email.
- One email can activate the same promocode only once.
- Activation limit is protected by a transactional atomic update.
- Expired promocodes cannot be activated.

## Testing Flow

```bash
npm run test:integration
```

This command:

- starts PostgreSQL from `docker-compose.yaml`;
- creates the `promocodes_test` database if it does not exist;
- loads `.env.test`;
- resets only the `promocodes_test` database;
- applies Prisma migrations;
- runs integration tests against a real PostgreSQL database.

The application database `promocodes` is not touched by integration tests.

Run all checks:

```bash
npm run check
```

This command runs lint, build, unit-test placeholder, and integration tests.

## Docker App Flow

```bash
npm run docker:start
```

This command:

- starts PostgreSQL from `docker-compose.yaml`;
- waits until PostgreSQL is ready;
- applies Prisma migrations to the application database `promocodes`;
- builds and starts the API container.

The API is available at `http://localhost:3000`.

Swagger UI is available at `http://localhost:3000/docs`.

The last step runs Docker Compose in the foreground, so stop it with `Ctrl+C`.

## Local Setup

```bash
npm install
```

Create `.env` or copy `.env.example`:

```env
DATABASE_URL="postgresql://postgres:notabigsecret@localhost:5432/promocodes?schema=public"
APP_PORT=3000
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100
LOG_LEVEL=debug
```

Start PostgreSQL:

```bash
docker compose up -d db
```

Generate Prisma Client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Migration history lives in `prisma/migrations`.

## Run

```bash
npm run start:dev
```

The API is available at `http://localhost:3000` by default.

## Endpoints

```http
POST /promocodes
GET /promocodes
GET /promocodes/:code
PATCH /promocodes/:code
DELETE /promocodes/:code
POST /promocodes/:code/activate
```

Create example:

```json
{
  "code": "SALE10",
  "discountPercent": 10,
  "activationLimit": 100,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

Activation example:

```json
{
  "email": "user@example.com"
}
```

For a fresh local setup:

```bash
npm run setup
```
