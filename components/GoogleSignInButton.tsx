"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/actions/auth.action";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityServices = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type: "standard";
      theme: "outline";
      size: "large";
      text: "continue_with" | "signup_with";
      shape: "rectangular";
      logo_alignment: "center";
      width: number;
    }
  ): void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentityServices;
      };
    };
  }
}

export default function GoogleSignInButton({
  isSignIn,
}: {
  isSignIn: boolean;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const [scriptReady, setScriptReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        toast.error("Google did not return a sign-in credential.");
        return;
      }

      setIsBusy(true);
      try {
        const result = await signInWithGoogle({
          idToken: response.credential,
        });
        if (!result.success) {
          toast.error(result.message || "Google sign-in could not be completed.");
          return;
        }

        toast.success(
          result.isNewUser
            ? "Your workspace is ready."
            : "Welcome back to your workspace."
        );
        router.replace("/interview");
        router.refresh();
      } catch (error: unknown) {
        console.error(error);
        toast.error("Google sign-in could not be completed. Please try again.");
      } finally {
        setIsBusy(false);
      }
    },
    [router]
  );

  const renderButton = useCallback(() => {
    const container = containerRef.current;
    const identity = window.google?.accounts.id;
    if (!container || !identity || !clientId) return;

    const width = Math.max(240, Math.min(400, Math.floor(container.clientWidth)));
    if (lastWidthRef.current === width && container.childElementCount > 0) return;

    lastWidthRef.current = width;
    container.replaceChildren();
    identity.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    identity.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: isSignIn ? "continue_with" : "signup_with",
      shape: "rectangular",
      logo_alignment: "center",
      width,
    });
  }, [clientId, handleCredential, isSignIn]);

  useEffect(() => {
    if (!scriptReady || !clientId) return;
    renderButton();

    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(renderButton);
    observer.observe(container);
    return () => observer.disconnect();
  }, [clientId, renderButton, scriptReady]);

  if (!clientId) {
    return (
      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full bg-white text-sm font-semibold"
        disabled
      >
        Google sign-in is being configured
      </Button>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => toast.error("Google sign-in could not be loaded.")}
      />
      <div className="relative min-h-11 w-full">
        <div
          ref={containerRef}
          className="flex min-h-11 w-full items-center justify-center overflow-hidden"
          aria-label={isSignIn ? "Continue with Google" : "Sign up with Google"}
        />
        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-white/95 text-sm font-semibold text-muted-foreground">
            Verifying with Google...
          </div>
        )}
      </div>
    </>
  );
}
