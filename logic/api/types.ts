import type {
  Config as DockerConfig,
  ConfigSpec,
  Secret as DockerSecret,
  SecretSpec,
} from "../../docker/generated/index.ts";

type NamedDockerResource = {
  ID?: string;
  CreatedAt?: string;
  Spec?: {
    Name?: string;
  };
};

export type ResourceView<TResource extends NamedDockerResource> = {
  docker: TResource;
  id: string;
  name: string;
  shortId: string;
  createdAt: string;
};

export type SecretView = ResourceView<DockerSecret>;

export type ConfigView = ResourceView<DockerConfig>;

export interface DockerApi {
  listSecrets: () => Promise<SecretView[]>;
  getSecret: (id: string) => Promise<SecretView>;
  createSecret: (name: string, value: string) => Promise<void>;
  updateSecret: (id: string, name: string, value: string) => Promise<void>;
  deleteSecret: (id: string) => Promise<void>;
  validateSecretName: (name: string) => string | null;
  formatSecretDeleteLabel: (id: string, name?: string) => string;
  listConfigs: () => Promise<ConfigView[]>;
  createConfig: (name: string, value: string) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  validateConfigName: (name: string) => string | null;
  formatConfigDeleteLabel: (id: string, name?: string) => string;
}

export type { ConfigSpec, DockerConfig, DockerSecret, SecretSpec };
