import { ButtonLink, Stack, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import type { MissingSecretListItem } from "../../logic/secretListItems.ts";

type MissingSecretRowProps = {
  secret: MissingSecretListItem;
};

export const MissingSecretRow: FC<MissingSecretRowProps> = ({ secret }) => {
  const cardClass = css`
    color: inherit;
    display: block;

    ${utility.flex({
      direction: "row",
      gap: 1,
      padding: 3,
      justify: "between",
      align: "start",
    })};
    border: 1px solid rgba(148, 163, 184, 0.22);
    ${utility.cornerSuperellipse()};
    border-radius: 0.5rem;
  `;

  const nameClass = css`
    ${utility.textSize("lg")};
    ${utility.fontWeight("bold")};
    margin: 0;
  `;

  const nameRowClass = css`
    ${utility.flex({ direction: "row", align: "center", gap: 2 })};
  `;

  const badgeClass = css`
    ${utility.textSize("xs")};
    ${utility.fontWeight("bold")};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #7f1d1d;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
  `;

  const descriptionClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("gray.200")};
    margin: 0;
  `;

  return (
    <div class={cardClass}>
      <Stack
        direction="column"
        gap={1}
        class={css`
          opacity: 0.7;
        `}
      >
        <div class={nameRowClass}>
          <span class={badgeClass}>Missing</span>
          <p class={nameClass}>{secret.name}</p>
        </div>
        <p class={descriptionClass}>{secret.description}</p>
      </Stack>
      <ButtonLink href="#">Create</ButtonLink>
    </div>
  );
};
