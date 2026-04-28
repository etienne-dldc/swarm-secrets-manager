import { Link, Paper, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../../components/Layout.tsx";
import type { SecretView } from "../../logic/api/index.ts";

type SecretDetailPageProps = {
  secret: SecretView;
  ok?: string | null;
  error?: string | null;
};

export const SecretDetailPage: FC<SecretDetailPageProps> = ({
  secret,
  ok,
  error,
}) => {
  const wrapperClass = css`
    ${utility.flex({ direction: "column", gap: 3 })};
  `;

  const headerClass = css`
    ${utility.flex({ direction: "column", gap: 1 })};
  `;

  const titleClass = css`
    ${utility.textSize("2xl")};
    ${utility.fontWeight("bold")};
    margin: 0;
  `;

  const subtitleClass = css`
    ${utility.textColor("gray.200")};
    margin: 0;
  `;

  const metaGridClass = css`
    ${utility.flex({ direction: "column", gap: 2 })};
  `;

  const metaRowClass = css`
    ${utility.flex({ direction: "column", gap: 1, padding: 3 })};
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 0.5rem;
  `;

  const metaLabelClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.300")};
    ${utility.fontWeight("bold")};
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `;

  const metaValueClass = css`
    ${utility.textSize("lg")};
    margin: 0;
    word-break: break-all;
  `;

  const codeClass = css`
    font-family:
      ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas,
      Liberation Mono, Courier New, monospace;
  `;

  const backLinkClass = css`
    ${utility.textColor("blue.400")};
    text-decoration: none;
    transition: opacity 140ms ease;

    &:hover {
      opacity: 0.8;
    }
  `;

  return (
    <Layout title={secret.name} activeTab="secrets" ok={ok} error={error}>
      <div class={wrapperClass}>
        <div class={headerClass}>
          <h2 class={titleClass}>{secret.name}</h2>
          <Link href="/secrets">
            <span class={backLinkClass}>← Back to Secrets</span>
          </Link>
        </div>

        <div class={metaGridClass}>
          <Paper class={metaRowClass}>
            <p class={metaLabelClass}>Full ID</p>
            <p class={`${metaValueClass} ${codeClass}`}>{secret.id}</p>
          </Paper>

          <Paper class={metaRowClass}>
            <p class={metaLabelClass}>Short ID</p>
            <p class={`${metaValueClass} ${codeClass}`}>{secret.shortId}</p>
          </Paper>

          <Paper class={metaRowClass}>
            <p class={metaLabelClass}>Created</p>
            <p class={metaValueClass}>{secret.createdAt}</p>
          </Paper>
        </div>
      </div>
    </Layout>
  );
};
