"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth.action";
import { cn } from "@/lib/utils";

const SignOutButton = ({ compact = false }: { compact?: boolean }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label={compact ? "Sign out" : undefined}
      className={cn(
        "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        compact && "size-11 w-11 justify-center p-0"
      )}
    >
      <LogOut aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      {!compact && <span>Sign out</span>}
    </button>
  );
};

export default SignOutButton;
