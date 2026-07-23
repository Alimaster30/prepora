import { ReactNode } from "react";
import { redirect } from "next/navigation";

import AppShellNavigation from "@/components/navigation/AppShellNavigation";
import { isAuthenticated } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-background">
      <AppShellNavigation />
      <main className="app-main min-w-0 pb-24 lg:pl-[232px] lg:pb-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
