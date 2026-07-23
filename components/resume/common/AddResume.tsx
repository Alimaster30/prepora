"use client";

import { Loader2, PlusSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { ResumeNameValidationSchema } from "@/lib/validations/resume";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  applyResumeTemplate,
  createResume,
} from "@/lib/actions/resume.actions";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next-nprogress-bar";
import { RESUME_LAYOUT_OPTIONS } from "@/lib/resume-layouts";
import { RESUME_TEMPLATES, type ResumeTemplateId } from "@/lib/resume-templates";
import { cn } from "@/lib/utils";
import {
  Code2,
  FileText,
  GraduationCap,
  Megaphone,
  Palette,
} from "lucide-react";

const TEMPLATE_ICONS = {
  FileText,
  Code2,
  Megaphone,
  GraduationCap,
  Palette,
} as const;

const AddResume = ({ userId }: { userId: string | undefined }) => {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<ResumeTemplateId>("blank");

  const form = useForm({
    resolver: zodResolver(ResumeNameValidationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (
    values: z.infer<typeof ResumeNameValidationSchema>
  ) => {
    if (userId === undefined) {
      return;
    }

    setIsLoading(true);

    try {
      const uuid = crypto.randomUUID();

      const result = await createResume({
        resumeId: uuid,
        userId: userId,
        title: values.name,
      });

      if (!result.success) {
        toast({
          title: "Uh Oh! Something went wrong.",
          description: result?.error,
          variant: "destructive",
          className: "bg-white",
        });
        return;
      }

      const resume = JSON.parse(result.data!);

      const seeded = await applyResumeTemplate({
        resumeId: resume.resumeId,
        templateId: selectedTemplateId,
      });

      if (!seeded.success) {
        toast({
          title: "Resume created",
          description:
            seeded.error ??
            "We could not load the template. You can still fill the resume manually.",
          variant: "destructive",
          className: "bg-white",
        });
      }

      form.reset();
      setOpenDialog(false);
      setSelectedTemplateId("blank");
      router.push(`/resume/my-resume/${resume.resumeId}/edit`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="group flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center hover:border-primary hover:bg-[var(--shell)] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => userId && setOpenDialog(true)}
        disabled={!userId}
      >
        <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
          <PlusSquare aria-hidden="true" size={20} />
        </span>
        <span className="mt-4 text-sm font-semibold text-foreground">Create a resume</span>
        <span className="mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">
          Start blank or choose a structure for your role.
        </span>
      </button>

      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            form.reset({ name: "" });
            setSelectedTemplateId("blank");
          }
        }}
      >
        <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a resume</DialogTitle>
            <DialogDescription>
              Pick a starter template, name your resume, then continue in the
              builder. Replace placeholders with your own details anytime.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="comment-form"
            >
              <div className="mt-2">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Template
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto pr-0.5">
                  {RESUME_TEMPLATES.map((t) => {
                    const Icon = TEMPLATE_ICONS[t.icon];
                    const selected = selectedTemplateId === t.id;
                    const layoutLabel = RESUME_LAYOUT_OPTIONS.find(
                      (o) => o.id === t.resumeLayoutId
                    )?.label;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={cn(
                          "flex gap-3 rounded-lg border p-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          selected
                            ? "border-primary bg-accent"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        )}
                      >
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${t.themeColor}26`,
                            color: t.themeColor,
                          }}
                        >
                          <Icon className="size-5" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 leading-tight">
                            {t.label}
                          </p>
                          <p className="text-xs text-slate-500 leading-snug mt-0.5">
                            {t.description}
                          </p>
                          {layoutLabel && (
                            <p className="mt-1 text-[10px] font-medium text-primary">
                              Layout: {layoutLabel}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <p className="mb-2 mt-5 font-semibold text-slate-700">
                        Resume title
                      </p>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Example: Software engineer application"
                        className={`no-focus ${
                          form.formState.errors.name ? "error" : ""
                        }`}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-8 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setOpenDialog(false)}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> &nbsp;
                      Creating
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddResume;
