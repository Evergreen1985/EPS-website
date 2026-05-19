import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const styled  = `${prompt.trim()}, studio ghibli anime art style, beautiful, vibrant colors, detailed illustration`;
  const encoded = encodeURIComponent(styled);
  const seed    = Math.floor(Math.random() * 999999);
  const url     = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}`;

  return NextResponse.json({ url });
}
