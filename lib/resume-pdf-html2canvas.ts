/**
 * html2canvas cannot parse modern CSS color functions (oklch, color-mix in oklab, etc.).
 * Inlining resolved rgb()/hex from getComputedStyle on the clone avoids parsing those values.
 */
const COLOR_PROPS = [
  "color",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "column-rule-color",
  "text-decoration-color",
  "caret-color",
  "fill",
  "stroke",
  "box-shadow",
] as const;

function inlineResolvedColors(win: Window, root: HTMLElement) {
  const walk = (node: Element) => {
    if (!(node instanceof HTMLElement)) return;
    const cs = win.getComputedStyle(node);
    for (const prop of COLOR_PROPS) {
      const val = cs.getPropertyValue(prop);
      if (!val || val === "none") continue;
      if (prop !== "box-shadow" && val === "rgba(0, 0, 0, 0)") continue;
      node.style.setProperty(prop, val);
    }
    for (const child of node.children) walk(child);
  };
  walk(root);
}

export function getResumePdfHtml2CanvasOptions(): {
  scale: number;
  onclone: (clonedDoc: Document, clonedElement: HTMLElement) => void;
} {
  return {
    scale: 2,
    onclone(clonedDoc: Document, clonedElement: HTMLElement) {
      const win = clonedDoc.defaultView;
      if (!win) return;
      inlineResolvedColors(win, clonedElement);
    },
  };
}
