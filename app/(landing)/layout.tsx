import { ReactNode } from "react";
import LandingNav from "@/components/landing/LandingNav";
import PublicFooter from "@/components/landing/PublicFooter";
import { isAuthenticated } from "@/lib/actions/auth.action";

const LandingLayout = async ({ children }: { children: ReactNode }) => {
  const authed = await isAuthenticated();

  return (
    <div className="min-h-screen bg-background">
      <LandingNav isAuthenticated={authed} />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
};

export default LandingLayout;
