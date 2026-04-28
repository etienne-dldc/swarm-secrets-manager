import { Paper, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";
import type { SecretListItem } from "../logic/secretListItems.ts";
import { SecretsList } from "./secrets/SecretsList.tsx";

type SecretsPageProps = {
  secrets: SecretListItem[];
  ok?: string | null;
  error?: string | null;
};

export const SecretsPage: FC<SecretsPageProps> = ({ secrets, ok, error }) => {
  return (
    <Layout title="Secrets" activeTab="secrets" ok={ok} error={error}>
      <Paper
        class={css`
          ${utility.flex({ gap: 2, padding: 3, direction: "column" })};
        `}
      >
        <h2
          class={css`
            ${utility.textSize("lg")};
            ${utility.fontWeight("semibold")};
            text-transform: uppercase;
          `}
        >
          Secrets
        </h2>
        <SecretsList secrets={secrets} />
      </Paper>
    </Layout>
  );
};
