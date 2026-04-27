import { Paper } from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";

type ConfigsPageProps = {
  count: number;
  ok?: string | null;
  error?: string | null;
};

export const ConfigsPage: FC<ConfigsPageProps> = ({ count, ok, error }) => {
  return (
    <Layout title="Configs" activeTab="configs" ok={ok} error={error}>
      <Paper>
        <h2>Configs</h2>
        <p>Minimal configs view. Total configs: {count}</p>
      </Paper>
    </Layout>
  );
};
