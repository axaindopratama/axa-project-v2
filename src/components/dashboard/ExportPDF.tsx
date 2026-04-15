"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportPDFButtonProps {
  targetId: string;
  fileName?: string;
}

export function ExportPDFButton({ targetId, fileName = "laporan-dashboard" }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        throw new Error("Element not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#18181b",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      pdf.addImage(imgData, "PNG", imgX, imgY, scaledWidth, scaledHeight);
      pdf.save(`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors text-xs uppercase font-bold tracking-widest disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? "Mengekspor..." : "Export PDF"}
    </button>
  );
}