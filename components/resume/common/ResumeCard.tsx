"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { FileText, Loader2, MoreHorizontal } from "lucide-react";

import ResumeAnalyzer from "@/components/resume/common/ResumeAnalyzer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { deleteResume } from "@/lib/actions/resume.actions";

const ResumeCard = ({
  resume,
  refreshResumes,
}: {
  resume: any;
  refreshResumes: () => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [openAlert, setOpenAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const myResume = resume ? JSON.parse(resume) : null;

  if (!myResume) {
    return <div className="skeleton min-h-[240px] rounded-xl border border-border" />;
  }

  const onDelete = async () => {
    setIsLoading(true);
    const result = await deleteResume(myResume.resumeId, pathname);
    setIsLoading(false);
    setOpenAlert(false);

    if (result.success) {
      toast({
        title: "Resume deleted",
        description: "The resume was removed from your workspace.",
        className: "bg-white",
      });
      refreshResumes();
      return;
    }

    toast({
      title: "Could not delete resume",
      description: result?.error || "Please try again.",
      variant: "destructive",
      className: "bg-white",
    });
  };

  return (
    <>
      <article className="group flex min-h-[240px] flex-col overflow-hidden rounded-xl border border-border bg-white transition-[border-color,background-color] duration-200 hover:border-slate-300 hover:bg-[var(--shell)] focus-within:border-primary/50">
        <Link
          href={`/resume/my-resume/${myResume.resumeId}/view`}
          className="flex min-h-[145px] flex-1 items-center justify-center border-b border-border bg-slate-50 transition-colors group-hover:bg-slate-100"
        >
          <div
            className="flex h-24 w-[74px] items-center justify-center rounded-sm border bg-white"
            style={{ borderTop: `3px solid ${myResume?.themeColor || "#2457D6"}` }}
          >
            <FileText
              aria-hidden="true"
              className="text-slate-400 group-hover:text-primary"
              size={28}
              strokeWidth={1.5}
            />
          </div>
          <span className="sr-only">Preview {myResume.title}</span>
        </Link>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {myResume.title}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Ready to edit or review</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-md"
                  aria-label={`Actions for ${myResume.title}`}
                >
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/resume/my-resume/${myResume.resumeId}/edit`)
                  }
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/resume/my-resume/${myResume.resumeId}/view`)
                  }
                >
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setOpenAlert(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4">
            <ResumeAnalyzer resumeId={myResume.resumeId} />
          </div>
        </div>
      </article>

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the resume from your workspace. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Keep resume</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={isLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete resume"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResumeCard;
