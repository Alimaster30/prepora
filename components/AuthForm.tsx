"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import FormField from "@/components/FormField";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/actions/auth.action";
import {
  passwordSignInSchema,
  passwordSignUpSchema,
  type PasswordSignInInput,
  type PasswordSignUpInput,
} from "@/lib/validations/auth";

function SignInFields() {
  const router = useRouter();
  const form = useForm<PasswordSignInInput>({
    resolver: zodResolver(passwordSignInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: PasswordSignInInput) {
    const result = await signInWithPassword(values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success("Welcome back to your workspace.");
    router.replace("/interview");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="email"
          label="Email address"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          disabled={form.formState.isSubmitting}
        />
        <FormField
          control={form.control}
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          autoComplete="current-password"
          disabled={form.formState.isSubmitting}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}

function SignUpFields() {
  const router = useRouter();
  const form = useForm<PasswordSignUpInput>({
    resolver: zodResolver(passwordSignUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordSignUpInput) {
    const result = await signUpWithPassword(values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success("Your workspace is ready.");
    router.replace("/interview");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="name"
          label="Full name"
          placeholder="Your name"
          autoComplete="name"
          disabled={form.formState.isSubmitting}
        />
        <FormField
          control={form.control}
          name="email"
          label="Email address"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          disabled={form.formState.isSubmitting}
        />
        <FormField
          control={form.control}
          name="password"
          label="Password"
          placeholder="At least 8 characters"
          type="password"
          autoComplete="new-password"
          disabled={form.formState.isSubmitting}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          placeholder="Enter the password again"
          type="password"
          autoComplete="new-password"
          disabled={form.formState.isSubmitting}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
}

const AuthForm = ({ type }: { type: FormType }) => {
  const isSignIn = type === "sign-in";

  return (
    <div className="w-full">
      <div className="mb-7">
        <p className="text-sm font-semibold text-primary">
          {isSignIn ? "Welcome back" : "Create your workspace"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em]">
          {isSignIn ? "Continue your preparation" : "Start with a clear next step"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isSignIn
            ? "Sign in with Google or use the email connected to your workspace."
            : "Create your free workspace with Google or an email and password."}
        </p>
      </div>

      <GoogleSignInButton isSignIn={isSignIn} />

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {isSignIn ? <SignInFields /> : <SignUpFields />}

      {!isSignIn && (
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          By creating an account, you agree to our{" "}
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
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;
