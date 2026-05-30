import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { retrieveChunks } from "@/lib/rag";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { ageMonths, interests = [], duration = 30 } = await req.json();

    if (typeof ageMonths !== "number" || ageMonths < 1) {
      return NextResponse.json({ error: "ageMonths must be a positive number" }, { status: 400 });
    }

    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    const ageLabel = years > 0
      ? (months > 0 ? `${years} yr ${months} mo` : `${years} year${years > 1 ? "s" : ""}`)
      : `${ageMonths} months`;

    const interestText = interests.length > 0 ? interests.join(", ") : "general play and exploration";
    const query = `activities for ${ageLabel} old child interests ${interestText} ${duration} minutes`;

    // Try to retrieve relevant activity content from KB
    let kbContext = "";
    let sources: string[] = [];
    try {
      const chunks = await retrieveChunks(query, "both", 4);
      if (chunks.length > 0) {
        kbContext = "\n\nRelevant curriculum references:\n" + chunks.map(c => `[${c.document_title}]: ${c.content}`).join("\n\n");
        sources = [...new Set(chunks.map(c => c.document_title))];
      }
    } catch {
      // KB not set up yet — fall back to model knowledge
    }

    const systemPrompt = `You are an expert early childhood educator at Evergreen Preschool, Bengaluru, trained in NEP 2020 Foundational Stage and NCF-FS principles. You design developmentally appropriate, culturally relevant activities for Indian preschool children. Always align with NCF-FS play-based learning principles.`;

    const userPrompt = `Design 3 engaging ${duration}-minute activities for a ${ageLabel} old child interested in: ${interestText}.${kbContext}

Return ONLY valid JSON with this exact structure:
{
  "activities": [
    {
      "name": "Activity Name",
      "emoji": "🎨",
      "age_suitability": "${ageLabel}",
      "materials": ["item 1", "item 2", "item 3"],
      "steps": ["Step 1 description", "Step 2 description", "Step 3 description", "Step 4 description"],
      "goals": {
        "Fine Motor": true,
        "Language": false,
        "Cognitive": true,
        "Social-Emotional": false,
        "Physical": false
      },
      "ncf_alignment": "Brief NCF-FS connection (1 sentence)",
      "source": "NCF Foundational Stage / Evergreen Curriculum"
    }
  ],
  "age_note": "Brief developmental note about ${ageLabel} old children"
}`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to generate activities" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    if (sources.length > 0 && parsed.activities) {
      parsed.activities = parsed.activities.map((a: any) => ({
        ...a,
        source: sources[0] || a.source,
      }));
    }

    return NextResponse.json({ ...parsed, sources, ageLabel });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
