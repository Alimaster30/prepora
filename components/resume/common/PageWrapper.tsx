import React, { ReactNode } from "react";

// Simple passthrough wrapper — layout is handled by the root (root) layout
const PageWrapper = ({ children }: { children: ReactNode }) => {
  return <div className="relative">{children}</div>;
};

export default PageWrapper;
