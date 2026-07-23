"use client";

import Link from "next/link";

import GoogleSignInButton from "@/components/GoogleSignInButton";

const AuthForm = ({ type }: { type: FormType }) => {
  const isSignIn = type === "sign-in";

  return (
    <div className="w-full">
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary">
          {isSignIn ? "Welcome back" : "Create your workspace"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em]">
          {isSignIn ? "Continue your preparation" : "Start with a clear next step"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isSignIn
            ? "Continue securely with the Google account connected to your Prepora workspace."
            : "Create your free Prepora workspace securely with your Google account."}
        </p>
      </div>

      <GoogleSignInButton isSignIn={isSignIn} />

      {!isSignIn && (
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-medium text-foreground hover:text-primary">
            Terms
          </Link>{" "}
          and acknowledge our{" "}
          <Link href="/privacy" className="font-medium text-foreground hover:text-primary">
            Privacy Notice
          </Link>
          .
        </p>
      )}

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {isSignIn ? "New to Prepora?" : "Already have a workspace?"}
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="ml-1.5 font-semibold text-primary hover:text-light-800"
        >
          {isSignIn ? "Create one with Google" : "Sign in with Google"}
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;
