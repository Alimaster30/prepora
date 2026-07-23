"use client";

import { useFormContext } from "@/lib/context/FormProvider";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X } from "lucide-react";
import { updateResume } from "@/lib/actions/resume.actions";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PersonalDetailValidationSchema } from "@/lib/validations/resume";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { personalDetailFields } from "@/lib/fields";
import Image from "next/image";

/** Resize an image File to a square thumbnail, returned as base64 data URL */
function resizeImageToBase64(file: File, size = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        // center-crop square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PersonalDetailsForm = ({ params }: { params: { id: string } }) => {
  const { formData, handleInputChange } = useFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof PersonalDetailValidationSchema>>({
    resolver: zodResolver(PersonalDetailValidationSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      jobTitle: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      form.reset({
        firstName: formData?.firstName || "",
        lastName: formData?.lastName || "",
        jobTitle: formData?.jobTitle || "",
        address: formData?.address || "",
        phone: formData?.phone || "",
        email: formData?.email || "",
      });
    }
  }, [formData, form]);

  /** Handle profile picture selection */
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive", className: "bg-white" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB.", variant: "destructive", className: "bg-white" });
      return;
    }

    setIsPhotoSaving(true);
    try {
      const base64 = await resizeImageToBase64(file, 200);
      // Update context immediately for live preview
      handleInputChange({ target: { name: "photo", value: base64 } });
      // Persist the resume details.
      await updateResume({ resumeId: params.id, updates: { photo: base64 } });
      toast({ title: "Photo saved.", className: "bg-white" });
    } catch {
      toast({ title: "Failed to save photo.", variant: "destructive", className: "bg-white" });
    } finally {
      setIsPhotoSaving(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  /** Remove profile picture */
  const handleRemovePhoto = async () => {
    handleInputChange({ target: { name: "photo", value: "" } });
    await updateResume({ resumeId: params.id, updates: { photo: "" } });
    toast({ title: "Photo removed.", className: "bg-white" });
  };

  const onSave = async (data: z.infer<typeof PersonalDetailValidationSchema>) => {
    setIsLoading(true);
    const updates = { ...data };
    const result = await updateResume({ resumeId: params.id, updates });

    if (result.success) {
      toast({ title: "Information saved.", description: "Personal details updated successfully.", className: "bg-white" });
    } else {
      toast({ title: "Uh Oh! Something went wrong.", description: result?.error, variant: "destructive", className: "bg-white" });
    }
    setIsLoading(false);
  };

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h2 className="text-lg font-semibold leading-none tracking-tight">Personal Details</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started with the basic information</p>

      {/* ── Profile Picture ── */}
      <div className="mt-5 flex items-center gap-4">
        <div className="relative">
          {formData?.photo ? (
            <>
              <Image
                src={formData.photo}
                alt="Profile"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              <Camera className="w-7 h-7 text-slate-400" />
            </div>
          )}
          {isPhotoSaving && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            id="profile-photo-input"
          />
          <label
            htmlFor="profile-photo-input"
            className="cursor-pointer text-sm font-medium text-primary hover:text-light-800 underline-offset-2 hover:underline"
          >
            {formData?.photo ? "Change photo" : "Upload photo"}
          </label>
          <p className="text-xs text-slate-400">Optional · JPG, PNG, WEBP · max 5 MB</p>
        </div>
      </div>

      {/* ── Text fields ── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)}>
          <div className="grid grid-cols-2 mt-5 gap-3">
            {personalDetailFields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem className={field.fullWidth ? "col-span-2" : ""}>
                    <FormLabel className="text-slate-700 font-semibold text-md">
                      {field.label}:
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={field.type}
                        className={`no-focus ${form.formState.errors[field.name] ? "error" : "border-gray-300 bg-white"}`}
                        autoComplete="off"
                        {...formField}
                        onChange={(e) => {
                          formField.onChange(e);
                          handleInputChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <div className="mt-5 flex justify-end gap-5">
            <Button
              type="submit"
              className="bg-primary-700 hover:bg-primary-800 text-white"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {isLoading ? <><Loader2 size={20} className="animate-spin" /> &nbsp; Saving</> : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PersonalDetailsForm;
