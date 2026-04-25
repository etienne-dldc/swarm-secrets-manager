import type { SecretView } from "../views/HomePage.tsx";

const DOCKER_API_VERSION = Deno.env.get("DOCKER_API_VERSION") ?? "v1.43";
const DOCKER_SOCKET = Deno.env.get("DOCKER_SOCKET") ?? "/var/run/docker.sock";

interface SecretItem {
  ID: string;
  CreatedAt?: string;
  Spec?: {
    Name?: string;
  };
}

interface DockerApiResponse {
  status: number;
  body: string;
}

export interface SecretsApi {
  list: () => Promise<SecretView[]>;
  create: (name: string, value: string) => Promise<void>;
  delete: (id: string) => Promise<void>;
  validateName: (name: string) => string | null;
  formatDeleteLabel: (id: string, name?: string) => string;
}

export const secrets: SecretsApi = {
  list: listSecretViews,
  create: createSecret,
  delete: deleteSecret,
  validateName: validateSecretName,
  formatDeleteLabel: formatSecretDeleteLabel,
};

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

function toSecretView(secret: SecretItem): SecretView {
  const id = secret.ID;
  const name = secret.Spec?.Name ?? "(unnamed)";

  return {
    id,
    name,
    shortId: shortId(id),
    createdAt: formatDate(secret.CreatedAt),
  };
}

function validateSecretName(name: string): string | null {
  if (name.length === 0 || name.length > 128) {
    return "Secret name must be between 1 and 128 characters.";
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)) {
    return "Secret name must start with an alphanumeric character and contain only letters, numbers, dot, underscore or dash.";
  }

  return null;
}

async function listSecretViews(): Promise<SecretView[]> {
  const response = await dockerApi("GET", "/secrets");
  if (response.status !== 200) {
    throw new Error(extractDockerMessage(response.body));
  }

  const parsed = JSON.parse(response.body) as SecretItem[];
  parsed.sort((a, b) => {
    const nameA = a.Spec?.Name ?? "";
    const nameB = b.Spec?.Name ?? "";
    return nameA.localeCompare(nameB);
  });

  return parsed.map(toSecretView);
}

async function createSecret(name: string, value: string): Promise<void> {
  const payload = JSON.stringify({
    Name: name,
    Data: encodeBase64Utf8(value),
  });

  const response = await dockerApi("POST", "/secrets/create", payload);
  if (response.status !== 201) {
    throw new Error(extractDockerMessage(response.body));
  }
}

async function deleteSecret(id: string): Promise<void> {
  const response = await dockerApi(
    "DELETE",
    `/secrets/${encodeURIComponent(id)}`,
  );
  if (response.status !== 204) {
    throw new Error(extractDockerMessage(response.body));
  }
}

function formatSecretDeleteLabel(id: string, name?: string): string {
  return name?.trim() || shortId(id);
}
