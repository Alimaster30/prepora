"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useFormContext } from "@/lib/context/FormProvider";
import { cn, themeColors } from "@/lib/utils";
import { normalizeResumeLayoutId, type ResumeLayoutId } from "@/lib/resume-layouts";
import { sanitizeResumeHtml } from "@/lib/security/sanitize-rich-html";

const A4 = "w-[210mm] min-h-[297mm]";
/** Exempts from globals `.bg-white:not(.print-area)` dark override; keeps paper white */
const SHEET_SURFACE = "print-area resume-sheet bg-white text-gray-900";

function usePreviewChrome() {
  const { formData, setActiveFormIndex } = useFormContext();
  const pathname = usePathname();
  const isEditMode = pathname.endsWith("/edit");
  const themeColor = formData?.themeColor || themeColors[0];

  const sectionProps = (index: number, extra?: string) => ({
    onClick: isEditMode ? () => setActiveFormIndex(index) : undefined,
    className: cn(
      isEditMode && "cursor-pointer hover:bg-gray-100/80 rounded-sm px-1 py-0.5 -mx-1",
      extra
    ),
  });

  return { formData, themeColor, sectionProps };
}

function expDateRange(experience: any) {
  const end =
    experience?.startDate && experience?.endDate === ""
      ? "Present"
      : experience?.endDate;
  const range =
    experience?.startDate &&
    (experience?.endDate || experience?.endDate === "")
      ? `${experience.startDate} to ${end}`
      : experience?.startDate && experience?.endDate
        ? `${experience.startDate} to ${experience.endDate}`
        : experience?.startDate || "";
  return range;
}

/** Original single-column layout with top accent border */
export function ClassicPreviewLayout() {
  const { formData, themeColor, sectionProps } = usePreviewChrome();

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          SHEET_SURFACE,
          "shadow-lg border-t-[20px] print:shadow-none p-12",
          A4
        )}
        style={{ borderColor: themeColor }}
      >
        <div {...sectionProps(1)}>
          <div>
            {/* Header with optional photo */}
            <div className="flex items-center justify-center gap-4 mb-2">
              {formData?.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.photo}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2"
                  style={{ borderColor: themeColor }}
                />
              )}
              <div className={formData?.photo ? "text-left" : "text-center w-full"}>
                <h2 className="font-bold text-xl" style={{ color: themeColor }}>
                  {formData?.firstName} {formData?.lastName}
                </h2>
                <h2 className="text-sm font-medium text-gray-800">{formData?.jobTitle}</h2>
                <h2 className="font-normal text-xs" style={{ color: themeColor }}>
                  {formData?.address}
                </h2>
                <div className="flex justify-between">
                  <h2 className="font-normal text-xs" style={{ color: themeColor }}>{formData?.phone}</h2>
                  <h2 className="font-normal text-xs" style={{ color: themeColor }}>{formData?.email}</h2>
                </div>
              </div>
            </div>
            <hr className="border-[1.5px] my-2 mb-5" style={{ borderColor: themeColor }} />
          </div>
        </div>

        <div {...sectionProps(2)}>
          <p className="text-xs text-justify text-gray-800">{formData?.summary}</p>
        </div>

        {formData?.experience?.length > 0 && (
          <div {...sectionProps(3, "my-6")}>
            <h2
              className="text-center font-bold text-sm mb-2"
              style={{ color: themeColor }}
            >
              Professional Experience
            </h2>
            <hr style={{ borderColor: themeColor }} />
            {formData.experience.map((experience: any, index: number) => (
              <div key={index} className="my-5">
                <h2 className="text-sm font-bold" style={{ color: themeColor }}>
                  {experience?.title}
                </h2>
                <h2 className="text-xs flex justify-between text-gray-700">
                  <span>
                    {experience?.companyName}
                    {experience?.companyName && experience?.city && ", "}
                    {experience?.city}
                    {experience?.city && experience?.state && ", "}
                    {experience?.state}
                  </span>
                  <span>{expDateRange(experience)}</span>
                </h2>
                {experience?.workSummary && (
                  <div
                    className="text-xs text-justify my-2 form-preview text-gray-800"
                    dangerouslySetInnerHTML={{ __html: sanitizeResumeHtml(experience.workSummary) }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {formData?.education?.length > 0 && (
          <div {...sectionProps(4, "my-6")}>
            <h2
              className="text-center font-bold text-sm mb-2"
              style={{ color: themeColor }}
            >
              Education
            </h2>
            <hr style={{ borderColor: themeColor }} />
            {formData.education.map((education: any, index: number) => (
              <div key={index} className="my-5">
                <h2 className="text-sm font-bold" style={{ color: themeColor }}>
                  {education.universityName}
                </h2>
                <h2 className="text-xs flex justify-between text-gray-700">
                  <span>
                    {education?.degree}
                    {education?.degree && education?.major && " in "}
                    {education?.major}
                  </span>
                  <span>
                    {education?.startDate}
                    {education?.startDate &&
                      (education?.endDate || education?.endDate === "") &&
                      " to "}
                    {education?.startDate && education?.endDate === ""
                      ? "Present"
                      : education.endDate}
                  </span>
                </h2>
                {education?.description && (
                  <p className="text-xs my-2 text-justify text-gray-800">
                    {education.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {formData?.skills?.length > 0 && (
          <div {...sectionProps(5, "my-6")}>
            <h2
              className="text-center font-bold text-sm mb-2"
              style={{ color: themeColor }}
            >
              Skill{formData.skills.length > 1 ? "s" : ""}
            </h2>
            <hr style={{ borderColor: themeColor }} />
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 my-5">
              {formData.skills.map((skill: any, index: number) => (
                <div
                  key={index}
                  className="grid grid-cols-3 items-center justify-between gap-3"
                >
                  <span className="text-xs text-gray-800">{skill.name}</span>
                  <div
                    className="h-2 w-full rounded-full col-span-2"
                    style={{ backgroundColor: "#e5e7eb" }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: themeColor,
                        width: `${(skill?.rating || 1) * 20}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Colored sidebar + main column */
export function ModernPreviewLayout() {
  const { formData, themeColor, sectionProps } = usePreviewChrome();

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          SHEET_SURFACE,
          "shadow-lg print:shadow-none overflow-hidden flex",
          A4
        )}
      >
        <aside
          className="w-[52mm] shrink-0 flex flex-col text-white px-4 py-8"
          style={{ backgroundColor: themeColor }}
        >
          <div {...sectionProps(1)}>
            {/* Optional photo at top of sidebar */}
            {formData?.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formData.photo}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-white/40 mb-4 mx-auto block"
              />
            )}
            <h1 className="text-lg font-bold leading-tight">
              {formData?.firstName} {formData?.lastName}
            </h1>
            <p className="text-xs opacity-90 mt-2 leading-snug">{formData?.jobTitle}</p>
            <div className="mt-6 space-y-2 text-[10px] opacity-90 leading-relaxed border-t border-white/25 pt-4">
              {formData?.address && <p>{formData.address}</p>}
              {formData?.phone && <p>{formData.phone}</p>}
              {formData?.email && <p className="break-all">{formData.email}</p>}
            </div>
          </div>

          {formData?.skills?.length > 0 && (
            <div {...sectionProps(5, "mt-8 flex-1")}>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-2">
                Skills
              </p>
              <ul className="space-y-2">
                {formData.skills.map((skill: any, i: number) => (
                  <li key={i} className="text-[10px]">
                    <div className="flex justify-between gap-1 mb-0.5">
                      <span>{skill.name}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${(skill?.rating || 1) * 20}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>


        <div className="flex-1 p-8 min-w-0 flex flex-col text-gray-900">
          <div {...sectionProps(2, "mb-6")}>
            <p className="text-[11px] text-justify leading-relaxed text-gray-800">
              {formData?.summary}
            </p>
          </div>

          {formData?.experience?.length > 0 && (
            <div {...sectionProps(3, "mb-6")}>
              <h3
                className="text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color: themeColor }}
              >
                Experience
              </h3>
              {formData.experience.map((experience: any, index: number) => (
                <div key={index} className="mb-4 last:mb-0">
                  <p className="text-xs font-semibold text-gray-900">{experience?.title}</p>
                  <p className="text-[10px] text-gray-600 flex justify-between gap-2">
                    <span>
                      {experience?.companyName}
                      {experience?.city ? ` · ${experience.city}` : ""}
                    </span>
                    <span className="shrink-0">{expDateRange(experience)}</span>
                  </p>
                  {experience?.workSummary && (
                    <div
                      className="text-[10px] text-justify mt-1 text-gray-800 form-preview"
                      dangerouslySetInnerHTML={{ __html: sanitizeResumeHtml(experience.workSummary) }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {formData?.education?.length > 0 && (
            <div {...sectionProps(4, "mt-auto")}>
              <h3
                className="text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color: themeColor }}
              >
                Education
              </h3>
              {formData.education.map((education: any, index: number) => (
                <div key={index} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-gray-900">{education.universityName}</p>
                  <p className="text-[10px] text-gray-600">
                    {education?.degree}
                    {education?.degree && education?.major && ` in ${education.major}`}
                  </p>
                  {education?.description && (
                    <p className="text-[10px] text-justify mt-1 text-gray-800">{education.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Light typography, left-aligned, subtle dividers */
export function MinimalPreviewLayout() {
  const { formData, sectionProps } = usePreviewChrome();

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          SHEET_SURFACE,
          "shadow-lg print:shadow-none px-12 py-14",
          A4
        )}
      >
        <div {...sectionProps(1, "mb-10")}>
          <div className="flex items-start gap-4">
            {formData?.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formData.photo}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border border-gray-200 shrink-0"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {formData?.firstName} {formData?.lastName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{formData?.jobTitle}</p>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                {[formData?.address, formData?.phone, formData?.email].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>

        <div {...sectionProps(2, "mb-8")}>
          <p className="text-xs text-justify leading-relaxed text-gray-700">
            {formData?.summary}
          </p>
        </div>

        {formData?.experience?.length > 0 && (
          <div {...sectionProps(3, "mb-8")}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-200 pb-1.5 mb-4">
              Experience
            </h3>
            {formData.experience.map((experience: any, index: number) => (
              <div key={index} className="mb-5 last:mb-0">
                <div className="flex justify-between gap-4 items-baseline">
                  <p className="text-sm font-medium text-gray-900">{experience?.title}</p>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {expDateRange(experience)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {experience?.companyName}
                  {experience?.city ? `, ${experience.city}` : ""}
                  {experience?.state ? `, ${experience.state}` : ""}
                </p>
                {experience?.workSummary && (
                  <div
                    className="text-xs text-justify mt-2 text-gray-600 form-preview"
                    dangerouslySetInnerHTML={{ __html: sanitizeResumeHtml(experience.workSummary) }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {formData?.education?.length > 0 && (
          <div {...sectionProps(4, "mb-8")}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-200 pb-1.5 mb-4">
              Education
            </h3>
            {formData.education.map((education: any, index: number) => (
              <div key={index} className="mb-4 last:mb-0">
                <p className="text-sm font-medium text-gray-900">
                  {education.universityName}
                </p>
                <p className="text-xs text-gray-500">
                  {education?.degree}
                  {education?.degree && education?.major && `, ${education.major}`}
                </p>
                {education?.description && (
                  <p className="text-xs text-gray-600 mt-1 text-justify">
                    {education.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {formData?.skills?.length > 0 && (
          <div {...sectionProps(5)}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-200 pb-1.5 mb-4">
              Skills
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {formData.skills.map((skill: any, i: number) => (
                <span key={i} className="text-xs text-gray-700">
                  {skill.name}
                  <span className="text-gray-300"> · </span>
                  <span className="text-gray-400">{skill.rating}/5</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Full-width colored header band */
export function ExecutivePreviewLayout() {
  const { formData, themeColor, sectionProps } = usePreviewChrome();

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          SHEET_SURFACE,
          "shadow-lg print:shadow-none flex flex-col overflow-hidden",
          A4
        )}
      >
        <header className="text-white px-10 py-9 shrink-0" style={{ backgroundColor: themeColor }}>
          <div {...sectionProps(1)}>
            <div className="flex items-center gap-5">
              {formData?.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.photo}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/40 shrink-0"
                />
              )}
              <div className={formData?.photo ? "text-left" : "text-center w-full"}>
                <h1 className="text-2xl font-bold tracking-tight">
                  {formData?.firstName} {formData?.lastName}
                </h1>
                <p className="text-sm opacity-95 mt-1">{formData?.jobTitle}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-[11px] opacity-90">
                  {formData?.address && <span>{formData.address}</span>}
                  {formData?.phone && <span>{formData.phone}</span>}
                  {formData?.email && <span className="break-all">{formData.email}</span>}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 px-10 py-8 text-gray-900">
          <div {...sectionProps(2, "mb-8")}>
            <p className="text-xs text-justify leading-relaxed text-gray-800">
              {formData?.summary}
            </p>
          </div>

          {formData?.experience?.length > 0 && (
            <div {...sectionProps(3, "mb-8")}>
              <h3
                className="mb-3 border-b pb-1 text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                Professional experience
              </h3>
              {formData.experience.map((experience: any, index: number) => (
                <div key={index} className="mb-5">
                  <div className="flex justify-between gap-3 items-start">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: themeColor }}>
                        {experience?.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {experience?.companyName}
                        {experience?.city ? ` · ${experience.city}, ${experience?.state || ""}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 pt-0.5">
                      {expDateRange(experience)}
                    </span>
                  </div>
                  {experience?.workSummary && (
                    <div
                      className="text-xs text-justify mt-2 text-gray-700 form-preview"
                      dangerouslySetInnerHTML={{ __html: sanitizeResumeHtml(experience.workSummary) }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {formData?.education?.length > 0 && (
            <div {...sectionProps(4, "mb-8")}>
              <h3
                className="mb-3 border-b pb-1 text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                Education
              </h3>
              {formData.education.map((education: any, index: number) => (
                <div key={index} className="mb-4">
                  <p className="text-sm font-semibold text-gray-900">{education.universityName}</p>
                  <p className="text-xs text-gray-600">
                    {education?.degree}
                    {education?.degree && education?.major && ` — ${education.major}`}
                  </p>
                  {education?.description && (
                    <p className="text-xs text-gray-600 mt-1 text-justify">
                      {education.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {formData?.skills?.length > 0 && (
            <div {...sectionProps(5)}>
              <h3
                className="mb-3 border-b pb-1 text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                Skills
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 pl-3">
                {formData.skills.map((skill: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-800 shrink-0 w-24">{skill.name}</span>
                    <div
                      className="h-1.5 flex-1 rounded-full bg-gray-100"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: themeColor,
                          width: `${(skill?.rating || 1) * 20}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LAYOUTS: Record<
  ResumeLayoutId,
  React.ComponentType
> = {
  classic: ClassicPreviewLayout,
  modern: ModernPreviewLayout,
  minimal: MinimalPreviewLayout,
  executive: ExecutivePreviewLayout,
};

export function ResumePreviewByLayout({ layoutId }: { layoutId: ResumeLayoutId }) {
  const Layout = LAYOUTS[layoutId] || ClassicPreviewLayout;
  return <Layout />;
}

export function useResolvedResumeLayoutId(): ResumeLayoutId {
  const { formData } = useFormContext();
  return normalizeResumeLayoutId(formData?.layoutId);
}
