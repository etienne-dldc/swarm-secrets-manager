import type { FC } from "hono/jsx";
import type { SecretListItem } from "../../logic/secretListItems.ts";
import { ExistingSecretRow } from "./ExistingSecretRow.tsx";
import { MissingSecretRow } from "./MissingSecretRow.tsx";

type SecretsRowProps = {
  secret: SecretListItem;
};

export const SecretsRow: FC<SecretsRowProps> = ({ secret }) => {
  if (secret.status === "existing") {
    return <ExistingSecretRow secret={secret} />;
  }

  return <MissingSecretRow secret={secret} />;
};
