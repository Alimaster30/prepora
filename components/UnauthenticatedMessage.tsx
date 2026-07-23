import Link from "next/link";
import { Button } from "@/components/ui/button";

const UnauthenticatedMessage = () => {
  return (
    <div className="card-border p-8 text-center">
      <h3 className="text-xl font-semibold mb-4">Welcome to PrepWise!</h3>
      <p className="text-gray-600 mb-6">
        Sign in to your account to access your interviews, create new ones, and track your progress.
      </p>
      <div className="flex gap-4 justify-center">
        <Button asChild className="btn-primary">
          <Link href="/sign-up">Create Account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  );
};

export default UnauthenticatedMessage;
