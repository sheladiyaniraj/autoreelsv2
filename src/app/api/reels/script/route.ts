import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateScript, type ScriptInputType } from "@/lib/providers/script";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    inputType?: ScriptInputType;
    inputValue?: string;
  };

  if (!body.inputType || !body.inputValue?.trim()) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  try {
    const script = await generateScript({
      inputType: body.inputType,
      inputValue: body.inputValue.trim(),
    });
    return NextResponse.json({ script });
  } catch (err) {
    console.error("Script generation failed", err);
    return NextResponse.json({ error: "Script generation failed" }, { status: 500 });
  }
}
