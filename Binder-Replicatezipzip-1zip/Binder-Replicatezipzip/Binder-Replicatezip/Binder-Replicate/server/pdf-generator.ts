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
    });

    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => {
      buffers.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    doc.on("error", reject);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("CALL SHEET", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, {
        align: "center",
      });

    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke("#cccccc");
    doc.moveDown(1);

    // Event Information Section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("EVENT INFORMATION", { underline: true });
    doc.moveDown(0.3);

    const eventStartDate = new Date(data.eventDetails.startTime);
    const eventEndDate = new Date(data.eventDetails.endTime);

    const infoRows = [
      ["Title:", data.eventDetails.title],
      ["Type:", data.eventDetails.type],
      ["Date:", eventStartDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })],
      ["Call Time:", eventStartDate.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      })],
      ["Estimated Wrap:", eventEndDate.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      })],
      ["Location:", data.eventDetails.description || "TBD"],
    ];

    doc.fontSize(9).font("Helvetica");
    infoRows.forEach(([label, value]) => {
      doc.text(`${label} ${value || ""}`, { align: "left" });
      doc.moveDown(0.25);
    });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke("#cccccc");
    doc.moveDown(0.8);

    // Crew Section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("CREW ASSIGNMENTS", { underline: true });
    doc.moveDown(0.3);

    if (data.crewMembers && data.crewMembers.length > 0) {
      doc.fontSize(8).font("Helvetica-Bold");
      const colX = [40, 150, 270, 380, 480];
      doc.text("Name", colX[0], doc.y);
      doc.text("Department", colX[1], doc.y);
      doc.text("Title", colX[2], doc.y);
      doc.text("Contact", colX[3], doc.y);

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke("#e0e0e0");
      doc.moveDown(0.3);

      doc.fontSize(8).font("Helvetica");
      data.crewMembers.forEach((member, index) => {
        const memberY = doc.y;
        doc.text(member.name, colX[0], memberY);
        doc.text(member.department || "", colX[1], memberY);
        doc.text(member.title || "", colX[2], memberY);
        doc.text(member.contact || "N/A", colX[3], memberY);
        doc.moveDown(0.4);

        // Add page break if needed
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          doc.moveDown(0.5);
        }
      });
    } else {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#999999")
        .text("No crew members assigned to this event.");
      doc.fillColor("#000000");
    }

    doc.moveDown(0.8);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke("#cccccc");
    doc.moveDown(0.8);

    // Equipment Section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("EQUIPMENT & RESOURCES", { underline: true });
    doc.moveDown(0.3);

    if (data.equipmentList && data.equipmentList.length > 0) {
      doc.fontSize(8).font("Helvetica-Bold");
      doc.text("Equipment", 40, doc.y);
      doc.text("Category", 200, doc.y);
      doc.text("Quantity", 350, doc.y);

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke("#e0e0e0");
      doc.moveDown(0.3);

      doc.fontSize(8).font("Helvetica");
      data.equipmentList.forEach((item) => {
        doc.text(item.name || "Equipment", 40, doc.y);
        doc.text(item.category || "", 200, doc.y);
        doc.text((item.quantity || 1).toString(), 350, doc.y);
        doc.moveDown(0.4);
      });
    } else {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#999999")
        .text("No equipment assigned to this event.");
      doc.fillColor("#000000");
    }

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke("#cccccc");
    doc.moveDown(1);

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#666666")
      .text("This call sheet was generated by Studio Binder Production Management Platform", {
        align: "center",
      });

    doc.end();
  });
}
