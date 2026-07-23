"use client";

import AddResume from "@/components/resume/common/AddResume";
import ImportResume from "@/components/resume/common/ImportResume";
import ResumeCard from "@/components/resume/common/ResumeCard";
import ResumeUploadAnalyzer from "@/components/resume/common/ResumeUploadAnalyzer";
import { fetchUserResumes } from "@/lib/actions/resume.actions";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect, useState } from "react";

const DashboardCards = ({ userId }: { userId: string | undefined }) => {
  const [resumeList, setResumeList] = useState<any[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const loadResumeData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadError(false);
      const resumeData = await fetchUserResumes(userId);
      setResumeList(JSON.parse(resumeData as any));
    } catch (error) {
      console.error("Error fetching resume:", error);
      setLoadError(true);
    }
  }, [userId]);

  useEffect(() => {
    loadResumeData();
  }, [loadResumeData]);

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Saved resumes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a resume to edit, preview, or review it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <ResumeUploadAnalyzer />
        <Button
          variant="outline"
          className="min-h-10 rounded-md"
          onClick={() => userId && setImportOpen(true)}
          disabled={!userId}
        >
          <Upload className="h-4 w-4" />
          Import and edit
        </Button>
        </div>
      </div>

      {/* Import dialog */}
      <ImportResume
        userId={userId}
        open={importOpen}
        onOpenChange={(o) => {
          setImportOpen(o);
          if (!o) loadResumeData(); // refresh list after import
        }}
      />

      {loadError && (
        <div role="alert" className="state-enter mt-6 rounded-lg border border-destructive/30 bg-red-500/5 px-4 py-3 text-sm text-destructive">
          We could not load your resumes. Refresh the page to try again.
        </div>
      )}

      <div className="state-enter mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AddResume userId={userId} />

        {resumeList !== null
          ? resumeList.map((resume: any) => (
            <ResumeCard
              key={resume.resumeId}
              resume={JSON.stringify(resume)}
              refreshResumes={loadResumeData}
            />
          ))
          : userId
            ? [1, 2].map((index) => (
              <ResumeCard
                key={index}
                resume={null}
                refreshResumes={loadResumeData}
              />
            ))
            : null}
      </div>
    </>
  );
};

export default DashboardCards;
