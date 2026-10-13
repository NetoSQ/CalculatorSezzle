# Arithmetic Calculator

A small full-stack calculator with a React and TypeScript frontend and a Go REST API. The frontend and backend are separate projects: `frontend/` is a Vite app and `backend/` is an independent Go module. The frontend keeps presentation and input feedback in React; arithmetic and authoritative validation live in the backend. The arithmetic package is independent of HTTP, so it can be exercised directly in unit tests.

## Design decisions and assumptions

- The React app owns the calculator display, keypad, keyboard shortcuts, and immediate input feedback. It calls a small typed API client rather than performing calculations locally, keeping the UI independent of the API transport details.
- The Go backend owns arithmetic and definitive validation. Its calculation package is separate from the HTTP handlers, so operation behavior can be unit tested without starting a server.
- The request/response contract is intentionally small: one operation and its operands in, one numeric result out. Consistent JSON errors give the UI a clear message to display.
- The calculator uses a side-by-side display and keypad on wider screens, and a compact, touch-friendly keypad on narrow screens. Keyboard input is available on desktop.
- The frontend checks entries for fast feedback, but the backend remains the source of truth for validation and arithmetic.
- Tests focus on the arithmetic rules, HTTP validation, and frontend API boundary. Mocking the frontend network boundary keeps its tests deterministic and independent of a running Go service.

Assumptions:

- `percent` means divide the entered value by 100: for example, 25 returns 0.25.
- `sqrt` and `percent` are unary operations and only need `a`; the other operations require both `a` and `b`.
- The API accepts one operation per request. The app does not keep calculation history or persist values between reloads.
- Inputs and results use JSON numbers and Go `float64` arithmetic. Non-finite results, including overflow, are rejected.

## Requirements

- Go 1.22 or newer
- Node.js 20 or newer with npm

## Run locally

Start the API from the backend project:

```sh
cd backend
go run ./cmd/server
```

It listens on `http://localhost:8080` by default. Set `ADDR` to change the bind address.

In another terminal, start the web app:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. Set `VITE_API_URL` if the API is hosted somewhere other than `http://localhost:8080` (for example, create `frontend/.env.local` with `VITE_API_URL=https://api.example.com`). The Go service currently allows cross-origin requests from any origin for development; restrict this to the deployed frontend origin before public deployment.

To open the development app from another device on the same network, start Vite with `npm run dev -- --host 0.0.0.0` and set `VITE_API_URL` in `frontend/.env.local` to `http://<computer-ip>:8080`. Then open `http://<computer-ip>:5173` on that device. Restart Vite after changing the environment file.

For a hosted website build, configure `VITE_API_URL` to the public HTTPS API URL, then run `npm run build` from `frontend/` and deploy `frontend/dist/` to a static web host.

## API

`POST /api/calculate` accepts JSON and returns JSON.

```sh
curl -X POST http://localhost:8080/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"multiply","a":6,"b":7}'
```

Square root uses one operand:

```sh
curl -X POST http://localhost:8080/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"sqrt","a":81}'
```

For invalid arithmetic, such as division by zero, the API returns `422`:

```json
{"error":"division by zero"}
```

Successful calculations return `200`, for example `{"result":42}`. Errors use `{ "error": "..." }` with `400` for malformed or incomplete requests and unsupported operations, or `422` for undefined arithmetic such as division by zero or the square root of a negative value. Non-finite results (for example, overflow) are rejected.

| Operation | Inputs | Example |
| --- | --- | --- |
| `add`, `subtract`, `multiply`, `divide`, `power` | `a`, `b` | `{"operation":"power","a":2,"b":8}` |
| `sqrt`, `percent` | `a` | `{"operation":"sqrt","a":81}` |

`percent` returns `a / 100` (so 25 becomes 0.25). `GET /health` returns `{"status":"ok"}`.

## Tests and production build

Run Go unit and HTTP tests from the backend project:

```sh
cd backend
go test ./...
```

Run frontend API-client tests and build the static app:

```sh
cd frontend
npm install
npm test
npm run build
```

The frontend tests mock the HTTP boundary. The Go tests cover arithmetic, validation, and endpoint responses.
