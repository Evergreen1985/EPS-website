import { NextRequest } from "next/server";
import { FREE_MODELS } from "@/lib/freeModels";
import { getSchoolConfig } from "@/lib/getSchoolConfig";

interface SchoolCtx { schoolContext: string; city: string; country: string }

// ── Prompt builder ─────────────────────────────────────────────────────
function buildPrompt(tool: string, p: Record<string, string>, ctx: SchoolCtx): string {
  const { schoolContext, city, country } = ctx;
  switch (tool) {
    case "activity":
      return `You are an expert early childhood educator at ${schoolContext}.
Design a fun, hands-on classroom activity for ${p.age} year olds focusing on: ${p.skill}.
Duration: ${p.duration} | Materials: ${p.materials || "paper, crayons, blocks, playdough"}
Format: 🎯 Activity Name, 🎓 Objective, 📦 Materials, 📋 Step-by-step instructions (warm-up → main → cool-down), 🌟 Learning Outcomes, 🔄 Easier variation, 🚀 Challenge variation, 💡 Teacher Tips. Make it engaging and age-appropriate for children in ${country}.`;

    case "report":
      return `You are a warm preschool teacher at ${schoolContext}. Write a 220-280 word end-of-term progress report for ${p.childName || "the child"} (${p.age}).
Strengths: ${p.strengths || "enthusiasm and creativity"}. Growth areas: ${p.improvements || "building group confidence"}.
Write as flowing paragraphs (not bullet points). Be warm, specific, encouraging. Include home suggestions. Start directly with the child's name.`;

    case "lessonplan":
      return `Create a detailed lesson plan for ${p.age} year olds at an Indian preschool.
Topic: ${p.topic} | Duration: ${p.duration || "30 minutes"} | Style: ${p.style || "visual and kinaesthetic"}
Include: 📌 3 Objectives, 📦 Materials, ⏱️ Structure (Warm-up 5min → Concept 10min → Activity 10min → Wrap-up 5min), 📊 Assessment checklist, 🔗 Cross-curricular links, 📝 Extension activities.`;

    case "observation":
      return `Write professional observation notes (150-200 words) for a preschool child's development record.
Child: ${p.childName || "the child"} | Age: ${p.age} | Setting: ${p.setting || "classroom"}
Observed: ${p.observation}
Be objective, professional, use ECE language, note developmental significance, suggest next steps. Begin with "Date of observation:" then proceed.`;

    case "parentmsg":
      return `You are a caring preschool teacher at ${schoolContext}. Write a professional WhatsApp/email message to ${p.childName ? `${p.childName}'s parent` : "a parent"} about: ${p.topic}
Tone: friendly, empathetic, solution-focused. Length: 100-150 words. Simple English. Include specific observation, positive framing, clear next step. Start with "Dear [Parent's name]," as placeholder.`;

    case "story":
      return `Write a warm bedtime story for ${p.childName || "a little child"} (age: ${p.age}).
Theme: ${p.theme} | Lesson: ${p.lesson || "kindness"}
350-420 words. Simple vocabulary, Indian names/settings welcome, vivid details, simple dialogue, gentle resolution. End with: "💛 The End — [one-sentence takeaway]". Use 3-4 emojis naturally.`;

    case "milestone":
      return `You are a child development expert. A parent at ${schoolContext} has a ${p.age} year old.
Question/concern: ${p.concern || "general developmental guidance"}
Cover: 🌱 Key Milestones (cognitive/language/motor/social-emotional bullets), 🎮 5 Home Activities (practical, low-cost for families in ${country}), 💡 3-4 Parenting Tips, 📌 Addressing their concern (personalised, evidence-based), ⚠️ When to consult a paediatrician. Be warm and encouraging.`;

    case "childqa":
      return `You are a trusted child development and parenting expert. A parent's question about their ${p.age} year old: "${p.question}"
Give warm, practical, evidence-based answer: directly address the question, 3-5 actionable tips (bullet points), reassure where appropriate, mention professional help if relevant. End with one encouraging sentence to the parent. Simple, clear English — no jargon.`;

    case "mealidea":
      return `You are a paediatric nutritionist specialising in Indian food. Suggest healthy meals for a ${p.age} year old.
Diet: ${p.diet || "vegetarian"} | Challenge: ${p.challenge || "picky eater"}
Provide: 🍳 3 Quick Breakfasts, 🥗 3 Nutritious Lunches, 🍎 3 Healthy Snacks, 🌙 3 Easy Dinners.
Each: ingredients (easily available in India), 2-3 step prep, nutritional benefit, fun serving idea. Include regional Indian variations.`;

    case "kidstory":
      return `Write a very short exciting story (150-200 words ONLY) for a ${p.age} year old to listen to.
Character: ${p.character || "a brave little mouse"} | Setting: ${p.setting || `a magical garden in ${country}`}
Simple words, lots of action and sound words (whoosh! boom! giggle!), happy ending, 2-3 emojis, rhythm and repetition. Write directly — no title or intro.`;

    case "riddle":
      return `Create 5 fun age-appropriate riddles for ${p.age} year old children in India. About everyday things (animals, food, nature, school). Include one with an Indian element (mango, cow, monsoon, etc.). Format: 🤔 Riddle 1: [riddle] ✅ Answer: [answer]. 2-4 lines each. Clever but solvable!`;

    case "drawing":
      return `Create a fun drawing guide for ${p.age} year olds. Theme: ${p.theme || "animals"}.
🎨 Main Drawing Idea (exciting title), Step-by-step (6-8 simple steps starting from basic shapes), 🌈 Colouring suggestions, ⭐ Fun fact (child-friendly), 🎉 Encouragement message. Very simple language — make it feel like an adventure!`;

    case "song":
      return `Write a fun original children's song/rhyme for ${p.age} year olds. Theme: ${p.theme || "nature and animals"}.
2-3 verses + 1 chorus. Simple rhyme (AABB or ABAB). Easy to remember. Action suggestions in (brackets) for each verse. Uses repetition. End with a fun sound effect line! Format verses clearly.`;

    case "homeactivity":
      return `You are a creative early childhood expert. Suggest 3 fun, hands-on home activities for a ${p.age || "3–5"} year old child in India.
Theme: ${p.theme || "general fun & learning"} | Materials: ${p.materials || "household items (paper, cups, rice, dough, bottles)"}
For each activity: 🎯 Name, ⏱️ Time needed, 📦 Simple materials, 📋 3-step instructions, 🌟 What the child learns, 💡 Fun tip.
Keep it simple, safe, low-cost, and suitable for Indian homes. Make it exciting!`;

    default:
      return `Help with ${tool}: ${JSON.stringify(p)}`;
  }
}

// ── Groq streaming (OpenAI-compatible SSE) ────────────────────────────
async function streamGroq(model: string, prompt: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey || apiKey.startsWith("gsk_XXX")) {
    return errorStream("GROQ_API_KEY not configured. Get a free key from console.groq.com");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 1200,
      messages: [
        { role: "system", content: "You are a helpful assistant specialising in early childhood education and parenting. Use emojis and clear formatting." },
        { role: "user", content: prompt },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const raw = await res.text();
    let msg = raw;
    try { msg = JSON.parse(raw)?.error?.message ?? raw; } catch {}
    return errorStream(`Groq: ${msg}`);
  }

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") break;
            try {
              const json = JSON.parse(data);
              const text = json.choices?.[0]?.delta?.content ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch {}
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

// ── Gemini streaming (SSE) ────────────────────────────────────────────
async function streamGemini(model: string, prompt: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey.startsWith("AIzaSyXXX")) {
    return errorStream("GEMINI_API_KEY not configured. Get a free key from aistudio.google.com/app/apikey");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "You are a helpful assistant specialising in early childhood education and parenting. Use emojis and clear formatting." }] },
      generationConfig: { maxOutputTokens: 1200 },
    }),
    signal,
  });

  if (!res.ok) {
    const raw = await res.text();
    let msg = raw;
    try { msg = JSON.parse(raw)?.error?.message ?? raw; } catch {}
    return errorStream(`Gemini: ${msg}`);
  }

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch {}
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

function errorStream(msg: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({ start(c) { c.enqueue(encoder.encode(`❌ ${msg}`)); c.close(); } });
}

// ── Route handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool, model = "llama-3.3-70b-versatile", ...params } = body;
    if (!tool) return new Response("tool is required", { status: 400 });

    const modelDef = FREE_MODELS.find(m => m.id === model);
    if (!modelDef) return new Response("Unknown model", { status: 400 });

    const school   = await getSchoolConfig();
    const ctx: SchoolCtx = { schoolContext: school.ai.schoolContext, city: school.ai.city, country: school.ai.country };
    const prompt   = buildPrompt(tool, params, ctx);
    const ctrl     = new AbortController();
    req.signal.addEventListener("abort", () => ctrl.abort());

    const stream = await streamGroq(model, prompt, ctrl.signal);

    return new Response(stream, {
      headers: {
        "Content-Type":      "text/plain; charset=utf-8",
        "Cache-Control":     "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    if (err.name === "AbortError") return new Response("", { status: 204 });
    return new Response(`❌ ${err.message}`, { status: 500 });
  }
}

