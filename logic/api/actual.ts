import type {
  ConfigSpec,
  DockerApi,
  DockerConfig,
  DockerSecret,
  ResourceView,
  SecretSpec,
} from "./types.ts";

const DOCKER_API_VERSION = Deno.env.get("DOCKER_API_VERSION") ?? "v1.43";
const DOCKER_SOCKET = Deno.env.get("DOCKER_SOCKET") ?? "/var/run/docker.sock";

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
  }

  const output = await new Deno.Command("curl", {
    args,
    stdout: "piped",
    stderr: "piped",
  }).output();

  if (output.code !== 0) {
    const stderr = new TextDecoder().decode(output.stderr).trim();
    throw new Error(stderr || "curl command failed");
  }

  const text = new TextDecoder().decode(output.stdout);
  const separatorIndex = text.lastIndexOf("\\n");
  if (separatorIndex < 0) {
    throw new Error("Unexpected Docker API response");
  }

  const body = text.slice(0, separatorIndex);
  const status = Number(text.slice(separatorIndex + 1).trim());
  if (Number.isNaN(status)) {
    throw new Error("Unable to parse Docker API status code");
  }

  return { status, body };
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
    throw new Error(extractDockerMessage(response.body));
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
    throw new Error(extractDockerMessage(response.body));
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
    throw new Error(extractDockerMessage(response.body));
  }
}

async function deleteResource(kind: ResourceKind, id: string): Promise<void> {
  const response = await dockerApi(
    "DELETE",
    `${getCollectionPath(kind)}/${encodeURIComponent(id)}`,
  );
  if (response.status !== 204) {
    throw new Error(extractDockerMessage(response.body));
  }
}

function formatDeleteLabel(id: string, name?: string): string {
  return name?.trim() || shortId(id);
}
