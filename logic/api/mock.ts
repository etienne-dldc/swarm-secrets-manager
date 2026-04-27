import type { ConfigView, DockerApi, SecretView } from "./types.ts";

type MockResource = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
};

const mockSecrets = new Map<string, MockResource>();

const mockConfigs = new Map<string, MockResource>();

export function createMockApi(): DockerApi {
  return {
    listSecrets: () => Promise.resolve(toSecretViews(mockSecrets)),
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
