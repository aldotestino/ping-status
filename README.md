# ping-status

A monitoring service that pings configured endpoints and tracks their status over time.

## Features

- Monitor multiple endpoints with configurable intervals
- Track response times and status codes
- Automatic incident detection and notification
- SQLite database for persistence
- Web dashboard for viewing monitor status and history
- API for accessing monitoring data

## Technology Stack

- **Runtime**: [Bun](https://bun.com) - Fast all-in-one JavaScript runtime
- **Database**: SQLite (via bun:sqlite)
- **ORM**: Drizzle ORM
- **API**: Hono + oRPC
- **Frontend**: React + TanStack Query + TanStack Router

## Standalone Setup

This branch (`standalone`) provides a single-container deployment that runs both the web app and pinger service.

### Prerequisites

- Docker and Docker Compose
- Bun (for local development)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Monitor configuration
MONITOR_INTERVAL_MINUTES=1
MONITOR_CONCURRENCY=5

# Optional: Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Running with Docker

Build and run the standalone container:

```bash
docker-compose up --build standalone
```

The service will be available at `http://localhost:8080`

### Local Development

Install dependencies:

```bash
bun install
```

Generate database migrations:

```bash
bun run db:generate
```

Run database migrations:

```bash
bun run db:migrate
```

Run the pinger service (in one terminal):

```bash
bun run pinger
```

Run the API server (in another terminal):

```bash
bun run api
```

Run the web development server (in another terminal):

```bash
bun run web
```

Or run both services together:

```bash
bun run start:standalone
```

### Database

The application uses SQLite for data persistence. The database file (`ping-status.db`) is stored in the application's working directory.

To view/edit the database directly:

```bash
bun run db:studio
```

## Project Structure

- `apps/api` - API server (Hono + oRPC)
- `apps/web` - Web frontend (React)
- `apps/pinger` - Monitoring service
- `packages/db` - Database schema and client
- `packages/env` - Environment variable validation
- `packages/monitor` - Monitor configuration
- `infra/` - Docker configuration
