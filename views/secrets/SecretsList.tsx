import { utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import type { SecretView } from "../../logic/api/index.ts";
import { SecretsRow } from "./SecretsRow.tsx";

type SecretsListProps = {
  secrets: SecretView[];
};

const listClass = css`
  ${utility.flex({ direction: "column", gap: 2 })};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const emptyStateClass = css`
  ${utility.textColor("gray.200")};
  margin: 0;
`;

export const SecretsList: FC<SecretsListProps> = ({ secrets }) => {
  if (secrets.length === 0) {
    return <p class={emptyStateClass}>No secrets found.</p>;
  }

  return (
    <ul class={listClass}>
      {secrets.map((secret) => (
        <li key={secret.id}>
          <SecretsRow secret={secret} />
        </li>
      ))}
    </ul>
  );
};
