FROM denoland/deno:2.3.7

WORKDIR /app

# curl is required by logic/api/actual.ts to call the Docker API over the Unix socket.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY . .

# Pre-cache remote dependencies at build time to speed up startup.
RUN deno cache main.tsx

ENV PORT=3000
ENV OTEL_DENO=true
ENV OTEL_SERVICE_NAME=swarm-secrets-manager
EXPOSE 3000

CMD ["run", "--log-level=debug", "--allow-net", "--allow-env", "--allow-read=/app", "--allow-run=curl", "--no-prompt", "main.tsx"]
