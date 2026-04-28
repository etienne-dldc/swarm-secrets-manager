import { ButtonLink, Link, Paper, Stack, utility } from "@dldc/hono-ui";
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

  const headerMetaClass = css`
    ${utility.flex({ direction: "row", gap: 2, align: "center" })};
    flex-wrap: wrap;
  `;

  const actionsClass = css`
    ${utility.flex({ justify: "end" })};
  `;

  const descriptionClass = css`
    ${utility.textSize("lg")};
    ${utility.textColor("gray.100")};
    margin: 0;
  `;

  const typeBadgeClass = css`
    ${utility.textSize("sm")};
    ${utility.fontWeight("bold")};
    ${utility.textColor("gray.100")};
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(51, 65, 85, 0.25);
    border-radius: 999px;
    padding: 0.2rem 0.65rem;
    font-family:
      ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas,
      Liberation Mono, Courier New, monospace;
  `;

  const createdTextClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.200")};
    margin: 0;
  `;

  const detailsRowsClass = css`
    ${utility.flex({ direction: "column", gap: 2 })};
  `;

  const detailRowClass = css`
    ${utility.flex({ direction: "column", gap: 0 })};
    border-left: 2px solid rgba(148, 163, 184, 0.25);
    padding-left: 0.75rem;
  `;

  const detailLabelClass = css`
    ${utility.textSize("xs")};
    ${utility.textColor("gray.300")};
    ${utility.fontWeight("bold")};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
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
        <Stack direction="row" align="center" justify="between">
          <h2 class={titleClass}>{secret.name}</h2>

          <div class={actionsClass}>
            <ButtonLink
              href={`/secrets/create?name=${encodeURIComponent(secret.name)}`}
            >
              Rotate
            </ButtonLink>
          </div>
        </Stack>

        <div class={headerMetaClass}>
          {type ? <span class={typeBadgeClass}>{type}</span> : null}
          <p class={createdTextClass}>Created {secret.createdAt}</p>
        </div>

        {description ? <p class={descriptionClass}>{description}</p> : null}

        <div class={detailsRowsClass}>
          <div class={detailRowClass}>
            <p class={detailLabelClass}>Short ID</p>
            <p class={cx(valueClass, codeClass)}>{secret.shortId}</p>
          </div>

          <div class={detailRowClass}>
            <p class={detailLabelClass}>Full ID</p>
            <p class={cx(valueClass, codeClass)}>{secret.id}</p>
          </div>
        </div>
      </Paper>
    </Layout>
  );
};
