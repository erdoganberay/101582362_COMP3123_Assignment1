# COMP 3123 Assignment 1: Secure Employee Management API

A secure RESTful backend API built with **Node.js, Express and MongoDB**. Users sign up, log in and receive a **JWT**; with that token they can create, read, update and delete **employees**. Every employee belongs to the user who created it, and **a user can only see and manage their own employees**.

> Repository: `101582362_COMP3123_Assignment1`

---

## Table of contents

1. [Technologies](#technologies)
2. [Project structure](#project-structure)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [API endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Authorization (employee ownership)](#authorization-employee-ownership)
8. [Security](#security)
9. [Validation and error handling](#validation-and-error-handling)
10. [Logging](#logging)
11. [Health check](#health-check)
12. [Testing](#testing)

---

## Technologies

| Area | Technology |
|---|---|
| Runtime / framework | Node.js, Express 5 |
| Database | MongoDB 7, Mongoose |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcrypt` (cost factor 12) |
| Validation | `express-validator` |
| Security | `helmet`, `express-rate-limit` |
| Logging | `winston` (application logs), `morgan` (request logs) |
| Configuration | `dotenv` |
| Development | Docker Compose, nodemon |
| Testing | Postman |

---

## Project structure

The code is split into layers, each with a single job:

```text
.
├── server.js                 Entry point: connects to MongoDB, then starts the HTTP server
├── app.js                    Builds the Express app: middleware, routes, error handling
├── config/
│   ├── env.js                Loads and validates environment variables (fails fast)
│   └── db.js                 MongoDB connection
├── models/
│   ├── User.js               User schema (unique username/email, hidden password)
│   └── Employee.js           Employee schema with the `user` owner reference
├── routes/                   URL -> middleware -> controller (Express Router)
├── controllers/              HTTP layer: reads validated input, sends status codes
├── services/                 Business logic: hashing, JWT, ownership checks
├── middleware/
│   ├── auth.js               JWT verification
│   ├── validate.js           Turns validation errors into 400 responses
│   ├── rateLimiter.js        Auth and general API rate limiters
│   └── errorHandler.js       404 handler and central error handler
├── validators/               express-validator rules for users and employees
├── utils/
│   ├── logger.js             Winston logger
│   └── AppError.js           Error class carrying an HTTP status code
├── logs/                     Generated log files (git-ignored) and sample.log
├── postman/                  Postman collection and environment
├── Dockerfile                API image (dev and prod targets)
└── docker-compose.yml        Local development stack (API + MongoDB)
```

How a request flows through the layers:

```text
Request -> helmet -> rate limiter -> JSON parser -> request log
        -> route -> JWT auth (employee routes) -> validation -> controller -> service -> model -> MongoDB
        -> any error -> central error handler -> consistent JSON error
```

---

## Installation

### Option A: Docker (recommended)

Requires Docker with Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/erdoganberay/101582362_COMP3123_Assignment1
cd 101582362_COMP3123_Assignment1

# 2. Configure environment variables
cp .env.example .env
# open .env and set JWT_SECRET to a long random string, for example:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3 + 4. Start MongoDB and the API (dependencies are installed inside the image)
docker compose up --build
```

The API runs at `http://localhost:3000`. Check it with `curl http://localhost:3000/health`.

Useful commands:

| Task | Command |
|---|---|
| Start in the background | `docker compose up -d` |
| Follow API logs | `docker compose logs -f api` |
| Stop | `docker compose down` |
| Stop and delete all data | `docker compose down -v` |

`docker-compose.yml` is for **local development only**: it mounts the source code (nodemon restarts on save) and runs MongoDB without authentication, bound to `127.0.0.1` so it is not reachable from other machines.

### Option B: Without Docker

Requires Node.js 20+ and MongoDB on `localhost:27017`: either a local MongoDB installation, or only the database container with `docker compose up -d mongo`.

```bash
git clone https://github.com/erdoganberay/101582362_COMP3123_Assignment1
cd 101582362_COMP3123_Assignment1
npm install
cp .env.example .env          # set JWT_SECRET and MONGODB_URI
npm run dev                   # or: npm start
```

### Test the API

Import the Postman collection and environment from `postman/` (see [Testing](#testing)).

---

## Configuration

All configuration comes from environment variables. `.env` is git-ignored; `.env.example` lists the variables with safe placeholder values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port |
| `NODE_ENV` | No | `development` | `production` hides internal error details and switches the console log to JSON |
| `MONGODB_URI` | **Yes** | none | MongoDB connection string. The database name is `comp3123_assignment1` |
| `JWT_SECRET` | **Yes** | none | Secret used to sign JWTs. Must be at least 32 characters |
| `JWT_EXPIRES_IN` | No | `1h` | Token lifetime (e.g. `1h`, `30m`) |

`config/env.js` stops the application at startup with a clear message if a required variable is missing or `JWT_SECRET` is too short. There are no default values for secrets in the code.

When running with Docker Compose, `MONGODB_URI` is overridden to `mongodb://mongo:27017/comp3123_assignment1` because, inside the container network, the database is reached by its service name.

---

## API endpoints

Base URL: `http://localhost:3000`

| # | Method | Endpoint | Auth | Success | Description |
|---|---|---|---|---|---|
| | GET | `/health` | No | 200 | Server and database status |
| 1 | POST | `/api/v1/user/signup` | No | **201** | Register a new user |
| 2 | POST | `/api/v1/user/login` | No | **200** | Log in with username or email; returns a JWT |
| 3 | GET | `/api/v1/emp/employees` | JWT | **200** | List the authenticated user's employees |
| 4 | POST | `/api/v1/emp/employees` | JWT | **201** | Create an employee owned by the authenticated user |
| 5 | GET | `/api/v1/emp/employees/{eid}` | JWT | **200** | Get one of the user's employees |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | JWT | **200** | Update one of the user's employees |
| 7 | DELETE | `/api/v1/emp/employees?eid={eid}` | JWT | **204** | Delete one of the user's employees (no response body) |

### Request and response examples

**Signup**

```http
POST /api/v1/user/signup
Content-Type: application/json

{ "username": "user_a", "email": "usera@mail.com", "password": "Password1" }
```

```json
{
  "status": "success",
  "data": {
    "user": { "_id": "...", "username": "user_a", "email": "usera@mail.com", "created_at": "...", "updated_at": "..." }
  }
}
```

**Login** (with `username` or `email`)

```http
POST /api/v1/user/login
Content-Type: application/json

{ "email": "usera@mail.com", "password": "Password1" }
```

```json
{ "status": "success", "data": { "token": "eyJhbGciOi...", "user": { "_id": "...", "username": "user_a", "email": "usera@mail.com" } } }
```

**Create employee**

```http
POST /api/v1/emp/employees
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "email": "ada@example.com",
  "position": "Developer",
  "salary": 5000,
  "date_of_joining": "2026-10-01",
  "department": "IT"
}
```

The response contains the new employee, including `user` (the owner's id, taken from the JWT).

**Update employee:** `PUT` accepts any subset of the employee fields (partial update), e.g. `{ "salary": 6000 }`, and returns the updated employee. At least one field is required.

**Delete employee:** the id is passed in the query string, `DELETE /api/v1/emp/employees?eid=<id>`, and the response is `204 No Content` with an empty body.

### Error response format

Every error uses the same JSON shape:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

`errors` is only present when there are field-level details.

### Status codes

| Code | When |
|---|---|
| 200 OK | Login, list, get, update, health check |
| 201 Created | Signup, create employee |
| 204 No Content | Delete employee |
| 400 Bad Request | Validation failed, malformed JSON, invalid ObjectId, client tried to set the owner |
| 401 Unauthorized | Missing, malformed, invalid or expired JWT; wrong login credentials |
| 403 Forbidden | The employee exists but belongs to another user |
| 404 Not Found | Employee does not exist; unknown route |
| 409 Conflict | Username or email already exists |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected error (details are only logged) |
| 503 Service Unavailable | Health check when the database is disconnected |

---

## Authentication

1. **Signup:** the user registers with a username, email and password. The password is hashed with bcrypt before it is stored.
2. **Login:** the user sends a password together with either their **username or email**. The password is checked with `bcrypt.compare`. Unknown users and wrong passwords get the same `401 Invalid credentials` message, so the API does not reveal which usernames exist.
3. **JWT:** on success the server signs a token with `JWT_SECRET` (HS256). The payload only contains the user id (`sub`) plus issue and expiry times; it never contains the password or other sensitive data. Tokens expire after `JWT_EXPIRES_IN` (1 hour by default).
4. **Authorization header:** the client sends the token on every employee request:

   ```http
   Authorization: Bearer <jwt>
   ```

5. **Protected endpoints:** every route under `/api/v1/emp` passes through `middleware/auth.js`, which:
   - rejects a missing header or a header without the `Bearer` scheme (`401 Authentication required`)
   - verifies the signature and expiry with `jwt.verify` (`401 Invalid token` / `401 Token expired`)
   - puts the user id from the verified token on `req.user.id`

Signup and login are public by design (a user needs them to obtain a token); they are protected by validation and a strict rate limit instead.

---

## Authorization (employee ownership)

**A user can only access employees that belong to that user.** This is enforced on the server in three ways:

1. **Relationship in the database.** Each employee has a required, indexed `user` field that references the `_id` of the user who created it (`ref: 'User'`). One user owns many employees.
2. **The owner always comes from the JWT.** When an employee is created, `user` is set to `req.user.id`. A client that sends a `user` field in the body gets `400`; the API never trusts an owner id supplied by the client.
3. **Every query and every check uses the owner.**
   - Listing only returns `Employee.find({ user: req.user.id })`, so other users' employees are never part of the result.
   - Get, update and delete go through one helper, `findOwnedEmployee`, which returns **404** if the employee does not exist and **403** if it belongs to someone else. Authorization failures are logged.
   - Update and delete additionally filter the database operation by `{ _id: eid, user: req.user.id }` (defence in depth), so changing `eid` in the URL or query string can never reach another user's data.

**Design decision, 403 vs 404:** for an employee owned by another user the API returns `403 Forbidden`. This makes the authorization failure explicit, as required by the assignment. (The alternative, always returning 404, would hide which ids exist.)

This was tested with two users (User A and User B): each one tried to get, update and delete the other's employee, every attempt returned 403, and the data stayed unchanged (see the Postman folder *6. Cross-user access*).

---

## Security

| Measure | Implementation |
|---|---|
| **Password hashing** | bcrypt with cost factor 12: one-way, salted (identical passwords produce different hashes) and deliberately slow to resist brute force. Passwords longer than 72 bytes are rejected because bcrypt ignores the rest. The password field is `select: false` in the schema and removed by a `toJSON` transform, so the hash is never returned in any response. |
| **JWT** | Signed with a secret from the environment, HS256 only, 1-hour expiry, payload contains only the user id. |
| **Helmet** | Adds security headers to every response, including errors: `Content-Security-Policy` (limits where scripts and other resources load from, reducing XSS), `X-Frame-Options` (prevents clickjacking), `X-Content-Type-Options: nosniff` (prevents MIME sniffing), `Strict-Transport-Security` (forces HTTPS), and removes `X-Powered-By` so the server technology is not advertised. |
| **Rate limiting** | See below. |
| **Input validation** | All user-controlled input is validated with express-validator before it reaches the business logic (see next section). Controllers only use `matchedData(req)`, so unexpected fields are dropped. JSON bodies are limited to 10 KB. |
| **Environment variables** | Secrets live only in `.env` (git-ignored) or the hosting platform's settings. `.env.example` documents the variables without real values. The app refuses to start without them. |
| **Containers** | The API container runs as the unprivileged `node` user, and `.env` is excluded from the Docker image. |

### Rate limiting

**What it is:** rate limiting counts how many requests each client IP sends within a time window and rejects requests above the limit. It slows down password guessing (brute force), mass account creation and general abuse.

**Which endpoints are protected:**

| Limiter | Applies to | Limit |
|---|---|---|
| Auth limiter | `POST /api/v1/user/signup`, `POST /api/v1/user/login` | 20 requests per 15 minutes per IP |
| API limiter | Everything under `/api` | 100 requests per 15 minutes per IP |

`/health` is not rate limited so monitoring tools can call it frequently.

**What happens when the limit is exceeded:** the API responds with **`429 Too Many Requests`** and a JSON body, the event is logged, and standard `RateLimit` / `RateLimit-Policy` headers tell the client how long to wait. The auth limiter runs before validation and bcrypt, so blocked requests cost the server almost nothing.

```json
{ "status": "error", "message": "Too many authentication attempts, please try again in 15 minutes" }
```

**Test result:** sending 22 login requests with a wrong password returned `401` for the first 20 and `429` for the remaining requests (Postman folder *9. Rate limit*, screenshot below). Counters are kept in memory and reset when the server restarts; a multi-server deployment would need a shared store such as Redis.

---

## Validation and error handling

**Validation** (`validators/`, `middleware/validate.js`):

| Resource | Rules |
|---|---|
| Signup | username 3-30 characters, letters/numbers/underscore only; valid email (stored lowercase); password 8-72 characters with an uppercase letter, a lowercase letter and a number |
| Login | password required, plus a username or a valid email |
| Employee (create) | all fields required; names max 50 characters; position/department max 100; valid email; salary a number greater than 0; `date_of_joining` a real date in `YYYY-MM-DD` format; `user` must not be sent |
| Employee (update) | same rules, every field optional, at least one field required |
| Employee id | must be a valid MongoDB ObjectId, in the path (`GET`/`PUT`) or the query string (`DELETE`) |

Failed validation returns `400` with a list of `{ field, message }`.

**Error handling** (`middleware/errorHandler.js`): every error, from any layer, ends in one central handler that returns the consistent JSON shape shown above. It translates known errors (malformed JSON → 400, invalid ObjectId → 400, Mongoose validation → 400, duplicate key → 409), uses the status code carried by `AppError` for application errors, and turns anything unexpected into a generic `500 Internal Server Error`. Stack traces and internal messages are written to the log only, never sent to the client. Unknown routes return a JSON `404`.

---

## Logging

**Where:** logs are written locally with winston to the `logs/` directory:

| File | Content |
|---|---|
| `logs/app.log` | All info, warning and error entries |
| `logs/error.log` | Errors only |

Each entry is one JSON line with a timestamp and level. In development the same entries are also printed to the console in a readable format; in production they are printed to stdout as JSON for the hosting platform to collect. Generated `.log` files are git-ignored; `logs/sample.log` contains an example.

**What is logged:**

- server startup, database connection, disconnection and reconnection
- every HTTP request: method, path, status code and response time
- successful signups and logins, and every failed request (4xx), including invalid credentials and rejected tokens
- validation failures
- authorization failures (a user trying to access another user's employee, with user id and employee id)
- employee create, update and delete operations
- rate limit violations (with client IP)
- unexpected errors with full stack traces

**What is intentionally excluded:** passwords, password hashes, JWTs, the JWT secret, database credentials and connection strings are never logged.

---

## Health check

```http
GET /health
```

Returns the server status, uptime in seconds, the current time and the database connection state:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-10-18T22:00:00.000Z",
  "database": "connected"
}
```

If the database is disconnected the endpoint returns `503 Service Unavailable` with `"status": "degraded"` and `"database": "disconnected"`, so monitoring tools can detect the problem from the status code alone. Docker Compose uses this endpoint as the API container's health check.

---

## Testing

All endpoints were tested with **Postman**. The collection and environment are in `postman/`:

- `postman/COMP3123_Assignment1.postman_collection.json`
- `postman/COMP3123_Local.postman_environment.json`

**How to run:**

1. Import both files into Postman and select the **COMP3123 Local** environment.
2. Restart the API (`docker compose restart api`) to reset rate-limit counters.
3. Run folders **1-8** with the Collection Runner. Tokens and employee ids are saved automatically by the scripts, and every request has tests for its expected status code.
4. Run folder **9** on its own with 22 iterations to see the rate limit (429).
5. For the expired-token test, set `JWT_EXPIRES_IN=10s`, restart, log in, paste the token into the `expiredToken` variable, wait 15 seconds and send.

**Covered scenarios:** valid signup; duplicate username and email; invalid email; weak password; missing fields; login with username and with email; invalid and missing credentials; employee create, list, get, update and delete; invalid salary, email and date; client-supplied owner; empty update; invalid and non-existing employee id; missing, malformed, tampered and expired JWT; cross-user get/update/delete in both directions; rate limit exceeded.

### Test credentials

These are non-sensitive test accounts created by the Postman collection:

| User | Username | Email | Password |
|---|---|---|---|
| User A | `user_a` | `usera@mail.com` | `Password1` |
| User B | `user_b` | `userb@mail.com` | `Password1` |

---
