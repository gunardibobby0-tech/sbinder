import PDFDocument from "pdfkit";
import { Readable } from "stream";
import type { Event } from "@shared/schema";

interface CallSheetData {
  eventDetails: Event;
  crewMembers: Array<{
    id: number;
    name: string;
    title: string;
    department: string;
    contact?: string;
  }>;
  equipmentList: any[];
}

export async function generateCallSheetPDF(data: CallSheetData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      bufferPages: true,
      margin: 40,
      size: 'A4'
    });

    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => {
      buffers.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    doc.on("error", reject);

    // Styling constants
    const colors = {
      primary: "#1a1a1a",
      secondary: "#4a4a4a",
      accent: "#e5e7eb",
      border: "#cccccc",
      rowEven: "#ffffff",
      rowOdd: "#f9fafb"
    };

    // Helper: Draw Table Header
    const drawTableHeader = (y: number, columns: { label: string; x: number; width: number }[]) => {
      doc.rect(40, y, doc.page.width - 80, 20).fill(colors.accent);
      doc.fillColor(colors.primary).font("Helvetica-Bold").fontSize(9);
      columns.forEach(col => {
        doc.text(col.label, col.x, y + 6, { width: col.width, align: "left" });
      });
      return y + 20;
    };

    // Helper: Draw Row
    const drawTableRow = (y: number, values: string[], columns: { x: number; width: number }[], isOdd: boolean) => {
      const rowHeight = 18;
      if (isOdd) {
        doc.rect(40, y, doc.page.width - 80, rowHeight).fill(colors.rowOdd);
      }
      doc.fillColor(colors.secondary).font("Helvetica").fontSize(8);
      values.forEach((val, i) => {
        doc.text(val || "", columns[i].x, y + 5, { width: columns[i].width, align: "left" });
      });
      return y + rowHeight;
    };

    // Header Branding
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(colors.primary)
      .text("CALL SHEET", { align: "right" });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(colors.secondary)
      .text(`PRODUCTION ID: #${data.eventDetails.projectId}`, 40, 40);

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke(colors.border);
    doc.moveDown(1);

    // Event Info Grid
    const startY = doc.y;
    const eventStartDate = new Date(data.eventDetails.startTime);
    const eventEndDate = new Date(data.eventDetails.endTime);

    // Left Column
    doc.fontSize(14).font("Helvetica-Bold").text(data.eventDetails.title, 40, startY);
    doc.fontSize(10).font("Helvetica").text(data.eventDetails.description || "No description provided", 40, doc.y + 5, { width: 250 });

    // Right Column Info Box
    const infoX = 350;
    let infoY = startY;
    
    const infoRows = [
      ["DATE", eventStartDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
      ["CALL TIME", eventStartDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })],
      ["WRAP TIME", eventEndDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })],
      ["TYPE", data.eventDetails.type.toUpperCase()]
    ];

    infoRows.forEach(([label, value]) => {
      doc.fontSize(8).font("Helvetica-Bold").fillColor(colors.secondary).text(label, infoX, infoY);
      doc.fontSize(10).font("Helvetica").fillColor(colors.primary).text(value, infoX + 70, infoY);
      infoY += 15;
    });

    doc.y = Math.max(doc.y, infoY) + 20;
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke(colors.border);
    doc.moveDown(1.5);

    // Crew Section with Professional Grid
    doc.fontSize(12).font("Helvetica-Bold").text("CREW CONTACT LIST");
    doc.moveDown(0.5);

    if (data.crewMembers && data.crewMembers.length > 0) {
      const crewCols = [
        { label: "NAME", x: 45, width: 140 },
        { label: "DEPARTMENT", x: 190, width: 110 },
        { label: "POSITION", x: 305, width: 110 },
        { label: "CONTACT / PHONE", x: 420, width: 130 }
      ];

      let currentY = drawTableHeader(doc.y, crewCols);

      data.crewMembers.forEach((member, i) => {
        if (currentY > doc.page.height - 60) {
          doc.addPage();
          currentY = drawTableHeader(40, crewCols);
        }
        currentY = drawTableRow(currentY, [
          member.name,
          member.department || "General",
          member.title || "Crew",
          member.contact || "N/A"
        ], crewCols, i % 2 === 1);
      });
      doc.y = currentY + 20;
    } else {
      doc.fontSize(9).font("Helvetica-Oblique").fillColor(colors.secondary).text("No crew assignments found.");
      doc.moveDown(1);
    }

    // Equipment Section
    if (doc.y > doc.page.height - 150) doc.addPage();
    
    doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.primary).text("EQUIPMENT MANIFEST");
    doc.moveDown(0.5);

    if (data.equipmentList && data.equipmentList.length > 0) {
      const eqCols = [
        { label: "ITEM DESCRIPTION", x: 45, width: 250 },
        { label: "CATEGORY", x: 300, width: 150 },
        { label: "QTY", x: 460, width: 50 }
      ];

      let currentY = drawTableHeader(doc.y, eqCols);

      data.equipmentList.forEach((item, i) => {
        if (currentY > doc.page.height - 60) {
          doc.addPage();
          currentY = drawTableHeader(40, eqCols);
        }
        currentY = drawTableRow(currentY, [
          item.name || "Unnamed Item",
          item.category || "General",
          (item.quantity || 1).toString()
        ], eqCols, i % 2 === 1);
      });
    } else {
      doc.fontSize(9).font("Helvetica-Oblique").fillColor(colors.secondary).text("No equipment reserved for this session.");
    }

    // Professional Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(40, doc.page.height - 50).lineTo(doc.page.width - 40, doc.page.height - 50).stroke(colors.border);
      doc.fontSize(7).fillColor(colors.secondary).text(
        `STUDIOBINDER PRODUCTION MANAGEMENT | PAGE ${i + 1} OF ${range.count} | GENERATED ON ${new Date().toLocaleDateString()}`,
        40,
        doc.page.height - 40,
        { align: "center" }
      );
    }

    doc.end();
  });
});