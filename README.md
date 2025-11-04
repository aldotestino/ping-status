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
- **Process Manager**: PM2 - Production process manager with load balancing
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

The pinger service uses Effect's internal cron scheduler, so `MONITOR_INTERVAL_MINUTES` is required in both local development and Docker/production environments.

Create a `.env` file in the root directory for **local development**:

```env
# Monitor configuration
MONITOR_INTERVAL_MINUTES=1  # Interval in minutes between ping cycles (1-120)
MONITOR_CONCURRENCY=5       # Number of monitors to ping concurrently (1-10)
PORT=3000                   # API server port (default: 3000)
DATABASE_PATH=../../ping-status.db  # Path to SQLite database file

# Optional: Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Note**: In Docker, `MONITOR_INTERVAL_MINUTES` defaults to 1 minute (set in `docker-compose.yml`). The pinger runs as a long-running process that schedules itself internally using Effect's cron scheduler.

### Running with Docker

Build and run the standalone container:

```bash
docker-compose up --build standalone
```

The service will be available at `http://localhost:8080`

The container automatically:
- Runs database migrations on startup
- Manages both API and pinger services with PM2
- Restarts services automatically on crashes
- Maintains logs in `/app/logs/` directory

#### Accessing Logs

View PM2 process status:

```bash
docker exec -it <container-name> pm2 status
```

View logs:

```bash
docker exec -it <container-name> pm2 logs
```

View specific service logs:

```bash
docker exec -it <container-name> pm2 logs app
docker exec -it <container-name> pm2 logs pinger
```

#### Configuring Pinger Schedule

The pinger uses Effect's internal cron scheduler. To modify the ping interval, set the `MONITOR_INTERVAL_MINUTES` environment variable:

- In `docker-compose.yml` for Docker deployments
- In your `.env` file for local development

The pinger runs as a long-running process that schedules itself internally. Supported values: 1-120 minutes.

### Local Development

Install dependencies:

```bash
bun install
```

Generate database migrations (after schema changes):

```bash
bun run db:generate
```

Run database migrations:

```bash
bun run db:migrate
```

**Note**: In Docker, migrations run automatically on container startup.

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

### Database

The application uses SQLite for data persistence. The database file location depends on the environment:

- **Local Development**: `ping-status.db` in the project root (or path specified by `DATABASE_PATH`)
- **Docker**: `/app/data/ping-status.db` (mounted from `./data` directory)

To view/edit the database directly:

```bash
bun run db:studio
```

## Project Structure

- `apps/api` - API server (Hono + oRPC)
- `apps/web` - Web frontend (React)
- `apps/pinger` - Monitoring service
- `packages/db` - Database schema and client
- `packages/config` - Environment variable validation and monitor configuration
- `packages/monitor` - Monitor configuration types
- `infra/` - Docker configuration
