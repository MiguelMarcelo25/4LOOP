import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export async function POST(req) {
    try {
        const url = new URL(req.url);
        const format = url.searchParams.get("format") || "pdf"; // "pdf" or "docx"

        const businessDetail = await req.json();

        // Map the variables common to both formats
        const dateIssued = businessDetail.createdAt
            ? new Date(businessDetail.createdAt).toLocaleDateString()
            : "";

        let inspectorName = "";
        if (
            businessDetail.inspectionRecords &&
            businessDetail.inspectionRecords.length > 0
        ) {
            inspectorName =
                businessDetail.inspectionRecords[0]?.officerInCharge?.fullName || "";
        } else {
            inspectorName = businessDetail.officerInCharge?.fullName || "";
        }

        let dateTimeInspected = "";
        if (
            businessDetail.inspectionRecords &&
            businessDetail.inspectionRecords.length > 0
        ) {
            dateTimeInspected = new Date(
                businessDetail.inspectionRecords[0]?.inspectionDate
            ).toLocaleString();
        }

        const {
            bidNumber = "",
            businessName = "",
            businessAddress = "",
            spNumber = "",
        } = businessDetail;

        const yearNo = new Date().getFullYear().toString();
        const outputFileName = `WAIR_${bidNumber || Date.now()}`;

        // ==========================================
        // Option 1: Generate PDF using HTML layout
        // ==========================================
        if (format === "pdf") {
            const bgImagePath = path.join(process.cwd(), "public", "WAIR_bg_0.jpeg");
            const bgImageBuffer = fs.readFileSync(bgImagePath);
            const bgImageBase64 = `data:image/jpeg;base64,${bgImageBuffer.toString("base64")}`;

            const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <style>
                @page {
                  size: Tabloid;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  width: 279.4mm;
                  height: 431.8mm;
                  font-family: Arial, sans-serif;
                  position: relative;
                  background-image: url('${bgImageBase64}');
                  background-size: 279.4mm 431.8mm; /* Tabloid dimensions */
                  background-repeat: no-repeat;
                  background-position: center top;
                }
                /* Absolute positioned text blocks */
                .absolute-text {
                  position: absolute;
                  font-weight: bold;
                  color: #000;
                  font-size: 14pt;
                }
                
                /* scaled positioning based on larger canvas ratio (~1.33x scale from A4) */
                .bid-number { top: 75mm; left: 35mm; }
                
                .business-name { top: 100mm; left: 120mm; font-size: 30pt; }
                .business-address { top: 125mm; left: 120mm; font-size: 30pt; }
                
                .inspector-name { top: 367mm; left: 63mm; font-size: 18pt; }
                .date-time { top: 367mm; left: 190mm; font-size: 18pt; }
                
                .sp-number { top: 75mm; left: 240mm; }
                .year-no { top: 150mm; left: 260mm; font-size: 20pt; }
                
                /* The header details (like Date Issued) */
                .date-issued { top: 155mm; left: 60mm; font-size: 20pt; }
                
              </style>
            </head>
            <body>
              <div class="absolute-text bid-number">${bidNumber}</div>
              <div class="absolute-text business-name">${businessName}</div>
              <div class="absolute-text business-address">${businessAddress}</div>
              
              <div class="absolute-text inspector-name">${inspectorName}</div>
              <div class="absolute-text date-time">${dateTimeInspected}</div>
              
              <div class="absolute-text sp-number">${spNumber}</div>
              <div class="absolute-text year-no">${yearNo % 100}</div>
              <div class="absolute-text date-issued">${dateIssued}</div>
            </body>
            </html>
            `;

            const browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
            const page = await browser.newPage();

            // Set viewport matching Tabloid size at 96dpi roughly (11x17 inches)
            await page.setViewport({ width: 1056, height: 1632 });
            await page.setContent(htmlContent, { waitUntil: "networkidle0" });

            const pdfBuffer = await page.pdf({
                format: "Tabloid",
                printBackground: true,
                pageRanges: "1", // Force exactly 1 page
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
            });

            await browser.close();

            return new NextResponse(pdfBuffer, {
                status: 200,
                headers: {
                    "Content-Disposition": `attachment; filename="${outputFileName}.pdf"`,
                    "Content-Type": "application/pdf",
                },
            });
        }
        // ==========================================
        // Option 2: Generate DOCX
        // ==========================================
        else if (format === "docx") {
            const templatePath = path.join(process.cwd(), "public", "WAIR.docx");
            const content = fs.readFileSync(templatePath, "binary");

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render({
                bid_number: bidNumber,
                date_issued: dateIssued,
                business_name: businessName,
                business_address: businessAddress,
                inspector_name: inspectorName,
                date_time_inspected: dateTimeInspected,
                sp_number: "SP-2026-00001",
                year_no: yearNo % 100,
            });

            const buf = doc.getZip().generate({
                type: "nodebuffer",
                compression: "DEFLATE",
            });

            return new NextResponse(buf, {
                status: 200,
                headers: {
                    "Content-Disposition": `attachment; filename="${outputFileName}.docx"`,
                    "Content-Type":
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                },
            });
        } else {
            return NextResponse.json({ error: "Invalid format specified" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error generating print WAIR output:", error);
        return NextResponse.json(
            { error: "Failed to generate file" },
            { status: 500 }
        );
    }
}
