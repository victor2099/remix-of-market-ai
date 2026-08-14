import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./site-header";

export function PageShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {footer ? <SiteFooter /> : null}
    </div>
  );
}