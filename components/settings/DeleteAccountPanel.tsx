"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/lib/actions/auth.action";

export default function DeleteAccountPanel() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    if (confirmation !== "DELETE") return;
    setDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !result.success) {
        throw new Error(result.error || "We could not delete the account.");
      }

      toast.success("Your account and saved data have been deleted.");
      router.replace("/?accountDeleted=1");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "We could not delete the account.";
      if (message.includes("sign in with Google again")) {
        toast.error(message);
        await signOut().catch(() => undefined);
        router.replace("/sign-in?reauth=delete-account");
        router.refresh();
      } else {
        toast.error(message);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-xl border border-red-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Delete account</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Permanently delete your Prepora profile, interviews, feedback,
            schedules, resumes, usage records, and public resume links.
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-5">
            Delete my account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Type DELETE to confirm. For security, your
              Google sign-in must be less than ten minutes old.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirmation">Type DELETE</Label>
            <Input
              id="delete-confirmation"
              value={confirmation}
              autoComplete="off"
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep account</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void deleteAccount();
              }}
              disabled={deleting || confirmation !== "DELETE"}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
