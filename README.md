# Swarm Secrets Manager

> A simple Hono server to manage Docker Sarm secrets and configs.

## OpenTelemetry

This app uses Deno's built-in OpenTelemetry integration:
https://docs.deno.com/runtime/fundamentals/open_telemetry/

Telemetry can be enabled by setting `OTEL_DENO=true`.

Useful environment variables:

- `OTEL_DENO=true` to enable OpenTelemetry.
- `OTEL_SERVICE_NAME=swarm-secrets-manager` to set the service name.
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` to point to an OTLP collector.
- `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` (default) or `console` for debugging.
- `OTEL_DENO_CONSOLE=capture|ignore|replace` to control whether `console.*` logs are exported.

For Docker/Swarm deployments, set these variables in the service environment.

