"use client";

import { useFormContext } from "@/lib/context/FormProvider";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, LayoutTemplate } from "lucide-react";
import { updateResume } from "@/lib/actions/resume.actions";
import { useToast } from "@/components/ui/use-toast";
import {
  DEFAULT_RESUME_LAYOUT_ID,
  RESUME_LAYOUT_OPTIONS,
  normalizeResumeLayoutId,
  type ResumeLayoutId,
} from "@/lib/resume-layouts";
import { cn } from "@/lib/utils";

const ResumeLayoutPicker = ({ params }: { params: { id: string } }) => {
  const { toast } = useToast();
  const { formData, handleInputChange } = useFormContext();
  const [selected, setSelected] = useState<ResumeLayoutId>(
    DEFAULT_RESUME_LAYOUT_ID
  );

  useEffect(() => {
    setSelected(normalizeResumeLayoutId(formData?.layoutId));
  }, [formData?.layoutId]);

  const onSelect = async (layoutId: ResumeLayoutId) => {
    setSelected(layoutId);
    handleInputChange({
      target: { name: "layoutId", value: layoutId },
    });

    const result = await updateResume({
      resumeId: params.id,
      updates: { layoutId },
    });

    if (result.success) {
      toast({
        title: "Layout updated",
        description: "Your resume preview uses this design now.",
        className: "bg-white",
      });
    } else {
      toast({
        title: "Could not save layout",
        description: result?.error,
        variant: "destructive",
        className: "bg-white",
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="flex gap-2 bg-dark-300 border border-primary-200/30 hover:border-primary-200/60 text-primary-100"
        >
          <LayoutTemplate className="size-4" />
          Layout
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,22rem)]" align="start">
        <h2 className="mb-3 text-sm font-bold text-slate-800">Resume design</h2>
        <div className="flex flex-col gap-2">
          {RESUME_LAYOUT_OPTIONS.map((opt) => {
            const isActive = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect(opt.id)}
                className={cn(
                  "flex w-full gap-3 rounded-lg border p-3 text-left text-sm transition-[color,background-color,border-color] duration-200",
                  isActive
                    ? "border-primary bg-accent"
                    : "border-slate-200 bg-white hover:border-slate-400"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
                    isActive
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-slate-200 bg-white text-slate-500"
                  )}
                >
                  {isActive ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <LayoutTemplate className="size-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-500 leading-snug mt-0.5">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ResumeLayoutPicker;
