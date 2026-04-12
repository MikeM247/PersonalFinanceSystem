# Personal Finance System

A TypeScript-based personal finance management system with authentication, API, and web interface.

## Project Overview

Personal Finance System is a monorepo application designed to help users manage their personal finances with a secure authentication system, REST API backend, and modern web interface. The project is structured as a TypeScript monorepo with multiple packages and applications.

## Technology Stack

- **Language**: TypeScript 6.0.2
- **Runtime**: Node.js
- **Database**: SQLite
- **Testing**: Playwright (E2E), Node.js built-in test runner
- **Package Manager**: npm

## Project Structure

```
.
├── apps/
│   ├── api/          # REST API application
│   └── web/          # Web UI application
├── packages/
│   ├── core/         # Core business logic
│   └── db/           # Database layer and repositories
├── scripts/          # Build and provisioning scripts
├── docs/             # Documentation
└── package.json      # Root package configuration
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/MikeM247/PersonalFinanceSystem.git
cd PersonalFinanceSystem
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Configuration](#configuration) section below).

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Authentication runtime configuration
AUTH_SESSION_SECRET=replace-with-a-long-random-secret
AUTH_COOKIE_NAME=pfs_session
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=strict
AUTH_SESSION_IDLE_TIMEOUT_MINUTES=120
AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS=168
AUTH_LOGIN_WINDOW_MINUTES=15
AUTH_LOGIN_MAX_ATTEMPTS=5

# Database configuration
AUTH_DATABASE_PATH=./data/personal-finance.sqlite

# Owner bootstrap configuration
AUTH_OWNER_EMAIL=owner@example.com
AUTH_OWNER_PASSWORD=replace-with-a-strong-owner-password
AUTH_OWNER_ID=owner-1
```

### Configuration Details

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SESSION_SECRET` | Secret key for session encryption | Required - generate strong random value |
| `AUTH_COOKIE_NAME` | Session cookie name | `pfs_session` |
| `AUTH_COOKIE_SECURE` | Use HTTPS-only cookies | `true` |
| `AUTH_COOKIE_SAME_SITE` | SameSite cookie policy | `strict` |
| `AUTH_SESSION_IDLE_TIMEOUT_MINUTES` | Session idle timeout | `120` minutes |
| `AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS` | Maximum session duration | `168` hours (7 days) |
| `AUTH_LOGIN_WINDOW_MINUTES` | Login attempt window | `15` minutes |
| `AUTH_LOGIN_MAX_ATTEMPTS` | Max login attempts per window | `5` |
| `AUTH_DATABASE_PATH` | SQLite database file path | `./data/personal-finance.sqlite` |
| `AUTH_OWNER_EMAIL` | Initial owner account email | `owner@example.com` |
| `AUTH_OWNER_PASSWORD` | Initial owner account password | Required - use strong password |
| `AUTH_OWNER_ID` | Initial owner account ID | `owner-1` |

## Database

### Overview

Personal Finance System uses **SQLite** as the database engine for data persistence.

### Database Details

- **Type**: SQLite
- **Location**: Configured via `AUTH_DATABASE_PATH` environment variable (default: `./data/personal-finance.sqlite`)
- **Repositories**: Located in `packages/db/` with authentication-focused repository implementations

### Database Initialization

The database is automatically initialized on first run. To manually provision the owner account:

```bash
npm run provision:owner
```

This script will:
1. Build all packages
2. Create the SQLite database if it doesn't exist
3. Initialize default tables and schema
4. Create the initial owner account with credentials from `.env`

### Database Schema

The database includes tables for:
- User accounts
- Authentication sessions
- Security credentials
- Transaction history (extensible)

See `packages/db/` for schema definitions and migrations.

## Building

### Build All Packages

```bash
npm run build
```

This command runs the complete build pipeline:

1. **Database Package** (`build:db`):
   - Compiles TypeScript in `packages/db/`
   - Copies database assets

2. **Core Package** (`build:core`):
   - Compiles TypeScript in `packages/core/`

3. **API Application** (`build:api`):
   - Compiles TypeScript in `apps/api/`

4. **Web Application** (`build:web`):
   - Compiles TypeScript in `apps/web/`

### Build Individual Components

```bash
npm run build:db      # Build database package
npm run build:core    # Build core business logic
npm run build:api     # Build API application
npm run build:web     # Build web application
```

### Build Output

- Database package: `packages/db/dist/`
- Core package: `packages/core/dist/`
- API application: `apps/api/dist/`
- Web application: `apps/web/dist/`

Compiled files are referenced via path aliases defined in `package.json`:
- `#api/*` → `apps/api/dist/*`
- `#core/*` → `packages/core/dist/*`
- `#db/*` → `packages/db/dist/*`

## Development

### Type Checking

Validate TypeScript types without building:

```bash
npm run typecheck
```

### Testing

#### Unit Tests

Run all unit tests:

```bash
npm run test
```

Includes tests for:
- SQLite authentication repositories
- Authentication service
- Authentication API

#### End-to-End Tests

Run authentication E2E tests with Playwright:

```bash
npm run test:e2e:auth
```

Start the E2E test server (if needed separately):

```bash
npm run auth:e2e:server
```

## Project Scripts

| Script | Description |
|--------|-------------|
| `build` | Build all packages and applications |
| `build:db` | Build database package |
| `build:core` | Build core business logic |
| `build:api` | Build API application |
| `build:web` | Build web application |
| `provision:owner` | Initialize database and create owner account |
| `auth:e2e:server` | Start E2E authentication test server |
| `test:e2e:auth` | Run Playwright authentication E2E tests |
| `typecheck` | Run TypeScript type checking |
| `test` | Run all unit tests |

## Running the Application

### Production Build

```bash
npm run build
```

### Start API Server

```bash
node apps/api/dist/index.js
```

### Start Web Application

```bash
node apps/web/dist/index.js
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run type checking and tests: `npm run typecheck && npm run test`
4. Commit your changes
5. Submit a pull request

## License

[Add license information if applicable]

## Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/MikeM247/PersonalFinanceSystem/issues).