"use client";

import { useState } from "react";
import { analyzeResume } from "@/lib/actions/gemini.actions";
import { fetchResume } from "@/lib/actions/resume.actions";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, CircleAlert, Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnalyzeResult {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{ category: string; recommendation: string }>;
  atsscore: number;
  summary: string;
}

const ResumeAnalyzer = ({ resumeId }: { resumeId: string }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Fetch the resume data
      const resumeData = await fetchResume(resumeId);
      const parsedResume = JSON.parse(resumeData);

      // Analyze the resume
      const result = await analyzeResume(parsedResume);
      setAnalysis(result);
      setIsOpen(true);
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze resume. Please try again.",
        variant: "destructive",
        className: "bg-white",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success-200";
    if (score >= 60) return "text-orange-500";
    return "text-destructive";
  };

  const getScoreBgColor = () => "bg-background border-border";

  return (
    <>
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        variant="outline"
        size="sm"
        className="min-h-10 gap-2 rounded-md"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reviewing...
          </>
        ) : (
          <>
            <BarChart3 className="h-4 w-4" />
            Review resume
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Resume review</DialogTitle>
            <DialogDescription>
              A focused assessment with practical improvements to make next.
            </DialogDescription>
          </DialogHeader>

          {analysis && (
            <div className="space-y-6 mt-4">
              {/* Score Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-lg border p-4 ${getScoreBgColor()}`}>
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Overall Score
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.overallScore}/100
                  </div>
                </div>
                <div className={`rounded-lg border p-4 ${getScoreBgColor()}`}>
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    ATS Compatibility
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.atsscore)}`}>
                    {analysis.atsscore}/100
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Summary</h3>
                <p className="text-gray-700 whitespace-pre-line">{analysis.summary}</p>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <CheckCircle2 aria-hidden="true" className="text-success-200" size={19} />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 text-success-200">•</span>
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
                      <span className="text-gray-800 mt-1">•</span>
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
                    <div key={index} className="rounded-lg border border-border bg-background p-4">
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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResumeAnalyzer;
