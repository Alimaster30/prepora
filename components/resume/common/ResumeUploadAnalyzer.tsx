"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  CircleAlert,
  FileText,
  Lightbulb,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AnalyzeResult {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{ category: string; recommendation: string }>;
  atsscore: number;
  summary: string;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/** Upload the file to our API route and get back the extracted text. */
async function extractTextFromFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/parse-file", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error ?? "Failed to extract text from file.");
  }

  return json.text as string;
}

/** Returns true if the file is an accepted type (PDF or TXT). */
function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  // Check by MIME type first, then fall back to extension.
  // On Windows, .txt files sometimes have an empty MIME type.
  return (
    file.type === "application/pdf" ||
    file.type === "text/plain" ||
    file.type === "" || // Windows empty MIME – rely on extension below
    name.endsWith(".pdf") ||
    name.endsWith(".txt")
  );
}

/* ─────────────────────────────────────────────
   Score colour helpers
───────────────────────────────────────────── */

function getScoreColor(score: number) {
  if (score >= 80) return "text-success-200";
  if (score >= 60) return "text-orange-500";
  return "text-destructive";
}

function getScoreBgColor() {
  return "bg-background border-border";
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

const ResumeUploadAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  /* ── File selection ── */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!isAcceptedFile(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or TXT file.",
        variant: "destructive",
        className: "bg-white",
      });
      return;
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5 MB.",
        variant: "destructive",
        className: "bg-white",
      });
      return;
    }

    setIsUploading(true);
    setUploadedFileName(file.name);
    setFileContent("");
    setAnalysis(null);

    try {
      const text = await extractTextFromFile(file);

      if (!text || text.trim().length === 0) {
        throw new Error(
          "Could not extract any text from the file. It may be empty, image-based, or corrupted."
        );
      }

      setFileContent(text);
      toast({
        title: "File Ready",
        description: `Text extracted from "${file.name}". Click Analyze Resume to continue.`,
        className: "bg-white",
      });
    } catch (error: any) {
      console.error("Error reading file:", error);
      toast({
        title: "Upload Failed",
        description:
          error.message ?? "Failed to read the file. Please try again.",
        variant: "destructive",
        className: "bg-white",
      });
      setUploadedFileName("");
      setFileContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Analyze ── */
  const handleAnalyze = async () => {
    if (!fileContent || fileContent.trim().length === 0) {
      toast({
        title: "No File Content",
        description: "Please upload a resume file first.",
        variant: "destructive",
        className: "bg-white",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: fileContent }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ?? "Failed to analyze resume. Please try again."
        );
      }

      setAnalysis(json);
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description:
          error.message ?? "Failed to analyze resume. Please try again.",
        variant: "destructive",
        className: "bg-white",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ── Remove file ── */
  const handleRemoveFile = () => {
    setUploadedFileName("");
    setFileContent("");
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Dialog close reset ── */
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes so next session starts fresh
      setAnalysis(null);
      setUploadedFileName("");
      setFileContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="min-h-10 gap-2 rounded-md">
            <Upload className="h-4 w-4" />
            Upload and review
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Review an uploaded resume
            </DialogTitle>
            <DialogDescription>
              Upload a PDF or TXT file to receive an ATS compatibility check
              and a prioritized set of improvements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* ── File Upload Area ── */}
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center hover:border-primary">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-12 w-12 text-gray-700 animate-spin" />
                    <span className="text-gray-600">
                      Extracting text from file…
                    </span>
                  </>
                ) : uploadedFileName && fileContent ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-emerald-600" />
                    <div className="space-y-2">
                      <p className="text-gray-800 font-medium">
                        {uploadedFileName}
                      </p>
                      <p className="text-sm text-emerald-600">
                        Text extracted successfully
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-gray-600 font-medium">
                        Click to upload or drag &amp; drop
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        PDF or TXT (max 5 MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* ── Analyze Button ── */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !fileContent || isUploading}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Reviewing resume...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  Review resume
                </>
              )}
            </Button>

            {/* ── Analysis Results ── */}
            {analysis && (
              <div className="space-y-6 mt-6 pt-6 border-t">
                {/* Score Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded-lg border p-4 ${getScoreBgColor()}`}
                  >
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Overall Score
                    </div>
                    <div
                      className={`text-4xl font-bold ${getScoreColor(
                        analysis.overallScore
                      )}`}
                    >
                      {analysis.overallScore}/100
                    </div>
                  </div>
                  <div
                    className={`rounded-lg border p-4 ${getScoreBgColor()}`}
                  >
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      ATS Compatibility
                    </div>
                    <div
                      className={`text-4xl font-bold ${getScoreColor(
                        analysis.atsscore
                      )}`}
                    >
                      {analysis.atsscore}/100
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">
                    Summary
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {analysis.summary}
                  </p>
                </div>

                {/* Strengths */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <CheckCircle aria-hidden="true" className="text-success-200" size={19} />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-1">✓</span>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <CircleAlert aria-hidden="true" className="text-orange-500" size={19} />
                    Areas to improve
                  </h3>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        <span className="text-gray-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Lightbulb aria-hidden="true" className="text-primary" size={19} />
                    Recommendations
                  </h3>
                  <div className="space-y-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-border bg-background p-4"
                      >
                        <div className="font-medium text-gray-800 mb-1">
                          {suggestion.category}
                        </div>
                        <div className="text-gray-700 text-sm">
                          {suggestion.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResumeUploadAnalyzer;
