import type { ConfigView, DockerApi, SecretView } from "./types.ts";

type MockResource = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
};

const mockSecrets = new Map<string, MockResource>([
  [
    "secret-db-password-001",
    {
      id: "secret-db-password-001",
      name: "db_password",
      value: "dev-db-password",
      createdAt: "2026-04-25T08:15:00.000Z",
    },
  ],
  [
    "secret-api-token-002",
    {
      id: "secret-api-token-002",
      name: "api_token",
      value: "dev-api-token",
      createdAt: "2026-04-26T10:30:00.000Z",
    },
  ],
  [
    "secret-smtp-password-003",
    {
      id: "secret-smtp-password-003",
      name: "smtp_password",
      value: "dev-smtp-password",
      createdAt: "2026-04-27T14:45:00.000Z",
    },
  ],
  ["secret-git-access-token-004", {
    id: "secret-git-access-token-004",
    name: "git_access_token",
    value: "dev-git-access-token",
    createdAt: "2026-04-28T09:00:00.000Z",
  }],
]);

const mockConfigs = new Map<string, MockResource>([
  [
    "config-app-env-001",
    {
      id: "config-app-env-001",
      name: "app_env",
      value: "development",
      createdAt: "2026-04-25T09:00:00.000Z",
    },
  ],
  [
    "config-log-level-002",
    {
      id: "config-log-level-002",
      name: "log_level",
      value: "debug",
      createdAt: "2026-04-26T11:20:00.000Z",
    },
  ],
]);

export function createMockApi(): DockerApi {
  return {
    listSecrets: () => Promise.resolve(toSecretViews(mockSecrets)),
    getSecret: (id) => getResource(mockSecrets, id, "secret"),
    createSecret: (name, value) => createResource(mockSecrets, name, value),
    deleteSecret: (id) => deleteResource(mockSecrets, id, "secret"),
    validateSecretName: validateResourceName,
    formatSecretDeleteLabel: formatDeleteLabel,
    listConfigs: () => Promise.resolve(toConfigViews(mockConfigs)),
    createConfig: (name, value) => createResource(mockConfigs, name, value),
    deleteConfig: (id) => deleteResource(mockConfigs, id, "config"),
    validateConfigName: validateResourceName,
    formatConfigDeleteLabel: formatDeleteLabel,
  };
}

function shortId(id: string): string {
  return id.slice(0, 12);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
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

function toSecretViews(resources: Map<string, MockResource>): SecretView[] {
  return Array.from(resources.values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((resource) => ({
      docker: {
        ID: resource.id,
        CreatedAt: resource.createdAt,
        Spec: {
          Name: resource.name,
        },
      },
      id: resource.id,
      name: resource.name,
      shortId: shortId(resource.id),
      createdAt: formatDate(resource.createdAt),
    }));
}

function toConfigViews(resources: Map<string, MockResource>): ConfigView[] {
  return Array.from(resources.values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((resource) => ({
      docker: {
        ID: resource.id,
        CreatedAt: resource.createdAt,
        Spec: {
          Name: resource.name,
        },
      },
      id: resource.id,
      name: resource.name,
      shortId: shortId(resource.id),
      createdAt: formatDate(resource.createdAt),
    }));
}

function createResource(
  resources: Map<string, MockResource>,
  name: string,
  value: string,
): Promise<void> {
  const validation = validateResourceName(name);
  if (validation) {
    throw new Error(validation);
  }

  for (const resource of resources.values()) {
    if (resource.name === name) {
      throw new Error(`${name} already exists`);
    }
  }

  const id = crypto.randomUUID();
  resources.set(id, {
    id,
    name,
    value,
    createdAt: new Date().toISOString(),
  });

  return Promise.resolve();
}

function getResource(
  resources: Map<string, MockResource>,
  id: string,
  kind: "secret" | "config",
): Promise<SecretView | ConfigView> {
  const resource = resources.get(id);
  if (!resource) {
    throw new Error(`${kind} ${id} not found`);
  }
  return Promise.resolve({
    docker: {
      ID: resource.id,
      CreatedAt: resource.createdAt,
      Spec: {
        Name: resource.name,
      },
    },
    id: resource.id,
    name: resource.name,
    shortId: shortId(resource.id),
    createdAt: formatDate(resource.createdAt),
  });
}

function deleteResource(
  resources: Map<string, MockResource>,
  id: string,
  kind: "secret" | "config",
): Promise<void> {
  if (!resources.delete(id)) {
    throw new Error(`${kind} ${id} not found`);
  }
  return Promise.resolve();
}

function formatDeleteLabel(id: string, name?: string): string {
  return name?.trim() || shortId(id);
}
