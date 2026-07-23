"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { sanitizeResumeHtml } from "@/lib/security/sanitize-rich-html";

// Toolbar button helper
function ToolbarBtn({
  command,
  value,
  label,
}: {
  command: string;
  value?: string;
  label: React.ReactNode;
}) {
  const exec = (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand(command, false, value ?? "");
  };
  return (
    <button
      type="button"
      onMouseDown={exec}
      className="px-2 py-1 text-sm rounded hover:bg-slate-200 transition-colors"
      title={command}
    >
      {label}
    </button>
  );
}

const RichTextEditor = ({
  onRichTextEditorChange,
  defaultValue,
}: {
  onRichTextEditorChange: (value: any) => void;
  defaultValue: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // Track if we've already set the initial content to avoid cursor jumping
  const initialised = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialised.current) {
      editorRef.current.innerHTML = sanitizeResumeHtml(defaultValue || "");
      initialised.current = true;
    }
  }, [defaultValue]);

  const handleInput = useCallback(() => {
    const html = sanitizeResumeHtml(editorRef.current?.innerHTML ?? "");
    onRichTextEditorChange({ target: { name: "workSummary", value: html } });
  }, [onRichTextEditorChange]);

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 bg-dark-300 border-b border-primary-200/15 px-2 py-1.5">
        <ToolbarBtn command="bold" label={<strong className="text-primary-100">B</strong>} />
        <ToolbarBtn command="italic" label={<em className="text-primary-100">I</em>} />
        <ToolbarBtn command="underline" label={<u className="text-primary-100">U</u>} />
        <ToolbarBtn command="strikeThrough" label={<s className="text-primary-100">S</s>} />
        <span className="w-px bg-primary-200/20 mx-1" />
        <ToolbarBtn command="insertUnorderedList" label={<span className="text-light-100">• List</span>} />
        <ToolbarBtn command="insertOrderedList" label={<span className="text-light-100">1. List</span>} />
        <span className="w-px bg-primary-200/20 mx-1" />
        <ToolbarBtn command="removeFormat" label={<span className="text-light-400">✕ Clear</span>} />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[120px] p-3 text-sm text-primary-100 bg-dark-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-200/30 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
      />
    </div>
  );
};

export default RichTextEditor;
