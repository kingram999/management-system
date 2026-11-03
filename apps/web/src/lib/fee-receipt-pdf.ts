import { jsPDF } from "jspdf";
import type { FeePaymentReceipt } from "@/lib/data/fees";

function formatPdfAmount(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function addressLine(receipt: FeePaymentReceipt) {
  return [
    receipt.school.address,
    receipt.school.city,
    receipt.school.state,
    receipt.school.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function buildFeeReceiptPdf(
  receipt: FeePaymentReceipt,
): Promise<{ blob: Blob; fileName: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(receipt.school.name, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const address = addressLine(receipt);
  if (address) {
    doc.text(address, margin, y);
    y += 5;
  }
  const contact = [receipt.school.phone, receipt.school.email]
    .filter(Boolean)
    .join("  ·  ");
  if (contact) {
    doc.text(contact, margin, y);
    y += 5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("FEE RECEIPT", 210 - margin, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(receipt.receiptNumber, 210 - margin, 26, { align: "right" });

  y = Math.max(y + 4, 34);
  doc.setDrawColor(180);
  doc.line(margin, y, 210 - margin, y);
  y += 10;

  const leftCol = [
    ["Date", new Date(receipt.paidAt).toLocaleDateString()],
    ["Method", receipt.method],
    [
      "Received by",
      receipt.recordedByName || "—",
    ],
  ] as const;
  const rightCol = [
    [
      "Student",
      `${receipt.student.firstName} ${receipt.student.lastName}`,
    ],
    ["Reg. ID", receipt.student.admissionNumber],
    [
      "Class",
      [receipt.student.className, receipt.student.sectionName]
        .filter(Boolean)
        .join(" · ") || "—",
    ],
  ] as const;

  for (let i = 0; i < 3; i += 1) {
    const [lLabel, lValue] = leftCol[i];
    const [rLabel, rValue] = rightCol[i];
    doc.setTextColor(100);
    doc.text(lLabel, margin, y);
    doc.text(rLabel, 110, y);
    y += 5;
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text(String(lValue), margin, y);
    doc.text(String(rValue), 110, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  }

  y += 2;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, 210 - margin * 2, 22, 2, 2, "F");
  doc.setTextColor(100);
  doc.text("Amount received", margin + 4, y + 8);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(formatPdfAmount(receipt.amount), margin + 4, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 30;

  if (receipt.note) {
    doc.setTextColor(100);
    doc.text("Note", margin, y);
    y += 5;
    doc.setTextColor(20);
    const noteLines = doc.splitTextToSize(receipt.note, 210 - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5 + 4;
  }

  doc.setTextColor(100);
  doc.text("Annual billed", margin, y);
  doc.text("Total paid", 90, y);
  doc.text("Pending", 150, y);
  y += 5;
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text(formatPdfAmount(receipt.billed), margin, y);
  doc.text(formatPdfAmount(receipt.paidTotal), 90, y);
  doc.text(formatPdfAmount(receipt.pending), 150, y);
  doc.setFont("helvetica", "normal");
  y += 14;

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "This is a computer-generated receipt for school fee payment.",
    margin,
    y,
  );

  const blob = doc.output("blob");
  return {
    blob,
    fileName: `${receipt.receiptNumber}.pdf`,
  };
}
