import { generateInterviewRecord } from "@/lib/actions/general.action";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const typeLookup: Record<string, string> = {
      technical: "Technical",
      behavioral: "Behavioral",
      mixed: "Mixed",
    };
    const levelLookup: Record<string, string> = {
      "entry-level": "Entry-level",
      junior: "Junior",
      "mid-level": "Mid-level",
      senior: "Senior",
      lead: "Lead",
    };
    const result = await generateInterviewRecord({
      role: body.role,
      type: typeLookup[String(body.type || "Mixed").toLowerCase()] || body.type,
      level: levelLookup[String(body.level || "Mid-level").toLowerCase()] || body.level,
      techstack: Array.isArray(body.techstack)
        ? body.techstack
        : String(body.techstack || "").split(",").map((item) => item.trim()).filter(Boolean),
      amount: Number(body.amount) || 6,
    });
    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return Response.json(
      { success: false, error: "The interview request is invalid." },
      { status: 400 }
    );
  }
}

export async function GET() {
  return Response.json({ success: false, error: "Method not allowed." }, { status: 405 });
}
