import {
  Button,
  ButtonLink,
  FormField,
  Input,
  Link,
  Paper,
  Textarea,
  utility,
} from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";
import type { SecretView } from "../logic/api/index.ts";
import type { TSecretType } from "../logic/configSchema.ts";

type CreateSecretPageProps = {
  name: string;
  type: TSecretType;
  description?: string | null;
  defaultValue?: string;
  existingSecret?: SecretView | null;
  ok?: string | null;
  error?: string | null;
};

export const CreateSecretPage: FC<CreateSecretPageProps> = ({
  name,
  type,
  description,
  defaultValue,
  existingSecret,
  ok,
  error,
}) => {
  const contentClass = css`
    ${utility.flex({ direction: "column", gap: 3, padding: 3 })};
  `;

  const backLinkClass = css`
    ${utility.textColor("blue.400")};
    text-decoration: none;
    transition: opacity 140ms ease;

    &:hover {
      opacity: 0.8;
    }
  `;

  const titleClass = css`
    ${utility.textSize("2xl")};
    ${utility.fontWeight("bold")};
    margin: 0;
  `;

  const subtitleClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.200")};
    margin: 0;
  `;

  const warningClass = css`
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fed7aa;
    border-radius: 0.5rem;
    padding: 0.75rem;
    ${utility.textSize("sm")};
  `;

  const formClass = css`
    ${utility.flex({ direction: "column", gap: 3 })};
  `;

  const helpTextClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.200")};
    margin: 0;
  `;

  const actionsClass = css`
    ${utility.flex({ direction: "row", gap: 2, justify: "end" })};
    margin-top: 0.5rem;
  `;

  const isRotateMode = existingSecret !== null && existingSecret !== undefined;

  return (
    <Layout title="Create Secret" activeTab="secrets" ok={ok} error={error}>
      <Link href="/secrets">
        <span class={backLinkClass}>← Back to Secrets</span>
      </Link>
      <Paper class={contentClass}>
        <h2 class={titleClass}>Create Secret</h2>
        <p class={subtitleClass}>
          Create a new secret or rotate an existing one.
        </p>

        {existingSecret
          ? (
            <div class={warningClass}>
              Secret <strong>{existingSecret.name}</strong> already exists (id:
              {" "}
              {existingSecret.shortId}). Submitting this form will override the
              existing secret.
            </div>
          )
          : null}

        <form
          method="post"
          action="/secrets/create"
          class={formClass}
        >
          <input type="hidden" name="type" value={type} />
          <input
            type="hidden"
            name="overwriteExisting"
            value={existingSecret ? "1" : "0"}
          />
          {isRotateMode
            ? (
              <>
                <input type="hidden" name="name" value={existingSecret.name} />
                <input
                  type="hidden"
                  name="rotateOriginalName"
                  value={existingSecret.name}
                />
              </>
            )
            : null}

          <FormField
            id="name"
            label="Name"
            required
            hint={isRotateMode
              ? "Name is locked while rotating an existing secret."
              : "Must be a valid Docker secret name."}
          >
            {isRotateMode
              ? (
                <Input
                  id="name"
                  required
                  value={name}
                  readOnly
                />
              )
              : (
                <Input
                  id="name"
                  name="name"
                  required
                  value={name}
                />
              )}
          </FormField>

          <FormField id="type-view" label="Type">
            <Input id="type-view" value={type} readOnly />
          </FormField>

          {description
            ? (
              <FormField id="description-view" label="Description">
                <p class={helpTextClass}>{description}</p>
              </FormField>
            )
            : null}

          <FormField
            id="value"
            label="Value"
            required
            hint={type === "json"
              ? "JSON content is stored as secret text."
              : undefined}
          >
            <Textarea
              id="value"
              name="value"
              required
              rows={10}
              placeholder={type === "json"
                ? '{"example":"value"}'
                : "Enter secret value"}
            >
              {defaultValue ?? ""}
            </Textarea>
          </FormField>

          <div class={actionsClass}>
            <ButtonLink href="/secrets">Cancel</ButtonLink>
            <Button type="submit" variant="primary">
              {existingSecret ? "Rotate Secret" : "Create Secret"}
            </Button>
          </div>
        </form>
      </Paper>
    </Layout>
  );
};
