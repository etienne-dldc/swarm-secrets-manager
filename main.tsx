import { Hono } from "hono";
import { Layout } from "./components/Layout.tsx";
import type { SecretsApi } from "./logic/secrets.ts";

const PORT = Number(Deno.env.get("PORT") ?? "8080");
const secretsModule = Deno.env.get("MOCK_SECRETS_API")
  ? await import("./logic/mock-secrets.ts")
  : await import("./logic/secrets.ts");
const secrets = secretsModule.secrets as SecretsApi;

function redirectWithMessage(type: "ok" | "error", message: string): Response {
  const searchParams = new URLSearchParams();
  searchParams.set(type, message);

  return new Response(null, {
    status: 303,
    headers: {
      location: `/?${searchParams.toString()}`,
      "cache-control": "no-store",
    },
  });
}

const app = new Hono();

app.get("/", (c) => {
  return c.html(
    <Layout title="Swarm Secrets UI">
      Hey
    </Layout>,
    200,
    {
      "cache-control": "no-store",
    },
  );

  // try {
  //   const secrets = (await listSecrets()).map(toSecretView);
  //   const ok = c.req.query("ok") ?? null;
  //   const error = c.req.query("error") ?? null;
  //   const user = c.req.header("x-forwarded-user") ?? null;

  //   return c.html(
  //     <Layout title="Swarm Secrets UI" user={user}>
  //       <HomePage secrets={secrets} ok={ok} error={error} />
  //     </Layout>,
  //     200,
  //     {
  //       "cache-control": "no-store",
  //     },
  //   );
  // } catch (error) {
  //   const message = error instanceof Error ? error.message : "Unknown error";
  //   return redirectWithMessage("error", `Unable to list secrets: ${escapeHtml(message)}`);
  // }
});

app.post("/create", async (c) => {
  try {
    const form = await c.req.formData();
    const name = String(form.get("name") ?? "").trim();
    const value = String(form.get("value") ?? "");

    const invalidName = secrets.validateName(name);
    if (invalidName) {
      return redirectWithMessage("error", invalidName);
    }
    if (value.length === 0) {
      return redirectWithMessage("error", "Secret value cannot be empty.");
    }

    await secrets.create(name, value);

    console.log(JSON.stringify({
      action: "create_secret",
      name,
      user: c.req.header("x-forwarded-user") ?? null,
      ts: new Date().toISOString(),
    }));

    return redirectWithMessage("ok", `Secret ${name} created.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage("error", `Create failed: ${message}`);
  }
});

app.post("/delete", async (c) => {
  try {
    const form = await c.req.formData();
    const id = String(form.get("id") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();

    if (id.length === 0) {
      return redirectWithMessage("error", "Missing secret id for delete.");
    }

    await secrets.delete(id);

    console.log(JSON.stringify({
      action: "delete_secret",
      id,
      name: name || null,
      user: c.req.header("x-forwarded-user") ?? null,
      ts: new Date().toISOString(),
    }));

    return redirectWithMessage(
      "ok",
      `Secret ${secrets.formatDeleteLabel(id, name)} deleted.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return redirectWithMessage("error", `Delete failed: ${message}`);
  }
});

console.log(`Swarm Secrets UI listening on :${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
