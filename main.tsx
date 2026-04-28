import { type Context, Hono, type HonoRequest } from "hono";
import {
  createActualApi,
  createMockApi,
  type SecretsApi,
} from "./logic/api/index.ts";
import { CONFIG_JSON_PATH, loadConfigFromPath } from "./logic/loadConfig.ts";
import { redirectTo } from "./logic/redirectTo.ts";
import { redirectWithMessage } from "./logic/redirectWithMessage.ts";
import { ConfigsPage } from "./views/ConfigsPage.tsx";
import { ErrorPage } from "./views/ErrorPage.tsx";
import { NotFoundPage } from "./views/NotFoundPage.tsx";
import { SecretsPage } from "./views/SecretsPage.tsx";
import { SecretDetailPage } from "./views/secrets/SecretDetailPage.tsx";

const PORT = Number(Deno.env.get("PORT") ?? "3000");
const config = await loadConfigFromPath(CONFIG_JSON_PATH);

if (config) {
  console.log(
    `Loaded ${config.secrets.length} expected secrets from ${CONFIG_JSON_PATH}`,
  );
}

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
    const { ok, error } = getFlash(c);

    return await c.html(
      <SecretsPage secrets={secrets} ok={ok} error={error} />,
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

app.get("/secret/:id", async (c) => {
  const id = c.req.param("id");
  const secret = await api.getSecret(id);
  const { ok, error } = getFlash(c);

  return await c.html(
    <SecretDetailPage secret={secret} ok={ok} error={error} />,
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
    const value = String(form.get("value") ?? "");

    const invalidName = api.validateSecretName(name);
    if (invalidName) {
      throw new Error(invalidName);
    }
    if (value.length === 0) {
      throw new Error("Secret value cannot be empty.");
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

console.log(`Swarm Secrets UI listening on :${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
