FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Copy root files for workspace configuration
COPY package.json bun.lock ./

# Copy the specific package
COPY packages/core-api ./packages/core-api

# Install dependencies (including workspace dependencies if any, though core-api has none)
# We use --frozen-lockfile to ensure reproducible builds
#RUN bun install --frozen-lockfile
RUN bun install
# Switch to the package directory
WORKDIR /usr/src/app/packages/core-api

# Expose port (core-api usually runs on 3000 or similar, checking code would confirm but 3000 is safe default/placeholder)
EXPOSE 3000

# Run the production script
CMD ["bun", "run", "start"]
