import { SpanStatusCode, trace } from "@opentelemetry/api";
import { type Context, Hono, type HonoRequest } from "hono";
import { serveStatic } from "hono/deno";
import { routePath } from "hono/route";
import denoJson from "./deno.json" with { type: "json" };
import {
  createActualApi,
  createMockApi,
  type SecretsApi,
} from "./logic/api/index.ts";
import type { TSecretType } from "./logic/configSchema.ts";
import { appEnv, logEnvConfiguration } from "./logic/env.ts";
import { loadConfigFromPath } from "./logic/loadConfig.ts";
import { redirectTo } from "./logic/redirectTo.ts";
import { redirectWithMessage } from "./logic/redirectWithMessage.ts";
import { buildSecretListItems } from "./logic/secretListItems.ts";
import { ConfigsPage } from "./views/ConfigsPage.tsx";
import { CreateSecretPage } from "./views/CreateSecretPage.tsx";
import { ErrorPage } from "./views/ErrorPage.tsx";
import { NotFoundPage } from "./views/NotFoundPage.tsx";
import { SecretDetailPage } from "./views/SecretDetailPage.tsx";
import { SecretsPage } from "./views/SecretsPage.tsx";

const config = await loadConfigFromPath(appEnv.configJsonPath);

console.log(`Starting Swarm Secrets Manager v${denoJson.version}`);
logEnvConfiguration(appEnv);
console.log(
  `OpenTelemetry ${appEnv.otel.denoEnabled ? "enabled" : "disabled"}`,
);

if (config) {
  console.log(
    `Loaded ${config.secrets.length} expected secrets from ${appEnv.configJsonPath}`,
  );
}

const api: SecretsApi = appEnv.mockSecretsApi
  ? createMockApi()
  : createActualApi();

function isSecretType(value: string | null | undefined): value is TSecretType {
  return value === "string" || value === "json";
}

function getFlash(c: Context) {
  return {
    ok: c.req.query("ok") ?? null,
    error: c.req.query("error") ?? null,
  };
}

const app = new Hono();

app.use("*", async (c, next) => {
  try {
    await next();
  } catch (error) {
    throw error;
  } finally {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const route = routePath(c);
      activeSpan.setAttribute("http.route", route);
      activeSpan.updateName(`${c.req.method} ${route}`);

      if (c.error) {
        activeSpan.recordException(c.error);
        activeSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: c.error.message,
        });
      }
    }
  }
});

app.use(
  "/public/*",
  serveStatic({
    root: "./",
  }),
);

app.onError((err, c) => {
  console.error(err);
  const message = err instanceof Error
    ? err.message
    : "An unexpected error occurred";
  const returnPath = getReferrerOrDefault(c.req);

  return c.html(
    <ErrorPage
      title="Error"
      message={message}
      returnPath={returnPath}
      returnLabel={returnPath === "/secrets" ? "Back to Secrets" : "Back"}
    />,
    500,
    { "cache-control": "no-store" },
  );
});

app.notFound((c) => {
  return c.html(<NotFoundPage />, 404, {
    "cache-control": "no-store",
  });
});

function getReferrerOrDefault(req: HonoRequest): string {
  const referrer = req.header("referer");
  if (
    referrer && (referrer.includes("/secrets") || referrer.includes("/configs"))
  ) {
    try {
      const url = new URL(referrer);
      return url.pathname;
    } catch {
      // Fall through to default
    }
  }
  return "/secrets";
}

app.get("/", () => {
  return redirectTo("/secrets");
});

app.get("/secrets", async (c) => {
  try {
    const secrets = await api.listSecrets();
    const secretListItems = buildSecretListItems(secrets, config);
    const { ok, error } = getFlash(c);

    return await c.html(
      <SecretsPage secrets={secretListItems} ok={ok} error={error} />,
      200,
      { "cache-control": "no-store" },
    );
  } catch (error) {
    console.error(error);
    throw new Error(
      `Unable to list secrets: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

app.get("/secrets/create", async (c) => {
  const requestedType = c.req.query("type");
  const requestedName = c.req.query("name")?.trim();

  const allSecrets = await api.listSecrets();
  const existingSecret = requestedName
    ? allSecrets.find((item) => item.name === requestedName) ?? null
    : null;
  const expectedSecret = requestedName
    ? config?.secrets.find((item) => item.name === requestedName) ?? null
    : null;

  const resolvedType: TSecretType = isSecretType(requestedType)
    ? requestedType
    : expectedSecret?.type ?? "string";
  const resolvedName = requestedName ?? "";
  const defaultValue = expectedSecret?.type === "json"
    ? expectedSecret.options?.defaultTemplate ?? ""
    : "";

  const { ok, error } = getFlash(c);

  return await c.html(
    <CreateSecretPage
      name={resolvedName}
      type={resolvedType}
      description={expectedSecret?.description ?? null}
      defaultValue={defaultValue}
      existingSecret={existingSecret}
      ok={ok}
      error={error}
    />,
    200,
    { "cache-control": "no-store" },
  );
});

app.get("/secret/:id", async (c) => {
  const id = c.req.param("id");
  const secret = await api.getSecret(id);
  const expectedSecret = config?.secrets.find((item) =>
    item.name === secret.name
  );
  const { ok, error } = getFlash(c);

  return await c.html(
    <SecretDetailPage
      secret={secret}
      description={expectedSecret?.description ?? null}
      type={expectedSecret?.type ?? null}
      ok={ok}
      error={error}
    />,
    200,
    { "cache-control": "no-store" },
  );
});

app.get("/configs", async (c) => {
  try {
    const configs = await api.listConfigs();
    const { ok, error } = getFlash(c);

    return await c.html(
      <ConfigsPage count={configs.length} ok={ok} error={error} />,
      200,
      { "cache-control": "no-store" },
    );
  } catch (error) {
    throw new Error(
      `Unable to list configs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

app.post("/secrets/create", async (c) => {
  try {
    const form = await c.req.formData();
    const name = String(form.get("name") ?? "").trim();
    const type = String(form.get("type") ?? "").trim();
    const value = String(form.get("value") ?? "");
    const overwriteExisting =
      String(form.get("overwriteExisting") ?? "") === "1";
    const rotateOriginalName = String(form.get("rotateOriginalName") ?? "")
      .trim();
    let rotated = false;

    const invalidName = api.validateSecretName(name);
    if (invalidName) {
      throw new Error(invalidName);
    }
    if (value.length === 0) {
      throw new Error("Secret value cannot be empty.");
    }

    if (!isSecretType(type)) {
      throw new Error("Invalid secret type.");
    }

    if (type === "json") {
      try {
        JSON.parse(value);
      } catch {
        return redirectWithMessage(
          `/secrets/create?type=json&name=${encodeURIComponent(name)}`,
          "error",
          "Invalid JSON value.",
        );
      }
    }

    if (overwriteExisting) {
      if (rotateOriginalName.length === 0) {
        throw new Error("Missing original secret name for rotate operation.");
      }
      if (name !== rotateOriginalName) {
        throw new Error("Secret name cannot be changed during rotation.");
      }

      const existingSecret = (await api.listSecrets()).find((item) =>
        item.name === rotateOriginalName
      );
      if (existingSecret) {
        await api.updateSecret(existingSecret.id, name, value);
        rotated = true;
      } else {
        await api.createSecret(name, value);
      }
    } else {
      await api.createSecret(name, value);
    }

    console.log(JSON.stringify({
      action: "create_secret",
      name,
      user: c.req.header("x-forwarded-user") ?? null,
      ts: new Date().toISOString(),
    }));

    return redirectWithMessage(
      "/secrets",
      "ok",
      rotated ? `Secret ${name} rotated.` : `Secret ${name} created.`,
    );
  } catch (error) {
    throw new Error(
      `Create failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

app.post("/secrets/delete", async (c) => {
  try {
    const form = await c.req.formData();
    const id = String(form.get("id") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();

    if (id.length === 0) {
      throw new Error("Missing secret id for delete.");
    }

    await api.deleteSecret(id);

    console.log(JSON.stringify({
      action: "delete_secret",
      id,
      name: name || null,
      user: c.req.header("x-forwarded-user") ?? null,
      ts: new Date().toISOString(),
    }));

    return redirectWithMessage(
      "/secrets",
      "ok",
      `Secret ${api.formatSecretDeleteLabel(id, name)} deleted.`,
    );
  } catch (error) {
    throw new Error(
      `Delete failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

app.post("/configs/create", async (c) => {
  try {
    const form = await c.req.formData();
    const name = String(form.get("name") ?? "").trim();
    const value = String(form.get("value") ?? "");

    const invalidName = api.validateConfigName(name);
    if (invalidName) {
      throw new Error(invalidName);
    }
    if (value.length === 0) {
      throw new Error("Config value cannot be empty.");
    }

    await api.createConfig(name, value);

    console.log(JSON.stringify({
      action: "create_config",
      name,
      user: c.req.header("x-forwarded-user") ?? null,
      ts: new Date().toISOString(),
    }));

    return redirectWithMessage("/configs", "ok", `Config ${name} created.`);
  } catch (error) {
    throw new Error(
      `Create failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

app.post("/configs/delete", async (c) => {
  try {
    const form = await c.req.formData();
    const id = String(form.get("id") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();

    if (id.length === 0) {
      throw new Error("Missing config id for delete.");
    }

    await api.deleteConfig(id);

    console.log(JSON.stringify({
      action: "delete_config",
      id,
      name: name || null,
      user: c.req.header("x-forwarded-user") ?? null,
      ts: new Date().toISOString(),
    }));

    return redirectWithMessage(
      "/configs",
      "ok",
      `Config ${api.formatConfigDeleteLabel(id, name)} deleted.`,
    );
  } catch (error) {
    throw new Error(
      `Delete failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

console.log(`Swarm Secrets UI listening on :${appEnv.port}`);
Deno.serve({ port: appEnv.port }, app.fetch);
