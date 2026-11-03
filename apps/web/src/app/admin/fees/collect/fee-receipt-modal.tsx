"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildFeeReceiptPdf } from "@/lib/fee-receipt-pdf";
import { getFeeReceiptAction } from "../actions";

export function FeeReceiptModal({
  paymentId,
  onClose,
}: {
  paymentId: string;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("receipt.pdf");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await getFeeReceiptAction(paymentId);
      if (cancelled) return;
      if (result.error || !result.receipt) {
        setError(result.error || "Could not load receipt.");
        setLoading(false);
        return;
      }

      try {
        const { blob, fileName: name } = await buildFeeReceiptPdf(
          result.receipt,
        );
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setFileName(name);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not build PDF.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [paymentId]);

  function onPrint() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-label="Fee receipt"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="font-semibold">Fee receipt</h3>
          <div className="flex flex-wrap gap-2">
            {pdfUrl ? (
              <>
                <a
                  href={pdfUrl}
                  download={fileName}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-background"
                >
                  Save
                </a>
                <Button type="button" size="sm" variant="secondary" onClick={onPrint}>
                  Print
                </Button>
              </>
            ) : null}
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-background p-3">
          {loading ? (
            <p className="px-2 py-10 text-center text-sm text-muted">
              Preparing PDF…
            </p>
          ) : error ? (
            <p className="px-2 py-10 text-center text-sm text-red-600">{error}</p>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              title="Fee receipt PDF"
              src={pdfUrl}
              className="h-[70vh] w-full rounded-lg border border-border bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
