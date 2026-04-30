import { SpanStatusCode } from "@opentelemetry/api";
import { recordSpanError, telemetryTracer } from "../../telemetry.ts";
import { appEnv } from "../env.ts";
import type {
  ConfigSpec,
  DockerApi,
  DockerConfig,
  DockerSecret,
  ResourceView,
  SecretSpec,
} from "./types.ts";

const DOCKER_API_VERSION = appEnv.dockerApiVersion;
const DOCKER_SOCKET = appEnv.dockerSocket;

type DockerApiResponse = {
  status: number;
  body: string;
};

type ResourceKind = "secret" | "config";

type NamedDockerResource = DockerSecret | DockerConfig;

export function createActualApi(): DockerApi {
  return {
    listSecrets: () => listResources<DockerSecret>("secret"),
    getSecret: (id) => getResource<DockerSecret>("secret", id),
    createSecret: (name, value) => createResource("secret", name, value),
    deleteSecret: (id) => deleteResource("secret", id),
    validateSecretName: validateResourceName,
    formatSecretDeleteLabel: formatDeleteLabel,
    listConfigs: () => listResources<DockerConfig>("config"),
    createConfig: (name, value) => createResource("config", name, value),
    deleteConfig: (id) => deleteResource("config", id),
    validateConfigName: validateResourceName,
    formatConfigDeleteLabel: formatDeleteLabel,
  };
}

function encodeBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function shortId(id: string): string {
  return id.slice(0, 12);
}

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function extractDockerMessage(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody);
    if (typeof parsed?.message === "string" && parsed.message.length > 0) {
      return parsed.message;
    }
  } catch {
    // Ignore parse failures and fallback to text.
  }

  const fallback = rawBody.trim();
  return fallback.length > 0 ? fallback : "Unknown Docker API error.";
}

async function dockerApi(
  method: string,
  path: string,
  jsonBody?: string,
): Promise<DockerApiResponse> {
  return await telemetryTracer.startActiveSpan(
    `docker.api ${method} ${path}`,
    async (span) => {
      span.setAttributes({
        "docker.api.version": DOCKER_API_VERSION,
        "docker.socket.path": DOCKER_SOCKET,
        "http.request.method": method,
        "url.path": path,
      });

      try {
        const args = [
          "--silent",
          "--show-error",
          "--unix-socket",
          DOCKER_SOCKET,
          "-X",
          method,
          `http://localhost/${DOCKER_API_VERSION}${path}`,
          "-w",
          "\\n%{http_code}",
        ];

        if (jsonBody !== undefined) {
          args.push(
            "-H",
            "Content-Type: application/json",
            "--data-binary",
            jsonBody,
          );
          span.setAttribute("http.request.body.size", jsonBody.length);
        }

        console.log(`[docker] ${method} ${path}`);

        const output = await new Deno.Command("curl", {
          args,
          stdout: "piped",
          stderr: "piped",
        }).output();

        if (output.code !== 0) {
          const stderr = new TextDecoder().decode(output.stderr).trim();
          console.error(`[docker] curl exited with code ${output.code}`);
          console.error(`[docker] stderr: ${stderr}`);
          throw new Error(
            `curl command failed (exit ${output.code}): ${
              stderr || "(no stderr)"
            }`,
          );
        }

        const text = new TextDecoder().decode(output.stdout);
        // curl appends "\n<status_code>" via -w "\n%{http_code}"; curl interprets \n
        // as an actual newline character, so we search for "\n" (not "\\n").
        const separatorIndex = text.lastIndexOf("\n");
        if (separatorIndex < 0) {
          console.error(
            `[docker] raw response (${text.length} bytes): ${text}`,
          );
          throw new Error(
            `Unexpected Docker API response for ${method} ${path}: no status-code separator found`,
          );
        }

        const body = text.slice(0, separatorIndex);
        const statusRaw = text.slice(separatorIndex + 1).trim();
        const status = Number(statusRaw);
        if (Number.isNaN(status)) {
          console.error(
            `[docker] raw status string: ${JSON.stringify(statusRaw)}`,
          );
          console.error(`[docker] raw body: ${body}`);
          throw new Error(
            `Unable to parse Docker API status code for ${method} ${path}: got ${
              JSON.stringify(statusRaw)
            }`,
          );
        }

        span.setAttribute("http.response.status_code", status);
        span.setStatus({
          code: status >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
        });

        console.log(`[docker] ${method} ${path} → ${status}`);
        return { status, body };
      } catch (error) {
        recordSpanError(span, error);
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

function getCollectionPath(kind: ResourceKind): string {
  return kind === "secret" ? "/secrets" : "/configs";
}

function getCreatePath(kind: ResourceKind): string {
  return kind === "secret" ? "/secrets/create" : "/configs/create";
}

function toResourceView<TResource extends NamedDockerResource>(
  resource: TResource,
): ResourceView<TResource> {
  const id = resource.ID ?? "";
  const name = resource.Spec?.Name ?? "(unnamed)";

  return {
    docker: resource,
    id,
    name,
    shortId: shortId(id),
    createdAt: formatDate(resource.CreatedAt),
  };
}

function validateResourceName(name: string): string | null {
  if (name.length === 0 || name.length > 128) {
    return "Name must be between 1 and 128 characters.";
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)) {
    return "Name must start with an alphanumeric character and contain only letters, numbers, dot, underscore or dash.";
  }

  return null;
}

async function listResources<TResource extends NamedDockerResource>(
  kind: ResourceKind,
): Promise<ResourceView<TResource>[]> {
  const response = await dockerApi("GET", getCollectionPath(kind));
  if (response.status !== 200) {
    console.error(
      `[docker] list ${kind}s failed: status=${response.status} body=${response.body}`,
    );
    throw new Error(
      `Docker returned ${response.status} listing ${kind}s: ${
        extractDockerMessage(response.body)
      }`,
    );
  }

  const parsed = JSON.parse(response.body) as TResource[];
  parsed.sort((left, right) => {
    const leftName = left.Spec?.Name ?? "";
    const rightName = right.Spec?.Name ?? "";
    return leftName.localeCompare(rightName);
  });

  return parsed.map((resource) => toResourceView(resource));
}

async function getResource<TResource extends NamedDockerResource>(
  kind: ResourceKind,
  id: string,
): Promise<ResourceView<TResource>> {
  const response = await dockerApi(
    "GET",
    `${getCollectionPath(kind)}/${encodeURIComponent(id)}`,
  );
  if (response.status !== 200) {
    console.error(
      `[docker] get ${kind} ${id} failed: status=${response.status} body=${response.body}`,
    );
    throw new Error(
      `Docker returned ${response.status} getting ${kind} ${id}: ${
        extractDockerMessage(response.body)
      }`,
    );
  }

  const resource = JSON.parse(response.body) as TResource;
  return toResourceView(resource);
}

async function createResource(
  kind: ResourceKind,
  name: string,
  value: string,
): Promise<void> {
  const validation = validateResourceName(name);
  if (validation) {
    throw new Error(validation);
  }

  const payloadBody = {
    Name: name,
    Data: encodeBase64Utf8(value),
  } satisfies SecretSpec & ConfigSpec;

  const response = await dockerApi(
    "POST",
    getCreatePath(kind),
    JSON.stringify(payloadBody),
  );
  if (response.status !== 201) {
    console.error(
      `[docker] create ${kind} "${name}" failed: status=${response.status} body=${response.body}`,
    );
    throw new Error(
      `Docker returned ${response.status} creating ${kind} "${name}": ${
        extractDockerMessage(response.body)
      }`,
    );
  }
}

async function deleteResource(kind: ResourceKind, id: string): Promise<void> {
  const response = await dockerApi(
    "DELETE",
    `${getCollectionPath(kind)}/${encodeURIComponent(id)}`,
  );
  if (response.status !== 204) {
    console.error(
      `[docker] delete ${kind} ${id} failed: status=${response.status} body=${response.body}`,
    );
    throw new Error(
      `Docker returned ${response.status} deleting ${kind} ${id}: ${
        extractDockerMessage(response.body)
      }`,
    );
  }
}

function formatDeleteLabel(id: string, name?: string): string {
  return name?.trim() || shortId(id);
}
