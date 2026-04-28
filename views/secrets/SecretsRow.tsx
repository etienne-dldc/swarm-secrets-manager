import { Link, utility } from "@dldc/hono-ui";
import { css, cx } from "hono/css";
import type { FC } from "hono/jsx";
import type { SecretView } from "../../logic/api/index.ts";

type SecretsRowProps = {
  secret: SecretView;
};

export const SecretsRow: FC<SecretsRowProps> = ({ secret }) => {
  const linkClass = css`
    text-decoration: none;
    color: inherit;
    display: block;
  `;

  const itemClass = css`
    ${utility.flex({ direction: "column", gap: 1, padding: 3 })};
    border: 1px solid rgba(148, 163, 184, 0.22);
    ${utility.cornerSuperellipse()};
    border-radius: 0.5rem;
    transition: background-color 140ms ease, border-color 140ms ease;

    &:hover {
      background: rgba(148, 163, 184, 0.08);
      border-color: rgba(148, 163, 184, 0.38);
    }
  `;

  const nameClass = css`
    ${utility.textSize("lg")};
    ${utility.fontWeight("bold")};
    margin: 0;
  `;

  const metaClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.200")};
    ${utility.flex({ gap: 3 })};
    margin: 0;
    font-family:
      ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas,
      Liberation Mono, Courier New, monospace;
  `;

  return (
    <Link href={`/secret/${secret.id}`}>
      <div class={cx(linkClass, itemClass)}>
        <p class={nameClass}>{secret.name}</p>
        <p class={metaClass}>{secret.createdAt}</p>
      </div>
    </Link>
  );
};
