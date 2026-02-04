FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Copy root files for workspace configuration
COPY package.json bun.lock ./

# Copy core-api (dependency) and bot-service
COPY packages/core-api ./packages/core-api
COPY packages/bot-service ./packages/bot-service

# Install dependencies
RUN bun install --frozen-lockfile

# Switch to the package directory
WORKDIR /usr/src/app/packages/bot-service

# Expose port if needed (bot might be just polling or webhook)
# but we can expose default port just in case
EXPOSE 3000

# Run the production script
CMD ["bun", "run", "start"]
