"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useRouter } from "next-nprogress-bar";
import PersonalDetailsForm from "./forms/PersonalDetailsForm";
import SummaryForm from "./forms/SummaryForm";
import ExperienceForm from "./forms/ExperienceForm";
import EducationForm from "./forms/EducationForm";
import SkillsForm from "./forms/SkillsForm";
import ThemeColor from "@/components/resume/layout/ThemeColor";
import ResumeLayoutPicker from "@/components/resume/layout/ResumeLayoutPicker";
import { useToast } from "@/components/ui/use-toast";
import { useFormContext } from "@/lib/context/FormProvider";
import {
  addEducationToResume,
  addExperienceToResume,
  addSkillToResume,
  createResumeShare,
  updateResume,
} from "@/lib/actions/resume.actions";
import { getResumePdfHtml2CanvasOptions } from "@/lib/resume-pdf-html2canvas";

const ResumeEditForm = ({
  params,
  userId,
}: {
  params: { id: string };
  userId: string | undefined;
}) => {
  // ALL hooks must be called before any early return (React rules of hooks)
  const router = useRouter();
  const { toast } = useToast();
  const {
    formData,
    activeFormIndex,
    setActiveFormIndex,
    builderComplete,
    setBuilderComplete,
  } = useFormContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [pdfGenerating, setPdfGenerating] = React.useState(false);
  const [shareGenerating, setShareGenerating] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState("");

  const viewUrl = `/resume/my-resume/${params.id}/view`;
  const sanitizeFilename = (str: string | undefined | null) =>
    str?.trim().replace(/\s+/g, "_") || "User_Resume";

  const handleDownloadPDF = async () => {
    const element = document.getElementById("resume-builder-print-area");
    const opt = {
      margin: 0,
      filename: `${sanitizeFilename(
        `${formData?.firstName ?? "User"}_${formData?.lastName ?? ""}_${
          formData?.jobTitle ?? ""
        }_Resume`
      )}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: getResumePdfHtml2CanvasOptions(),
      jsPDF: { unit: "in" as const, format: "a4" as const, orientation: "portrait" as const },
    };

    if (!element) {
      toast({
        title: "Could not generate PDF",
        description: "Resume preview is not ready yet. Try again in a moment.",
        variant: "destructive",
        className: "bg-dark-300 border-destructive text-primary-100",
      });
      return;
    }

    setPdfGenerating(true);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      toast({
        title: "PDF export failed",
        description: String(e),
        variant: "destructive",
        className: "bg-dark-300 border-destructive text-primary-100",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleCopyViewLink = async () => {
    setShareGenerating(true);
    try {
      const result = await createResumeShare(params.id);
      if (!result.success || !result.path) {
        throw new Error(result.error || "Could not create a share link.");
      }
      const url = `${window.location.origin}${result.path}`;
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      toast({
        title: "Link copied",
        description: "Anyone with this private link can view your resume.",
        className: "bg-dark-300 border-primary-200/30 text-primary-100",
      });
    } catch (error) {
      toast({
        title: "Could not create share link",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
        className: "bg-dark-300 border-destructive text-primary-100",
      });
    } finally {
      setShareGenerating(false);
    }
  };

  // Guard: if no userId, show nothing (hooks already called above)
  if (!userId) {
    return null;
  }

  const handleFinish = async () => {
    setIsLoading(true);

    const updates = {
      firstName: formData?.firstName,
      lastName: formData?.lastName,
      jobTitle: formData?.jobTitle,
      address: formData?.address,
      phone: formData?.phone,
      email: formData?.email,
      summary: formData?.summary,
      experience: formData?.experience,
      education: formData?.education,
      skills: formData?.skills,
    };

    try {
      const [updateResult, experienceResult, educationResult, skillsResult] =
        await Promise.all([
          updateResume({
            resumeId: params.id,
            updates: {
              firstName: updates.firstName,
              lastName: updates.lastName,
              jobTitle: updates.jobTitle,
              address: updates.address,
              phone: updates.phone,
              email: updates.email,
              summary: updates.summary,
            },
          }),
          addExperienceToResume(params.id, Array.isArray(updates.experience) ? updates.experience : []),
          addEducationToResume(params.id, Array.isArray(updates.education) ? updates.education : []),
          addSkillToResume(params.id, Array.isArray(updates.skills) ? updates.skills : []),
        ]);

      if (
        updateResult.success &&
        experienceResult.success &&
        educationResult.success &&
        skillsResult.success
      ) {
        setBuilderComplete(true);
        toast({
          title: "Resume saved",
          description: "Download a PDF, copy your link, or preview on the right.",
          className: "bg-dark-300 border-primary-200/30 text-primary-100",
        });
        router.refresh();
      } else {
        const errorMsg =
          updateResult?.error ||
          experienceResult?.error ||
          educationResult?.error ||
          skillsResult?.error ||
          "Unknown error";
        console.error("[Finish] Save failed:", errorMsg);
        toast({
          title: "Something went wrong.",
          description: errorMsg,
          variant: "destructive",
          className: "bg-dark-300 border-destructive text-primary-100",
        });
      }
    } catch (err) {
      console.error("[Finish] Exception:", err);
      toast({
        title: "Error saving resume.",
        description: String(err),
        variant: "destructive",
        className: "bg-dark-300 border-destructive text-primary-100",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (builderComplete) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <ThemeColor params={params} />
            <ResumeLayoutPicker params={params} />
          </div>
          <Button
            className="flex gap-2 bg-dark-300 border border-primary-200/30 hover:border-primary-200/60 text-primary-100 shrink-0"
            size="sm"
            onClick={() => setBuilderComplete(false)}
          >
            <ArrowLeft /> Back to editing
          </Button>
        </div>

        <div className="rounded-lg border border-primary-200/20 bg-dark-300/40 p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-primary-100 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-400" />
              Your resume is ready
            </h3>
            <p className="text-sm text-light-400">
              Your latest version is saved. Use the preview on the right, download a PDF, or open
              the full view page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              className="flex gap-2 rounded-md bg-primary font-semibold text-primary-foreground hover:bg-light-800"
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}
            >
              <Download className="size-4" />
              {pdfGenerating ? "Generating PDF…" : "Download PDF"}
            </Button>
            <Button
              variant="outline"
              className="flex gap-2 bg-dark-300 border border-primary-200/30 hover:border-primary-200/60 text-primary-100"
              onClick={handleCopyViewLink}
              disabled={shareGenerating}
            >
              <Copy className="size-4" />
              {shareGenerating ? "Creating link..." : "Copy share link"}
            </Button>
            <Button
              variant="outline"
              className="flex gap-2 bg-dark-300 border border-primary-200/30 hover:border-primary-200/60 text-primary-100"
              asChild
            >
              <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open full page
              </a>
            </Button>
          </div>

          {shareUrl && (
            <p className="text-xs text-light-400 break-all font-mono">
              {shareUrl}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ThemeColor params={params} />
          <ResumeLayoutPicker params={params} />
        </div>
        <div className="flex gap-2">
          {activeFormIndex > 1 && (
            <Button
              className="flex gap-2 bg-dark-300 border border-primary-200/30 hover:border-primary-200/60 text-primary-100"
              size="sm"
              onClick={() => setActiveFormIndex(activeFormIndex - 1)}
            >
              <ArrowLeft /> Prev
            </Button>
          )}
          <Button
            className="flex gap-2 rounded-md bg-primary font-semibold text-primary-foreground hover:bg-light-800"
            size="sm"
            disabled={isLoading}
            onClick={async () => {
              if (activeFormIndex < 5) {
                setActiveFormIndex(activeFormIndex + 1);
              } else {
                await handleFinish();
              }
            }}
          >
            {activeFormIndex === 5 ? (
              <>
                {isLoading ? (
                  <>Finishing <Loader2 className="size-5 animate-spin" /></>
                ) : (
                  <>Finish <CheckCircle2 className="size-5" /></>
                )}
              </>
            ) : (
              <>Next <ArrowRight /></>
            )}
          </Button>
        </div>
      </div>

      {activeFormIndex === 1 ? (
        <PersonalDetailsForm params={params} />
      ) : activeFormIndex === 2 ? (
        <SummaryForm params={params} />
      ) : activeFormIndex === 3 ? (
        <ExperienceForm params={params} />
      ) : activeFormIndex === 4 ? (
        <EducationForm params={params} />
      ) : activeFormIndex === 5 ? (
        <SkillsForm params={params} />
      ) : null}
    </div>
  );
};

export default ResumeEditForm;
