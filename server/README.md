# RateFlow Backend

Express + SQLite backend for authentication and AI market chat.

## Setup

1. Create `server/.env` (copy from `.env.example`) and set `JWT_SECRET`.
2. Install deps:
   - `cd server`
   - `npm install`

## Run

- `npm start`

## Health check

- `GET http://localhost:4000/api/health` -> `{ ok: true }`

## Auth endpoints

- `POST http://localhost:4000/api/auth/register`
- `POST http://localhost:4000/api/auth/login`
- `GET http://localhost:4000/api/auth/me` (requires `Authorization: Bearer <token>`)

## AI market chat (backend endpoint)

Endpoint:
- `POST http://localhost:4000/api/market-chat`

Env vars:
- `GEMINI_API_KEY` (required)
- `GEMINI_MODEL` (optional, default: `gemini-2.0-flash`)
- `GEMINI_BASE_URL` (optional, default: `https://generativelanguage.googleapis.com`)
