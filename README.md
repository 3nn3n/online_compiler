#  Online Compiler

A small code-submission app with a React frontend, an Express API, a Redis queue, and a worker that runs submitted programs.

## Project Structure

- `backend/` - Express API, Prisma schema, and database access.
- `worker/` - consumes submissions from Redis, runs the submitted code, and saves results.
- `frontend /` - React interface. The directory name currently includes a trailing space.

## Requirements

- Bun
- Redis, listening on `localhost:6379`
- Node.js, Python 3, and `g++` for the worker's supported runtimes

## Setup

Install dependencies in each package:

```bash
(cd backend && bun install)
(cd worker && bun install)
(cd "frontend " && bun install)
```

Set `DATABASE_URL` in `backend/.env` to the PostgreSQL connection string for your local database. The worker also reads `DATABASE_URL`; copy the backend environment file if both services use the same database:

```bash
cp backend/.env worker/.env
```

Start Redis in its own terminal:

```bash
redis-server
```

Start the local Prisma Postgres service from `backend/` (skip this if it is already running):

```bash
cd backend
bunx --bun prisma dev --detach
```

Apply the Prisma schema when setting up the database for the first time, or after schema changes:

```bash
cd backend
bunx --bun prisma migrate dev --name init
```

## Run

Run each service in a separate terminal:

```bash
cd backend
bun run index.ts
```

```bash
cd worker
bun run index.ts
```

```bash
cd "frontend "
bun run dev
```

The API listens on `http://localhost:3000`; the frontend dev server uses `http://localhost:3003`.

## Submission Flow

The frontend posts code to `POST /submission`. The API stores a pending submission and queues it in Redis. The worker runs it and records the result; the frontend can retrieve it with `GET /submission/:submissionId`.