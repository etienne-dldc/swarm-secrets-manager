import type { SecretView } from "./api/index.ts";
import type { TConfig, TSecretType } from "./configSchema.ts";

export type ExistingSecretListItem = {
  status: "existing";
  id: string;
  name: string;
  createdAt: string;
  description: string | null;
  type: TSecretType | null;
  secret: SecretView;
};

export type MissingSecretListItem = {
  status: "missing";
  name: string;
  description: string;
  type: TSecretType;
};

export type SecretListItem = ExistingSecretListItem | MissingSecretListItem;

export function buildSecretListItems(
  secrets: SecretView[],
  config: TConfig | null,
): SecretListItem[] {
  const expectedByName = new Map(
    (config?.secrets ?? []).map((expected) => [expected.name, expected]),
  );

  const existingNames = new Set(secrets.map((secret) => secret.name));

  const existingItems: ExistingSecretListItem[] = secrets.map((secret) => {
    const expected = expectedByName.get(secret.name);

    return {
      status: "existing",
      id: secret.id,
      name: secret.name,
      createdAt: secret.createdAt,
      description: expected?.description ?? null,
      type: expected?.type ?? null,
      secret,
    };
  });

  const missingItems: MissingSecretListItem[] = (config?.secrets ?? [])
    .filter((expected) => !existingNames.has(expected.name))
    .map((expected) => ({
      status: "missing",
      name: expected.name,
      description: expected.description,
      type: expected.type,
    }));

  return [...existingItems, ...missingItems];
}
