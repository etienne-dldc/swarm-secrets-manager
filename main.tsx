import { type Context, Hono } from "hono";
import {
  createActualApi,
  createMockApi,
  type SecretsApi,
} from "./logic/api/index.ts";
import { redirectTo } from "./logic/redirectTo.ts";
import { redirectWithMessage } from "./logic/redirectWithMessage.ts";
import { ConfigsPage } from "./views/ConfigsPage.tsx";
import { NotFoundPage } from "./views/NotFoundPage.tsx";
import { SecretsPage } from "./views/SecretsPage.tsx";

const PORT = Number(Deno.env.get("PORT") ?? "8080");
const api: SecretsApi = Deno.env.get("MOCK_SECRETS_API")
  ? createMockApi()
  : createActualApi();

function getFlash(c: Context) {
  return {
    ok: c.req.query("ok") ?? null,
    error: c.req.query("error") ?? null,
  };
}

const app = new Hono();

app.notFound((c) => {
  return c.html(<NotFoundPage />, 404, {
    "cache-control": "no-store",
  });
});

app.get("/", () => {
  return redirectTo("/secrets");
});

app.get("/secrets", async (c) => {
  try {
    const secrets = await api.listSecrets();
    const { ok, error } = getFlash(c);

    return await c.html(
      <SecretsPage secrets={secrets} ok={ok} error={error} />,
      200,
      { "cache-control": "no-store" },
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage(
      "/secrets",
      "error",
      `Unable to list secrets: ${message}`,
    );
  }
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage(
      "/configs",
      "error",
      `Unable to list configs: ${message}`,
    );
  }
});

app.post("/secrets/create", async (c) => {
  try {
    const form = await c.req.formData();
    const name = String(form.get("name") ?? "").trim();
    const value = String(form.get("value") ?? "");

    const invalidName = api.validateSecretName(name);
    if (invalidName) {
      return redirectWithMessage("/secrets", "error", invalidName);
    }
    if (value.length === 0) {
      return redirectWithMessage(
        "/secrets",
        "error",
        "Secret value cannot be empty.",
      );
    }

    await api.createSecret(name, value);

    console.log(JSON.stringify({
      action: "create_secret",
      name,
      user: c.req.header("x-forwarded-user") ?? null,
      ts: new Date().toISOString(),
    }));

    return redirectWithMessage("/secrets", "ok", `Secret ${name} created.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage(
      "/secrets",
      "error",
      `Create failed: ${message}`,
    );
  }
});

app.post("/secrets/delete", async (c) => {
  try {
    const form = await c.req.formData();
    const id = String(form.get("id") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();

    if (id.length === 0) {
      return redirectWithMessage(
        "/secrets",
        "error",
        "Missing secret id for delete.",
      );
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage(
      "/secrets",
      "error",
      `Delete failed: ${message}`,
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
      return redirectWithMessage("/configs", "error", invalidName);
    }
    if (value.length === 0) {
      return redirectWithMessage(
        "/configs",
        "error",
        "Config value cannot be empty.",
      );
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage(
      "/configs",
      "error",
      `Create failed: ${message}`,
    );
  }
});

app.post("/configs/delete", async (c) => {
  try {
    const form = await c.req.formData();
    const id = String(form.get("id") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();

    if (id.length === 0) {
      return redirectWithMessage(
        "/configs",
        "error",
        "Missing config id for delete.",
      );
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage(
      "/configs",
      "error",
      `Delete failed: ${message}`,
    );
  }
});

console.log(`Swarm Secrets UI listening on :${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
