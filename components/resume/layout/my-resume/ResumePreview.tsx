"use client";

import React from "react";
import { useFormContext } from "@/lib/context/FormProvider";
import {
  ResumePreviewByLayout,
  useResolvedResumeLayoutId,
} from "./ResumePreviewLayouts";

const ResumePreview = () => {
  const { formData } = useFormContext();
  const layoutId = useResolvedResumeLayoutId();

  if (Object.keys(formData || {}).length === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-[210mm] min-h-[297mm] rounded-sm shadow-lg skeleton" />
      </div>
    );
  }

  return <ResumePreviewByLayout layoutId={layoutId} />;
};

export default ResumePreview;
