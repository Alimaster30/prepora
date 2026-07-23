"use client";

import { FormProvider } from "@/lib/context/FormProvider";
import React, { useRef, useState, useEffect } from "react";
import ResumeEditForm from "./ResumeEditForm";
import ResumePreview from "./ResumePreview";

/** 210 mm at 96 dpi ≈ 794 px — the physical width of the A4 sheet */
const A4_WIDTH_PX = 794;

const ResumeEditor = ({
  params,
  userId,
}: {
  params: { id: string };
  userId: string | undefined;
}) => {
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  /* Recalculate scale whenever the preview pane resizes */
  useEffect(() => {
    const el = previewPaneRef.current;
    if (!el) return;

    const update = () => {
      // 8px padding on each side → subtract 16px from available width
      const available = el.clientWidth - 16;
      setScale(Math.min(1, available / A4_WIDTH_PX));
    };

    update(); // initial
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-light-400 text-sm">Loading your session…</p>
      </div>
    );
  }

  return (
    <FormProvider params={params}>
      <div className="px-10 pt-10 pb-2 max-sm:px-6 max-sm:pt-6 max-sm:pb-0 lg:h-[calc(100vh-80px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 justify-center items-start h-[calc(100%-5px)] max-sm:h-[calc(100%-2rem)] overflow-hidden">

          {/* ── Left: edit form ── */}
          <div className="h-full overflow-y-auto no-scrollbar p-1">
            <ResumeEditForm params={params} userId={userId} />
          </div>

          {/* ── Right: scaled preview ── */}
          <div ref={previewPaneRef} className="h-full overflow-y-auto no-scrollbar p-1">
            <div id="resume-builder-print-area">
              {/*
               * Scale the A4 sheet to fit the pane.
               * transformOrigin "top center" keeps it centred horizontally.
               * The margin-bottom trick collapses the whitespace that
               * transform:scale leaves behind (element still occupies
               * its original size in the layout flow).
               */}
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top center",
                  marginBottom: `calc(${A4_WIDTH_PX}px * (${scale} - 1))`,
                }}
              >
                <ResumePreview />
              </div>
            </div>
          </div>

        </div>
      </div>
    </FormProvider>
  );
};

export default ResumeEditor;
