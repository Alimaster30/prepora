import { generateInterviewRecord } from "@/lib/actions/general.action";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalizedLevel =
      String(body.level || "Mid-level").toLowerCase() === "mid-level"
        ? "Mid-level"
        : body.level || "Mid-level";
    const techstack = Array.isArray(body.techstack)
      ? body.techstack
      : String(body.techstack || "").split(",").map((item) => item.trim()).filter(Boolean);
    const result = await generateInterviewRecord({
      role: body.role,
      type: body.type || "Mixed",
      level: normalizedLevel,
      techstack,
      amount: 6,
    });
    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return Response.json(
      { success: false, error: "The interview request is invalid." },
      { status: 400 }
    );
  }
}
