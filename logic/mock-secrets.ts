import type { SecretView } from "../views/HomePage.tsx";
import type { SecretsApi } from "./secrets.ts";

type MockSecret = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
};

const mockSecrets = new Map<string, MockSecret>([
  [
    "mock-secret-1",
    {
      id: "mock-secret-1",
      name: "tower_demo_secret",
      value: "demo",
      createdAt: new Date("2026-01-01T10:00:00.000Z").toISOString(),
    },
  ],
]);

export const secrets: SecretsApi = {
  list(): Promise<SecretView[]> {
    return Promise.resolve(
      Array.from(mockSecrets.values())
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(toSecretView),
    );
  },

  create(name: string, value: string): Promise<void> {
    const validation = validateSecretName(name);
    if (validation) {
      throw new Error(validation);
    }

    for (const secret of mockSecrets.values()) {
      if (secret.name === name) {
        throw new Error(`secret ${name} already exists`);
      }
    }

    const id = crypto.randomUUID();
    mockSecrets.set(id, {
      id,
      name,
      value,
      createdAt: new Date().toISOString(),
    });

    return Promise.resolve();
  },

  delete(id: string): Promise<void> {
    if (!mockSecrets.delete(id)) {
      throw new Error(`secret ${id} not found`);
    }
    return Promise.resolve();
  },

  validateName: validateSecretName,

  formatDeleteLabel(id: string, name?: string): string {
    return name?.trim() || shortId(id);
  },
};

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

function validateSecretName(name: string): string | null {
  if (name.length === 0 || name.length > 128) {
    return "Secret name must be between 1 and 128 characters.";
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)) {
    return "Secret name must start with an alphanumeric character and contain only letters, numbers, dot, underscore or dash.";
  }

  return null;
}

function toSecretView(secret: MockSecret): SecretView {
  return {
    id: secret.id,
    name: secret.name,
    shortId: shortId(secret.id),
    createdAt: formatDate(secret.createdAt),
  };
}
