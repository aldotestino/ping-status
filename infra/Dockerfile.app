FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig*.json ./

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

RUN bun install

RUN bun run build

CMD ["bun", "run", "start:app"]