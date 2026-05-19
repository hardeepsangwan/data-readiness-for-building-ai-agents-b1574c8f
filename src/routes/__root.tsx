import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Data Blueprint for AI Agents" },
      { name: "description", content: "An end-to-end Data Blueprint to assess and deliver AI agents — CoE governance, Business Transformation, Data Readiness and Agents Factory." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Data Blueprint for AI Agents" },
      { property: "og:description", content: "An end-to-end Data Blueprint to assess and deliver AI agents — CoE governance, Business Transformation, Data Readiness and Agents Factory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Data Blueprint for AI Agents" },
      { name: "twitter:description", content: "An end-to-end Data Blueprint to assess and deliver AI agents — CoE governance, Business Transformation, Data Readiness and Agents Factory." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/71f6a282-f41b-4ac7-832c-ce4e5bc4cae8/id-preview-013c2b69--18170ec1-b51b-41ef-a66a-8723e694053a.lovable.app-1777412384346.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/71f6a282-f41b-4ac7-832c-ce4e5bc4cae8/id-preview-013c2b69--18170ec1-b51b-41ef-a66a-8723e694053a.lovable.app-1777412384346.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
