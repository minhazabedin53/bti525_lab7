# ---------- Builder Stage ----------
# Use an official Node.js Alpine image, pinned by digest for supply-chain integrity
FROM node:22-alpine@sha256:bd26af08779f746650d95a2e4d653b0fd3c8030c44284b6b98d701c9b5eb66b9 AS builder

# Metadata
LABEL maintainer="Minhaz Abedin mabedin1@myseneca.ca"
LABEL description="Fragments Node.js microservice (builder stage)"

# Working directory
WORKDIR /app

# Copy only package files first to leverage layer caching
COPY package*.json ./

# Deterministic install of dependencies
RUN npm ci --only=production

# Copy app source
COPY ./src ./src
# Include the .htpasswd file used for Basic Auth
COPY ./tests/.htpasswd ./tests/.htpasswd


# ---------- Runtime Stage ----------
FROM node:22-alpine@sha256:bd26af08779f746650d95a2e4d653b0fd3c8030c44284b6b98d701c9b5eb66b9 AS runtime

LABEL maintainer="Minhaz Abedin mabedin1@myseneca.ca"
LABEL description="Fragments Node.js microservice (runtime stage)"

# Install dumb-init and curl for signal handling and health checks
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Copy only the built runtime files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tests/.htpasswd ./tests/.htpasswd
COPY package*.json ./

# Environment configuration
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false \
    PORT=8080

# Drop privileges for security
USER node

# Health check (verifies the service is responding on port 8080)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/ || exit 1

# Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Expose the service port
EXPOSE 8080

# Start the service (uses the "start" script from package.json)
CMD ["npm", "start"]
