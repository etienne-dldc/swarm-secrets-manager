import { Html, Paper, UniversalLayout } from "@dldc/hono-ui";
import { type FC, Fragment } from "hono/jsx";

type LayoutProps = {
  title: string;
  user?: string | null;
  children: unknown;
};

export const Layout: FC<LayoutProps> = ({ title, user, children }) => {
  return (
    <Html
      title={title}
      heads={
        <Fragment>
          <link
            rel="icon"
            href={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔒</text></svg>`}
          />
        </Fragment>
      }
    >
      <UniversalLayout>
        <Paper>
          {children}
        </Paper>
      </UniversalLayout>
    </Html>
  );
};
