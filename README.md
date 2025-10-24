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

Create a `.env` file in the root directory for **local development**:

```env
# Monitor configuration
MONITOR_INTERVAL_MINUTES=1  # Used ONLY for local development (runs continuously on interval)
MONITOR_CONCURRENCY=5       # Number of monitors to ping concurrently

# Optional: Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Important**: 
- **Local Development**: Set `MONITOR_INTERVAL_MINUTES` to run the pinger continuously on the specified interval
- **Docker/Production**: Do NOT set `MONITOR_INTERVAL_MINUTES`. The `docker-compose.yml` explicitly excludes it because PM2's cron schedule handles timing. If set, the pinger will run in continuous mode and PM2 cron won't work properly.

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
docker exec -it <container-name> pm2 logs api
docker exec -it <container-name> pm2 logs pinger
```

#### Configuring Pinger Schedule

The pinger runs on a cron schedule in production. To modify the interval, edit `infra/ecosystem.config.cjs`:

```javascript
cron_restart: "*/1 * * * *"  // Every minute (default)
// cron_restart: "*/5 * * * *"  // Every 5 minutes
// cron_restart: "*/15 * * * *"  // Every 15 minutes
```

Cron format: `minute hour day month weekday`
- `*/1 * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour at minute 0

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
