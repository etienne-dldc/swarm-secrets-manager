import { utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import type { ExistingSecretListItem } from "../../logic/secretListItems.ts";

type ExistingSecretRowProps = {
  secret: ExistingSecretListItem;
};

const baseCardClass = css`
  color: inherit;
  display: block;

  ${utility.flex({ direction: "column", gap: 1, padding: 3 })};
  border: 1px solid rgba(148, 163, 184, 0.22);
  ${utility.cornerShape.superellipse};
  border-radius: 0.5rem;
`;

const linkClass = css`
  ${baseCardClass};
  text-decoration: none;
  transition: background-color 140ms ease, border-color 140ms ease;

  &:hover {
    background: rgba(148, 163, 184, 0.08);
    border-color: rgba(148, 163, 184, 0.38);
    & p:first-child {
      text-decoration: underline;
    }
  }
`;

const nameClass = css`
  ${utility.textSize("lg")};
  ${utility.fontWeight("bold")};
  margin: 0;
`;

const descriptionClass = css`
  ${utility.textSize("sm")};
  ${utility.textColor("gray.200")};
  margin: 0;
`;

export const ExistingSecretRow: FC<ExistingSecretRowProps> = ({ secret }) => {
  return (
    <a href={`/secret/${secret.id}`} class={linkClass}>
      <p class={nameClass}>{secret.name}</p>
      {secret.description
        ? <p class={descriptionClass}>{secret.description}</p>
        : null}
    </a>
  );
};
