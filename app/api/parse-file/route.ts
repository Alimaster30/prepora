import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/server/session";

export const runtime = "nodejs"; // ensure Node.js runtime (not Edge)

export async function POST(req: NextRequest) {
  try {
    await requireSessionUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "The file is larger than the 5 MB upload limit." },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    // ------------------------------------------------------------------ PDF
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      //
      // pdf-parse v2 class-based API:
      //   new PDFParse({ data: Uint8Array, ...otherPdfjsOptions })
      //   .load()          → loads the document
      //   .getText()       → returns all extracted text as a string
      //
      // IMPORTANT: the PDF bytes must be passed inside the constructor
      // options as `data: Uint8Array`, NOT as an argument to .load().
      // Calling .load(buffer) ignores the argument; .load() reads from
      // this.options which was set in the constructor.
      //
      const { PDFParse } = await import("pdf-parse");

      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      const parser = new PDFParse({ data: uint8 });
      // getText() is async and returns a TextResult object { text: string, pages: [...] }
      const textResult = await parser.getText();
      const text: string = (textResult?.text ?? "").trim();

      if (!text) {
        return NextResponse.json(
          {
            error:
              "Could not extract text from PDF. The file may be scanned/image-based or password-protected.",
          },
          { status: 422 }
        );
      }

      return NextResponse.json({ text });
    }

    // ------------------------------------------------------------------ TXT
    if (
      mimeType === "text/plain" ||
      mimeType === "" || // Windows sometimes sends empty MIME for .txt
      fileName.endsWith(".txt")
    ) {
      const text = (await file.text()).trim();

      if (!text) {
        return NextResponse.json(
          { error: "The text file appears to be empty." },
          { status: 422 }
        );
      }

      return NextResponse.json({ text });
    }

    // ----------------------------------------------------------- Unsupported
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a PDF or TXT file." },
      { status: 415 }
    );
  } catch (error: unknown) {
    console.error("[parse-file] Error:", error);
    return NextResponse.json(
      { error: "Could not parse this file." },
      { status: error instanceof Error && error.name === "AuthenticationError" ? 401 : 500 }
    );
  }
}
