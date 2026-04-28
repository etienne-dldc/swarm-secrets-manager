import { Link, Paper, utility } from "@dldc/hono-ui";
import { css, cx } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";
import type { SecretView } from "../logic/api/index.ts";
import type { TSecretType } from "../logic/configSchema.ts";

type SecretDetailPageProps = {
  secret: SecretView;
  description?: string | null;
  type?: TSecretType | null;
  ok?: string | null;
  error?: string | null;
};

export const SecretDetailPage: FC<SecretDetailPageProps> = ({
  secret,
  description,
  type,
  ok,
  error,
}) => {
  const contentClass = css`
    ${utility.flex({ direction: "column", gap: 4, padding: 3 })};
  `;

  const titleClass = css`
    ${utility.textSize("2xl")};
    ${utility.fontWeight("bold")};
    margin: 0;
  `;

  const detailsGridClass = css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 1rem;
    row-gap: 0.85rem;
    align-items: center;
  `;

  const labelClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.300")};
    ${utility.fontWeight("bold")};
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `;

  const valueClass = css`
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
      <Link href="/secrets">
        <span class={backLinkClass}>← Back to Secrets</span>
      </Link>
      <Paper class={contentClass}>
        <h2 class={titleClass}>{secret.name}</h2>

        <dl class={detailsGridClass}>
          {description
            ? (
              <>
                <dt class={labelClass}>Description</dt>
                <dd class={valueClass}>{description}</dd>
              </>
            )
            : null}

          {type
            ? (
              <>
                <dt class={labelClass}>Type</dt>
                <dd class={cx(valueClass, codeClass)}>{type}</dd>
              </>
            )
            : null}

          <dt class={labelClass}>Created</dt>
          <dd class={valueClass}>{secret.createdAt}</dd>

          <dt class={labelClass}>Short ID</dt>
          <dd class={cx(valueClass, codeClass)}>{secret.shortId}</dd>

          <dt class={labelClass}>Full ID</dt>
          <dd class={cx(valueClass, codeClass)}>{secret.id}</dd>
        </dl>
      </Paper>
    </Layout>
  );
};
