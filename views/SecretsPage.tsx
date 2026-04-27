import { Paper } from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";

type SecretsPageProps = {
  count: number;
  ok?: string | null;
  error?: string | null;
};

export const SecretsPage: FC<SecretsPageProps> = ({ count, ok, error }) => {
  return (
    <Layout title="Secrets" activeTab="secrets" ok={ok} error={error}>
      <Paper>
        <h2>Secrets</h2>
        <p>Minimal secrets view. Total secrets: {count}</p>
      </Paper>
    </Layout>
  );
};
