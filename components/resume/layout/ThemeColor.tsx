"use client";

import { useFormContext } from "@/lib/context/FormProvider";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, LayoutGrid } from "lucide-react";
import { themeColors } from "@/lib/utils";
import { updateResume } from "@/lib/actions/resume.actions";
import { useToast } from "@/components/ui/use-toast";

const ThemeColor = ({ params }: { params: { id: string } }) => {
  const { toast } = useToast();
  const { formData, handleInputChange } = useFormContext();
  const [selectedColor, setSelectedColor] = useState(themeColors[0]);

  useEffect(() => {
    setSelectedColor(formData?.themeColor || themeColors[0]);
  }, [formData?.themeColor]);

  const onColorSelect = async (color: any) => {
    setSelectedColor(color);

    handleInputChange({
      target: {
        name: "themeColor",
        value: color,
      },
    });

    const result = await updateResume({
      resumeId: params.id,
      updates: {
        themeColor: color,
      },
    });

    if (result.success) {
      toast({
        title: "Information saved.",
        description: "Theme color updated successfully.",
        className: "bg-white",
      });
    } else {
      toast({
        title: "Uh Oh! Something went wrong.",
        description: result?.error,
        variant: "destructive",
        className: "bg-white",
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" className="btn-gradient flex gap-2">
          {" "}
          <LayoutGrid /> Theme
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 text-sm font-bold">Select Theme Color</h2>
        <div className="grid grid-cols-5 gap-3">
          {themeColors.map((item, index) => (
            <div
              key={index}
              onClick={() => onColorSelect(item)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:ring-2 hover:ring-primary/30"
              style={{
                background: item,
              }}
            >
              {selectedColor == item && (
                <Check color="#ffffff" strokeWidth={3} width={20} height={20} />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeColor;
