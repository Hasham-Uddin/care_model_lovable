import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, X, RefreshCw, FileText, Edit3, Image as ImageIcon, BookOpen } from "lucide-react";
import { PdfPreviewData, rebuildPdfPreview, createPdfBlob, CoverDetails } from "@/utils/exportProjectPdf";
import { COVER_MOBILIZATION_GUIDE_BASE64 } from "@/utils/coverMobilizationGuideBase64";
import { toast } from "sonner";

interface EditableSession {
  id: string;
  session_number: number;
  session_name: string;
  status: string;
  notes: string | null;
  next_steps: string | null;
}

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: PdfPreviewData | null;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const textToHtml = (value?: string | null) => {
  if (!value?.trim()) return "<p class='muted'>No content added yet.</p>";
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("");
};

const getPdfFilename = (filename: string) =>
  filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

const downloadExistingPdfUrl = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = getPdfFilename(filename);
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const sharePdfFileIfAvailable = async (pdfBlob: Blob, filename: string) => {
  const pdfFilename = getPdfFilename(filename);
  if (typeof navigator === "undefined" || typeof File === "undefined" || !navigator.share) {
    return false;
  }

  const file = new File([pdfBlob], pdfFilename, { type: "application/pdf" });
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;

  try {
    await navigator.share({
      files: [file],
      title: pdfFilename,
      text: "Your CARE Model Strategic Plan PDF is ready.",
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return true;
    return false;
  }
};

const buildPreviewWindowHtml = (
  previewData: PdfPreviewData,
  sessions: EditableSession[],
  cover: CoverDetails
) => {
  const body = previewData.mode === "polished" && previewData.narrative
    ? `<section class='page'><h2>Strategic Plan</h2>${textToHtml(previewData.narrative)}</section>`
    : sessions.map((session) => `
        <section class='page'>
          <p class='eyebrow'>Meeting ${session.session_number}</p>
          <h2>${escapeHtml(session.session_name)}</h2>
          <span class='status'>${escapeHtml(session.status.replace(/_/g, " "))}</span>
          <h3>Meeting Notes</h3>${textToHtml(session.notes)}
          <h3>Next Steps</h3>${textToHtml(session.next_steps)}
        </section>`).join("");

  void cover;

  return `<!doctype html><html><head><title>${escapeHtml(previewData.filename)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    body{margin:0;background:#eef0f4;color:#1e1e28;font-family:'Outfit',Arial,Helvetica,sans-serif;line-height:1.55}
    .wrap{max-width:820px;margin:0 auto;padding:32px}
    .page{background:white;min-height:1060px;margin:0 0 24px;padding:56px;box-shadow:0 12px 30px rgba(20,25,40,.12);box-sizing:border-box}
    .eyebrow{font-size:12px;text-transform:uppercase;font-weight:700;color:#253B96;letter-spacing:.08em}
    h2{font-size:30px;line-height:1.1;color:#253B96;margin:0 0 20px}
    h3{font-size:14px;color:#253B96;margin:24px 0 8px}
    .muted{color:#787882;font-style:italic}
    .status{display:inline-block;border:1px solid #d8dbe5;border-radius:999px;padding:4px 10px;text-transform:capitalize;color:#32323c;background:#f5f5f8}
    .cover-page{padding:0;overflow:hidden;background:#fff;min-height:auto}
    .cover-page img{display:block;width:100%;height:auto}
    @media print{body{background:white}.wrap{padding:0}.page{box-shadow:none;margin:0;page-break-after:always}}
  </style></head><body><main class='wrap'>
    <section class='page cover-page'>
      <img src='${COVER_MOBILIZATION_GUIDE_BASE64}' alt='Community Mobilization Guide cover' />
    </section>
    <section class='page'><p class='eyebrow'>Page 2</p><h2>Letter of Acknowledgment</h2><p>As we work to eliminate social justice disparities, Measure calls for strengthening communities to self-advocate through our CARE Model, while also equipping them to interrogate artificial intelligence and the systems shaping their lives.</p><p>This CARE Model Community Mobilization Guide provides direction for partnering with your community to participate in the process of change, both in human systems and AI-driven environments.</p></section>
    <section class='page'><p class='eyebrow'>Page 3</p><h2>About Measure & The CARE Model</h2><p>Measure is a community-based research and public education organization rooted in data-driven activism for Powerful Groups Targeted for Oppression.</p><p>The C.A.R.E. model is a process for working in active partnership with communities to develop solutions to complex social problems.</p></section>
    ${body}
  </main></body></html>`;
};

export const PdfPreviewDialog = ({ open, onOpenChange, previewData }: PdfPreviewDialogProps) => {
  const [editableSessions, setEditableSessions] = useState<EditableSession[]>([]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "cover" | "edit">("preview");
  const [facilitatorName, setFacilitatorName] = useState("");
  const [orgLogoDataUrl, setOrgLogoDataUrl] = useState<string | undefined>(undefined);
  const [coverPhotoDataUrl, setCoverPhotoDataUrl] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const currentCover = (): CoverDetails => ({
    facilitatorName: facilitatorName || undefined,
    orgLogoDataUrl,
    coverPhotoDataUrl,
  });

  // Always rebuild the PDF on open so the preview reflects the latest export code
  useEffect(() => {
    if (!previewData || !open) return;

    setEditableSessions(
      previewData.sessions.map((s) => ({
        id: s.id,
        session_number: s.session_number,
        session_name: s.session_name,
        status: s.status,
        notes: s.notes,
        next_steps: s.next_steps,
      }))
    );

    // Seed cover details from preview data (if previously set) once on open
    setFacilitatorName(previewData.cover?.facilitatorName || "");
    setOrgLogoDataUrl(previewData.cover?.orgLogoDataUrl);
    setCoverPhotoDataUrl(previewData.cover?.coverPhotoDataUrl);

    const { blobUrl: freshBlobUrl } = rebuildPdfPreview(
      previewData.project,
      previewData.sessions,
      previewData.artifacts,
      previewData.interrogations,
      previewData.blobUrl,
      previewData.mode,
      previewData.narrative,
      previewData.cover,
      previewData.teamMembers || []
    );

    setBlobUrl(freshBlobUrl);
    setPreviewUrl(freshBlobUrl);
    setDownloadUrl(null);
    setIsDirty(false);
    setActiveTab("preview");

    return () => {
      URL.revokeObjectURL(freshBlobUrl);
    };
  }, [previewData, open]);

  const handleSessionChange = (index: number, field: "notes" | "next_steps", value: string) => {
    setEditableSessions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value || null };
      return updated;
    });
    setIsDirty(true);
  };

  const handleRefreshPreview = useCallback(() => {
    if (!previewData) return;

    const updatedSessions = previewData.sessions.map((s) => {
      const edited = editableSessions.find((e) => e.id === s.id);
      if (edited) {
        return { ...s, notes: edited.notes, next_steps: edited.next_steps };
      }
      return s;
    });

    const result = rebuildPdfPreview(
      previewData.project,
      updatedSessions,
      previewData.artifacts,
      previewData.interrogations,
      blobUrl ?? undefined,
      previewData.mode,
      previewData.narrative,
      currentCover(),
      previewData.teamMembers || []
    );

    setBlobUrl(result.blobUrl);
    setPreviewUrl(result.previewUrl || result.blobUrl);
    setDownloadUrl(null);
    setIsDirty(false);
    setActiveTab("preview");
    toast.success("Preview updated");
  }, [previewData, editableSessions, blobUrl, facilitatorName, orgLogoDataUrl]);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Logo must be under 4 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setOrgLogoDataUrl(reader.result as string);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Cover photo must be under 8 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPhotoDataUrl(reader.result as string);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    if (!previewData) return;
    setIsDownloading(true);

    try {
      if (downloadUrl && downloadUrl !== blobUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const updatedSessions = previewData.sessions.map((s) => {
        const edited = editableSessions.find((e) => e.id === s.id);
        if (edited) {
          return { ...s, notes: edited.notes, next_steps: edited.next_steps };
        }
        return s;
      });

      const pdfBlob = createPdfBlob(
        previewData.project,
        updatedSessions,
        previewData.artifacts,
        previewData.interrogations,
        previewData.mode,
        previewData.narrative,
        currentCover(),
        previewData.teamMembers || []
      );
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setDownloadUrl(pdfUrl);

      const shared = await sharePdfFileIfAvailable(pdfBlob, previewData.filename);
      if (shared) {
        toast.success("PDF is ready to save or share");
      } else {
        downloadExistingPdfUrl(pdfUrl, previewData.filename);
        toast.success("PDF download started");
      }
    } catch (err) {
      console.error("[PdfPreviewDialog] Download failed:", err);
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Unknown error generating PDF",
      });
    } finally {
      window.setTimeout(() => setIsDownloading(false), 500);
    }
  };

  const handleOpenPdfPreview = () => {
    if (!previewData) return;

    const updatedSessions = previewData.sessions.map((s) => {
      const edited = editableSessions.find((e) => e.id === s.id);
      if (edited) {
        return { ...s, notes: edited.notes, next_steps: edited.next_steps };
      }
      return s;
    });

    const html = buildPreviewWindowHtml(previewData, updatedSessions, currentCover());
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      toast.error("Popup blocked", { description: "Please allow popups, then try Open PDF Preview again." });
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
    previewWindow.opener = null;
  };

  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    if (downloadUrl && downloadUrl !== blobUrl) URL.revokeObjectURL(downloadUrl);
    onOpenChange(false);
  };

  const getPhase = (num: number) => {
    if (num <= 5) return "Phase 1";
    if (num <= 10) return "Phase 2";
    return "Phase 3";
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="max-w-6xl w-[96vw] h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3 text-base">
            <FileText className="h-5 w-5 text-primary" />
            <span className="truncate">{previewData?.filename}</span>
            {previewData?.mode === "polished" ? (
              <Badge className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wide">
                Strategic Plan
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Working Draft
              </Badge>
            )}
          </DialogTitle>
          <div className="flex gap-1 mt-2">
            <Button
              variant={activeTab === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("preview")}
              className="text-xs h-7"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </Button>
            <Button
              variant={activeTab === "cover" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("cover")}
              className="text-xs h-7"
            >
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Cover
            </Button>
            <Button
              variant={activeTab === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("edit")}
              className="text-xs h-7"
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit Content
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {activeTab === "preview" ? (
            <div className="relative w-full h-full bg-muted">
              {previewData?.mode === "polished" && previewData.narrative ? (
                <ScrollArea className="h-full bg-background">
                  <article className="mx-auto max-w-3xl px-8 py-10 whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {previewData.narrative}
                  </article>
                </ScrollArea>
              ) : previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              )}
              {previewData && (
                <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                  <Button size="sm" className="pointer-events-auto shadow-lg" onClick={handleOpenPdfPreview}>
                    Open PDF Preview
                  </Button>
                </div>
              )}
            </div>
          ) : activeTab === "cover" ? (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6 max-w-2xl mx-auto">
                <div className="rounded-lg border border-border bg-accent/5 p-4">
                  <p className="text-sm text-muted-foreground">
                    Personalize the cover page of the Community Mobilization Guide.
                    The Organization Name and Date are filled automatically; add a
                    facilitator name and your organization's logo below, then click{" "}
                    <strong>"Update Preview"</strong>.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    CARE Model Facilitator Name
                  </label>
                  <Input
                    value={facilitatorName}
                    onChange={(e) => {
                      setFacilitatorName(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Dr. Jane Smith"
                  />
                </div>

                <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                  <label className="text-xs font-medium text-muted-foreground">
                    Organization Logo
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 rounded-md border border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden">
                      {orgLogoDataUrl ? (
                        <img
                          src={orgLogoDataUrl}
                          alt="Organization logo preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoUpload(f);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {orgLogoDataUrl ? "Replace Logo" : "Upload Logo"}
                      </Button>
                      {orgLogoDataUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOrgLogoDataUrl(undefined);
                            setIsDirty(true);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        PNG or JPG, transparent background recommended. Max 4 MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                  <label className="text-xs font-medium text-muted-foreground">
                    Cover Photo (Hero Image)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-48 h-32 rounded-md border border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden">
                      {coverPhotoDataUrl ? (
                        <img
                          src={coverPhotoDataUrl}
                          alt="Cover photo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoUpload(f);
                          if (photoInputRef.current) photoInputRef.current.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {coverPhotoDataUrl ? "Replace Photo" : "Upload Cover Photo"}
                      </Button>
                      {coverPhotoDataUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCoverPhotoDataUrl(undefined);
                            setIsDirty(true);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Landscape photo of your community/event. JPG or PNG, max 8 MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6 max-w-3xl mx-auto">
                <div className="rounded-lg border border-border bg-accent/5 p-4">
                  <p className="text-sm text-muted-foreground">
                    Edit session notes and next steps below. After making changes, click{" "}
                    <strong>"Update Preview"</strong> to see them reflected in the PDF, or click{" "}
                    <strong>"Download PDF"</strong> to download with your edits applied.
                  </p>
                </div>

                {editableSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="rounded-lg border border-border bg-card p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Meeting {session.session_number} • {getPhase(session.session_number)}
                        </span>
                        <h3 className="font-semibold text-sm mt-0.5">{session.session_name}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          session.status === "completed"
                            ? "bg-accent/10 text-accent border-accent/20 text-xs"
                            : session.status === "in_progress"
                            ? "bg-secondary/10 text-secondary border-secondary/20 text-xs"
                            : "text-xs"
                        }
                      >
                        {session.status === "completed"
                          ? "Completed"
                          : session.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Meeting Notes
                      </label>
                      <Textarea
                        value={session.notes || ""}
                        onChange={(e) => handleSessionChange(index, "notes", e.target.value)}
                        placeholder="Add meeting notes..."
                        className="min-h-[80px] text-sm resize-y"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Next Steps
                      </label>
                      <Textarea
                        value={session.next_steps || ""}
                        onChange={(e) => handleSessionChange(index, "next_steps", e.target.value)}
                        placeholder="Add next steps..."
                        className="min-h-[60px] text-sm resize-y"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t shrink-0 flex-row justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="secondary" size="sm" onClick={handleRefreshPreview}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Preview
              </Button>
            )}
            <Button size="sm" type="button" onClick={handleDownload} disabled={isDownloading || !previewData}>
              {isDownloading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isDownloading ? "Preparing..." : "Download PDF"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
