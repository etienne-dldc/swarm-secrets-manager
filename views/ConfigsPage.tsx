import { Paper, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";

type ConfigsPageProps = {
  count: number;
  ok?: string | null;
  error?: string | null;
};

export const ConfigsPage: FC<ConfigsPageProps> = ({ count, ok, error }) => {
  const sectionClass = css`
    ${utility.flex({ direction: "column", gap: 3, padding: 3 })};
  `;

  const headerRowClass = css`
    ${utility.flex({ direction: "row", justify: "between", align: "center", gap: 2 })};
  `;

  const titleClass = css`
    ${utility.textSize("2xl")};
    ${utility.fontWeight("bold")};
    margin: 0;
    letter-spacing: 0.02em;
  `;

  const countPillClass = css`
    ${utility.textSize("sm")};
    ${utility.fontWeight("bold")};
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    background: rgba(51, 65, 85, 0.25);
  `;

  const subtitleClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.200")};
    margin: 0;
  `;

  const todoClass = css`
    border: 1px dashed rgba(251, 146, 60, 0.6);
    background: rgba(154, 52, 18, 0.14);
    border-radius: 0.6rem;
    padding: 0.85rem 1rem;
    ${utility.textSize("sm")};
    line-height: 1.45;
  `;

  return (
    <Layout title="Configs" activeTab="configs" ok={ok} error={error}>
      <Paper class={sectionClass}>
        <div class={headerRowClass}>
          <h2 class={titleClass}>Configs</h2>
          <span class={countPillClass}>{count} total</span>
        </div>

        <p class={subtitleClass}>
          Configuration values managed alongside your secrets.
        </p>

        <div class={todoClass}>
          <strong>TODO</strong>: implement configs list, detail, and
          create/rotate workflows.
        </div>
      </Paper>
    </Layout>
  );
};
