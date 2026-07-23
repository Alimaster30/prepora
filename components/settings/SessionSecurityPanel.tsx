"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function SessionSecurityPanel() {
  const router = useRouter();
  const [revoking, setRevoking] = useState(false);

  async function revokeSessions() {
    setRevoking(true);
    try {
      const response = await fetch("/api/account/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not revoke sessions.");
      }
      toast.success("All sessions were revoked. Sign in again to continue.");
      router.replace("/sign-in?sessionsRevoked=1");
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not revoke sessions.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <LogOut aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Active access</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Revoke every Prepora session if you used a shared device or suspect
            unauthorized access. You will be signed out here too.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            disabled={revoking}
            onClick={() => void revokeSessions()}
          >
            {revoking ? "Revoking..." : "Sign out all devices"}
          </Button>
        </div>
      </div>
    </section>
  );
}
