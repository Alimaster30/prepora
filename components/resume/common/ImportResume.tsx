"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next-nprogress-bar";
import {
  createResume,
  updateResume,
  addExperienceToResume,
  addEducationToResume,
  addSkillToResume,
} from "@/lib/actions/resume.actions";

interface ImportResumeProps {
  userId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Upload file to /api/parse-file → get raw text */
async function extractText(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/parse-file", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Failed to read file.");
  return json.text as string;
}

/** Send raw text to /api/parse-resume → get structured JSON */
async function parseResumeStructure(text: string) {
  const res = await fetch("/api/parse-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText: text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Failed to parse resume structure.");
  return json;
}

const ImportResume = ({ userId, open, onOpenChange }: ImportResumeProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "name" | "importing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [resumeTitle, setResumeTitle] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setExtractedText("");
    setResumeTitle("");
    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  /* ── Step 1: file selected ── */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const name = f.name.toLowerCase();
    const mime = f.type;
    const isValid =
      mime === "application/pdf" ||
      mime === "text/plain" ||
      mime === "" ||
      name.endsWith(".pdf") ||
      name.endsWith(".txt");

    if (!isValid) {
      toast({ title: "Invalid file", description: "Please upload a PDF or TXT file.", variant: "destructive", className: "bg-white" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB.", variant: "destructive", className: "bg-white" });
      return;
    }

    setFile(f);
    setIsExtracting(true);
    try {
      const text = await extractText(f);
      setExtractedText(text);
      // Pre-fill a title from filename
      setResumeTitle(f.name.replace(/\.(pdf|txt)$/i, "").replace(/[-_]/g, " "));
      setStep("name");
    } catch (err: any) {
      toast({ title: "Could not read file", description: err.message, variant: "destructive", className: "bg-white" });
      setFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  /* ── Step 2: create & import ── */
  const handleImport = async () => {
    if (!userId || !extractedText || !resumeTitle.trim()) return;

    setStep("importing");
    try {
      // 1. Parse structure with Gemini
      toast({ title: "Analyzing resume…", description: "AI is extracting your data. This may take a few seconds.", className: "bg-white" });
      const data = await parseResumeStructure(extractedText);

      // 2. Create blank resume
      const uuid = crypto.randomUUID();
      const created = await createResume({ resumeId: uuid, userId, title: resumeTitle.trim() });
      if (!created.success) throw new Error(created.error ?? "Failed to create resume.");

      // 3. Populate personal info + summary
      await updateResume({
        resumeId: uuid,
        updates: {
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          jobTitle: data.jobTitle ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          summary: data.summary ?? "",
        },
      });

      // 4. Populate sections in parallel
      await Promise.all([
        Array.isArray(data.experience) && data.experience.length > 0
          ? addExperienceToResume(uuid, data.experience)
          : Promise.resolve(),
        Array.isArray(data.education) && data.education.length > 0
          ? addEducationToResume(uuid, data.education)
          : Promise.resolve(),
        Array.isArray(data.skills) && data.skills.length > 0
          ? addSkillToResume(uuid, data.skills)
          : Promise.resolve(),
      ]);

      toast({ title: "Resume imported!", description: "Review and edit your resume in the builder.", className: "bg-white" });
      onOpenChange(false);
      reset();
      router.push(`/resume/my-resume/${uuid}/edit`);
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message ?? "Please try again.", variant: "destructive", className: "bg-white" });
      setStep("name");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Import Existing Resume</DialogTitle>
          <DialogDescription>
            Upload a PDF or TXT resume to bring its details into the builder.
          </DialogDescription>
        </DialogHeader>

        {/* ── Step: upload ── */}
        {step === "upload" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center hover:border-primary">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="import-resume-file"
              />
              <label htmlFor="import-resume-file" className="cursor-pointer flex flex-col items-center gap-3">
                {isExtracting ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <span className="text-sm text-gray-600">Reading file…</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">Click to upload your resume</p>
                      <p className="mt-1 text-xs text-gray-500">PDF or TXT, max 5 MB</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* ── Step: name ── */}
        {step === "name" && (
          <div className="mt-4 space-y-5">
            {/* file confirmed */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-800 truncate">{file?.name}</p>
                <p className="text-xs text-emerald-600">Text extracted successfully</p>
              </div>
              <button
                onClick={() => { setFile(null); setExtractedText(""); setStep("upload"); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="ml-auto text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Resume Title</label>
              <Input
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
                autoFocus
              />
              <p className="text-xs text-gray-500">This is just a label to identify this resume in your dashboard.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
              <Button
                onClick={handleImport}
                disabled={!resumeTitle.trim()}
                className="bg-primary text-primary-foreground hover:bg-light-800"
              >
                <FileText className="h-4 w-4 mr-2" />
                Import &amp; Edit
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: importing ── */}
        {step === "importing" && (
          <div className="mt-6 flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold text-gray-800">Importing your resume...</p>
              <p className="mt-1 text-sm text-gray-500">We are organizing the extracted details. Please wait.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportResume;
