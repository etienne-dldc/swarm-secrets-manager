import {
  Button,
  ButtonLink,
  FormField,
  Input,
  Link,
  Paper,
  Stack,
  utility,
} from "@dldc/hono-ui";
import { css } from "hono/css";
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
  const versionIndex = secret.docker.Version?.Index;

  const contentClass = css`
    ${utility.flex({ direction: "column", gap: 4, padding: 3 })};
  `;

  const titleClass = css`
    ${utility.textSize("2xl")};
    ${utility.fontWeight("bold")};
    margin: 0;
  `;

  const actionsClass = css`
    ${utility.flex({ justify: "end", gap: 2 })};
  `;

  const descriptionClass = css`
    ${utility.textSize("base")};
    ${utility.textColor("gray.400")};
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
        <Stack direction="row" align="center" justify="between" gap={2}>
          <Stack direction="row" align="center" gap={3}>
            <h2 class={titleClass}>{secret.name}</h2>
            {type ? <span class={typeBadgeClass}>{type}</span> : null}
          </Stack>
          <div class={actionsClass}>
            <ButtonLink
              href={`/secrets/create?name=${encodeURIComponent(secret.name)}`}
            >
              Rotate
            </ButtonLink>
            <form
              method="post"
              action="/secrets/delete"
              data-confirm={`Delete secret ${secret.name}? This action cannot be undone.`}
            >
              <input type="hidden" name="id" value={secret.id} />
              <input type="hidden" name="name" value={secret.name} />
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </div>
        </Stack>
        {description ? <p class={descriptionClass}>{description}</p> : null}
        <p class={createdTextClass}>Created {secret.createdAt}</p>
        <p class={createdTextClass}>Version {versionIndex ?? "-"}</p>
        <FormField label="Id" id="id">
          <Input
            id="id"
            value={secret.id}
            readOnly
            class={css`
              ${utility.fontFamily("mono")};
            `}
          />
        </FormField>
        <FormField label="Short Id" id="shortId">
          <Input
            id="shortId"
            value={secret.shortId}
            readOnly
            class={css`
              ${utility.fontFamily("mono")};
            `}
          />
        </FormField>
      </Paper>
    </Layout>
  );
};
