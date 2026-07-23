"use server";

// pdf-parse doesn't have a proper ESM default export; use require for compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export async function extractTextFromPDF(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    const buffer = Buffer.from(fileBuffer);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
