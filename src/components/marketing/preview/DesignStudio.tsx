"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { DesignId } from "@/content/marketing/designs";
import { PreviewDialog } from "./PreviewDialog";

type DesignStudio = {
  /** Open the preview sheet for a design. */
  openPreview: (id: DesignId) => void;
  /** Design chosen by the visitor (pre-fills the enquiry form). */
  chosen: DesignId | "";
  setChosen: (id: DesignId | "") => void;
};

const DesignStudioContext = createContext<DesignStudio | null>(null);

export function useDesignStudio() {
  const ctx = useContext(DesignStudioContext);
  if (!ctx) throw new Error("useDesignStudio must be used inside <DesignStudioProvider>");
  return ctx;
}

/**
 * Shared state between the collection, the preview sheet and the enquiry form.
 * Server-rendered sections are passed through as children.
 */
export function DesignStudioProvider({ children }: { children: ReactNode }) {
  const [previewId, setPreviewId] = useState<DesignId | null>(null);
  const [chosen, setChosen] = useState<DesignId | "">("");

  const openPreview = useCallback((id: DesignId) => setPreviewId(id), []);
  const closePreview = useCallback(() => setPreviewId(null), []);
  const chooseFromPreview = useCallback((id: DesignId) => {
    setChosen(id);
    setPreviewId(null);
    setTimeout(() => document.getElementById("begin")?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  const value = useMemo(() => ({ openPreview, chosen, setChosen }), [openPreview, chosen]);

  return (
    <DesignStudioContext.Provider value={value}>
      {children}
      {previewId && <PreviewDialog initialId={previewId} onClose={closePreview} onChoose={chooseFromPreview} />}
    </DesignStudioContext.Provider>
  );
}

/** A button that opens the preview sheet for one design. */
export function PreviewTrigger({
  design,
  className,
  style,
  children,
  label,
}: {
  design: DesignId;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  label: string;
}) {
  const { openPreview } = useDesignStudio();
  return (
    <button type="button" aria-label={label} className={className} style={style} onClick={() => openPreview(design)}>
      {children}
    </button>
  );
}
