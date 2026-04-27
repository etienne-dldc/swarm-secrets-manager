import {
  Html,
  Stack,
  TabLink,
  TabsGroup,
  Title,
  UniversalLayout,
  utility,
} from "@dldc/hono-ui";
import { css } from "hono/css";
import { type FC, Fragment } from "hono/jsx";

type LayoutProps = {
  title?: string;
  children: unknown;
  activeTab?: "secrets" | "configs";
  ok?: string | null;
  error?: string | null;
};

export const Layout: FC<LayoutProps> = (
  { title, children, activeTab, ok, error },
) => {
  const okClass = css`
    background: #ecfdf5;
    color: #065f46;
    border-radius: 8px;
    padding: 10px 12px;
  `;

  const errorClass = css`
    background: #fef2f2;
    color: #991b1b;
    border-radius: 8px;
    padding: 10px 12px;
  `;

  return (
    <Html
      title={title ? `${title} - Secrets Manager` : "Secrets Manager"}
      heads={
        <Fragment>
          <link
            rel="icon"
            href={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔒</text></svg>`}
          />
        </Fragment>
      }
    >
      <UniversalLayout
        class={css`
          ${utility.rowGap(4)};
        `}
      >
        <Title>
          Secrets Manager
        </Title>
        <Stack direction="row" justify="start">
          <TabsGroup
            class={css`
              width: auto;
            `}
          >
            <TabLink
              link="/secrets"
              active={activeTab === "secrets"}
            >
              Secrets
            </TabLink>
            <TabLink
              link="/configs"
              active={activeTab === "configs"}
            >
              Configs
            </TabLink>
          </TabsGroup>
        </Stack>
        {ok ? <div class={okClass}>{ok}</div> : null}
        {error ? <div class={errorClass}>{error}</div> : null}
        {children}
      </UniversalLayout>
    </Html>
  );
};
