"use client";

import { Button } from "@/components/ui/button";
import { FormProvider } from "@/lib/context/FormProvider";
import React, { useEffect, useState } from "react";
import ResumePreview from "@/components/resume/layout/my-resume/ResumePreview";
import PageWrapper from "@/components/resume/common/PageWrapper";
import { DownloadIcon, Share2Icon } from "lucide-react";
import { createResumeShare, fetchResume } from "@/lib/actions/resume.actions";
import { getResumePdfHtml2CanvasOptions } from "@/lib/resume-pdf-html2canvas";
import { toast } from "sonner";

interface FinalResumeViewProps {
  params: { id: string };
  isOwnerView: boolean;
  initialData?: any;
}

const FinalResumeView: React.FC<FinalResumeViewProps> = ({
  params,
  isOwnerView,
  initialData,
}) => {
  const [download, setDownload] = useState<boolean>(false);
  const [sharing, setSharing] = useState(false);
  const [formData, setFormData] = useState<any>(initialData ?? {});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      return;
    }
    const loadResumeData = async () => {
      try {
        const resumeData = await fetchResume(params.id);
        setFormData(JSON.parse(resumeData));
      } catch (error) {
        console.error("Error fetching resume:", error);
      }
    };
    loadResumeData();
  }, [params.id, initialData]);

  const sanitize = (str: string | undefined | null): string =>
    str?.trim().replace(/\s+/g, "_") || "User_Resume";

  const handleDownloadPDF = async () => {
    const element = document.getElementById("print-area");
    const opt = {
      margin: 0,
      filename: `${sanitize(
        `${formData?.firstName ?? "User"}_${formData?.lastName ?? ""}_${formData?.jobTitle ?? ""
        }_Resume.pdf`
      )}`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: getResumePdfHtml2CanvasOptions(),
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    if (!element) return;

    setDownload(true);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      await html2pdf().set(opt).from(element).save();
    } finally {
      setDownload(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      let url = window.location.href;
      if (isOwnerView) {
        const result = await createResumeShare(params.id);
        if (!result.success || !result.path) {
          throw new Error(result.error || "Could not create a share link.");
        }
        url = `${window.location.origin}${result.path}`;
      }
      if (navigator.share) {
        await navigator.share({
          title: `${formData?.firstName ?? ""} ${formData?.lastName ?? ""} — Resume`.trim(),
          text: "View this resume",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "Could not share this resume.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <PageWrapper>
        <FormProvider params={params} initialData={initialData}>
          <div id="no-print">
            <div className="my-8 mx-6 md:mx-16 lg:mx-28">
              {isOwnerView ? (
                <>
                  <h2 className="text-center text-2xl font-bold text-primary-100">
                    🎉 Your AI-generated resume is ready!
                  </h2>
                  <p className="text-center text-light-400 mt-1">
                    Download your resume as a PDF or share its unique link.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-center text-2xl font-bold text-primary-100">
                    Resume Preview
                  </h2>
                  <p className="text-center text-light-400 mt-1">
                    You are viewing a preview of this resume.
                  </p>
                </>
              )}
              <div className="flex max-sm:flex-col justify-center gap-4 my-8">
                <Button
                  className="flex gap-2 rounded-md bg-primary px-8 py-5 font-semibold text-primary-foreground hover:bg-light-800"
                  onClick={() => handleDownloadPDF()}
                  disabled={download}
                >
                  <DownloadIcon className="size-5" />
                  {download ? "Generating PDF..." : "Download PDF"}
                </Button>
                <Button
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex gap-2 rounded-md border border-border bg-white px-8 py-5 font-semibold text-foreground hover:bg-muted"
                >
                  <Share2Icon className="size-5" />
                  {sharing ? "Preparing link..." : "Share URL"}
                </Button>
              </div>
            </div>
          </div>
          <div className="px-10 pt-4 pb-16 max-sm:px-5 max-sm:pb-8 print:p-0">
            <div id="print-area">
              <ResumePreview />
            </div>
          </div>
        </FormProvider>
      </PageWrapper>
    </>
  );
};

export default FinalResumeView;
