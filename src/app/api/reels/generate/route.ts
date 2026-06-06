import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { randomUUID } from "crypto";

const ffBin = ffmpegPath!;
// Vercel Lambda extracts files without execute permission — fix once at cold start
let ffReady = false;
async function ensureFF() {
  if (ffReady) return;
  try { await fs.chmod(ffBin, 0o755); } catch {}
  ffReady = true;
}
const ff = async (args: string[]) => {
  await ensureFF();
  return promisify(execFile)(ffBin, args);
};

export const maxDuration = 300;
export const dynamic    = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY         ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

const TRANSITIONS: Record<string, string> = {
  fade:   "fade",
  slide:  "slideleft",
  zoom:   "zoomin",
  bounce: "circlecrop",
  cut:    "fade", // a "hard cut" is a fade with a near-zero duration (see td clamp)
};

const MUSIC: Record<string, string> = {
  none:      "",
  upbeat:    "aevalsrc=0.4*sin(2*PI*t*261)+0.3*sin(2*PI*t*330)+0.2*sin(2*PI*t*392)+0.1*sin(2*PI*t*523):s=44100:c=mono",
  calm:      "aevalsrc=0.35*sin(2*PI*t*220)+0.25*sin(2*PI*t*277)+0.15*sin(2*PI*t*330):s=44100:c=mono",
  fun:       "aevalsrc=0.4*sin(2*PI*t*330)+0.3*sin(2*PI*t*392)+0.2*sin(2*PI*t*494)+0.1*sin(2*PI*t*659):s=44100:c=mono",
  energetic: "aevalsrc=0.4*sin(2*PI*t*440)+0.3*sin(2*PI*t*554)+0.2*sin(2*PI*t*659)+0.1*sin(2*PI*t*880):s=44100:c=mono",
};

// Named composer templates → concrete render params. The UI labels are aspirational
// ("acoustic", "orchestral"); the actual bed is a synthesized tone pad — closest match.
type TemplateKey = "weekly" | "sports" | "showcase";
const TEMPLATES: Record<TemplateKey, {
  transition: string; music: string; filter: string; durationPerPhoto: number; transitionDuration: number;
}> = {
  weekly:   { transition: "fade",  music: "calm",      filter: "warm",    durationPerPhoto: 3,   transitionDuration: 0.6  },
  sports:   { transition: "slide", music: "energetic", filter: "vibrant", durationPerPhoto: 1.6, transitionDuration: 0.08 },
  showcase: { transition: "fade",  music: "calm",      filter: "natural", durationPerPhoto: 3,   transitionDuration: 0.8  },
};

const CARD_BG: Record<string, string> = {
  weekly:   "#7A4A1E",
  sports:   "#1E5BA8",
  showcase: "#13322C",
  default:  "#13322C",
};

type FilterKey = "natural" | "warm" | "cool" | "vintage" | "vibrant";
interface FilterCfg { saturation?: number; brightness?: number; tint?: string }

const COLOR_FILTERS: Record<FilterKey, FilterCfg> = {
  natural: {},
  warm:    { saturation: 1.1, tint: "rgba(255,200,150,0.15)" },
  cool:    { saturation: 1.0, tint: "rgba(150,180,255,0.15)" },
  vintage: { saturation: 0.7, brightness: 1.02, tint: "rgba(200,170,130,0.2)" },
  vibrant: { saturation: 1.6, brightness: 1.05 },
};

const esc = (s: string) => (s || "").replace(/[<>&'"]/g, " ");
// Strip C0/C1 control chars (incl. NUL) before text hits SVG / FFmpeg args.
const clean = (s: any, max: number): string => {
  if (typeof s !== "string") return "";
  let out = "";
  for (const ch of s) { const code = ch.charCodeAt(0); out += (code < 32 || code === 127) ? " " : ch; }
  return out.trim().slice(0, max);
};

async function processImage(
  buf: Buffer,
  schoolName: string,
  caption: string,
  filter: string
): Promise<Buffer> {
  const cfg: FilterCfg = COLOR_FILTERS[filter as FilterKey] ?? {};
  const safeName = esc(schoolName);
  const safeCaption = esc(caption);

  const wmSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="80">` +
    `<rect width="1080" height="80" fill="rgba(0,0,0,0.55)"/>` +
    `<text x="540" y="50" font-family="Liberation Sans,sans-serif" font-size="36" font-weight="bold"` +
    ` fill="white" text-anchor="middle">${safeName}</text>` +
    `</svg>`
  );

  const composites: sharp.OverlayOptions[] = [
    { input: wmSvg, gravity: "south" },
  ];

  if (safeCaption) {
    const capSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="56">` +
      `<rect width="1080" height="56" fill="rgba(0,0,0,0.4)"/>` +
      `<text x="540" y="36" font-family="Liberation Sans,sans-serif" font-size="26"` +
      ` fill="white" text-anchor="middle">${safeCaption}</text>` +
      `</svg>`
    );
    composites.push({ input: capSvg, top: 1920 - 138, left: 0 });
  }

  if (cfg.tint) {
    const tintSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">` +
      `<rect width="1080" height="1920" fill="${cfg.tint}"/>` +
      `</svg>`
    );
    composites.push({ input: tintSvg, blend: "over" });
  }

  let img = sharp(buf).resize(1080, 1920, { fit: "cover", position: "centre" });

  if (cfg.saturation !== undefined || cfg.brightness !== undefined) {
    img = img.modulate({
      saturation: cfg.saturation ?? 1,
      brightness: cfg.brightness ?? 1,
    });
  }

  return img.composite(composites).jpeg({ quality: 90 }).toBuffer();
}

// Intro / mid / outro text cards — a solid 1080×1920 panel with a centred title.
async function makeTitleCard(title: string, subtitle: string, bg: string): Promise<Buffer> {
  const t   = esc(title).slice(0, 60);
  const sub = esc(subtitle).slice(0, 60);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">` +
    `<text x="540" y="900" font-family="Liberation Sans,sans-serif" font-size="78" font-weight="bold"` +
    ` fill="white" text-anchor="middle">${t}</text>` +
    (sub
      ? `<text x="540" y="1010" font-family="Liberation Sans,sans-serif" font-size="40"` +
        ` fill="rgba(255,255,255,0.8)" text-anchor="middle">${sub}</text>`
      : "") +
    `</svg>`
  );
  return sharp({ create: { width: 1080, height: 1920, channels: 3, background: bg } })
    .composite([{ input: svg }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

export interface GenParams {
  photoUrls: string[];
  transition: string;
  durationPerPhoto: number;
  transitionDuration: number;
  filter: string;
  music: string;
  caption: string;
  schoolName: string;
  introTitle: string;
  midText: string;
  outroText: string;
  cardBg: string;
}

type Stage =
  | { stage: "start"; total: number }
  | { stage: "images"; i: number; n: number }
  | { stage: "cards" }
  | { stage: "transitions" }
  | { stage: "music" }
  | { stage: "upload" }
  | { stage: "done"; videoUrl: string; duration: number }
  | { stage: "error"; error: string };

type OnStage = (s: Stage) => void;

// Core render. Emits real stage events through onStage as each step completes.
async function runGeneration(p: GenParams, onStage: OnStage): Promise<{ videoUrl: string; duration: number }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "reel-"));
  try {
    const transName = TRANSITIONS[p.transition] || "fade";
    const musicExpr = MUSIC[p.music] || "";

    // ── 1. Download + process photos (these become the body frames) ───────────
    onStage({ stage: "start", total: p.photoUrls.length });
    const photoFrames: Buffer[] = [];
    for (let i = 0; i < p.photoUrls.length; i++) {
      const res = await fetch(p.photoUrls[i]);
      if (!res.ok) throw new Error(`Failed to download photo ${i + 1}: ${res.status}`);
      const raw = Buffer.from(await res.arrayBuffer());
      photoFrames.push(await processImage(raw, p.schoolName, p.caption, p.filter));
      onStage({ stage: "images", i: i + 1, n: p.photoUrls.length });
    }

    // ── 2. Assemble frame order: [intro] + firstHalf + [mid] + secondHalf + [outro]
    onStage({ stage: "cards" });
    const half = Math.ceil(photoFrames.length / 2);
    const frames: Buffer[] = [];
    if (p.introTitle) frames.push(await makeTitleCard(p.introTitle, p.schoolName, p.cardBg));
    frames.push(...photoFrames.slice(0, half));
    if (p.midText) frames.push(await makeTitleCard(p.midText, "", p.cardBg));
    frames.push(...photoFrames.slice(half));
    if (p.outroText) frames.push(await makeTitleCard(p.outroText, p.schoolName, p.cardBg));

    const n = frames.length;
    // Clamp transition duration so xfade is always valid (< clip duration).
    const td = Math.max(0.05, Math.min(p.transitionDuration, p.durationPerPhoto - 0.1));
    const totalDuration = n * p.durationPerPhoto - (n - 1) * td;

    // ── 3. Each frame → a still clip ──────────────────────────────────────────
    for (let i = 0; i < n; i++) {
      const jpgPath  = path.join(tmpDir, `p${i}.jpg`);
      const clipPath = path.join(tmpDir, `c${i}.mp4`);
      await fs.writeFile(jpgPath, frames[i]);
      await ff([
        "-y",
        "-loop", "1", "-i", jpgPath,
        "-t", String(p.durationPerPhoto),
        "-r", "25",
        "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        clipPath,
      ]);
    }

    // ── 4. Splice with xfade ──────────────────────────────────────────────────
    onStage({ stage: "transitions" });
    const midPath = path.join(tmpDir, "mid.mp4");
    if (n === 1) {
      await fs.rename(path.join(tmpDir, "c0.mp4"), midPath);
    } else {
      const inputs: string[] = [];
      for (let i = 0; i < n; i++) inputs.push("-i", path.join(tmpDir, `c${i}.mp4`));

      let fc = "";
      for (let i = 0; i < n - 1; i++) {
        const inA    = i === 0 ? "[0:v]" : `[xf${i - 1}]`;
        const inB    = `[${i + 1}:v]`;
        const offset = (i * (p.durationPerPhoto - td)).toFixed(2);
        const out    = i === n - 2 ? "[out]" : `[xf${i}]`;
        fc += `${inA}${inB}xfade=transition=${transName}:duration=${td}:offset=${offset}${out};`;
      }

      await ff([
        "-y",
        ...inputs,
        "-filter_complex", fc.replace(/;$/, ""),
        "-map", "[out]",
        "-c:v", "libx264", "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        midPath,
      ]);
    }

    // ── 5. Mix in the music bed ───────────────────────────────────────────────
    onStage({ stage: "music" });
    const outPath = path.join(tmpDir, "out.mp4");
    if (musicExpr) {
      await ff([
        "-y",
        "-i", midPath,
        "-f", "lavfi", "-i", musicExpr,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "96k",
        "-t", String(Math.ceil(totalDuration)),
        "-shortest",
        outPath,
      ]);
    } else {
      await fs.rename(midPath, outPath);
    }

    // ── 6. Publish to Supabase Storage ────────────────────────────────────────
    onStage({ stage: "upload" });
    const videoBytes = await fs.readFile(outPath);
    const key = `reels/${Date.now()}_${randomUUID().slice(0, 8)}.mp4`;
    const { error: uploadErr } = await sb()
      .storage.from("media")
      .upload(key, videoBytes, { contentType: "video/mp4", upsert: true });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: { publicUrl } } = sb().storage.from("media").getPublicUrl(key);
    return { videoUrl: publicUrl, duration: Math.round(totalDuration) };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// Build validated render params from the request body. Throws on bad input.
async function resolveParams(body: any): Promise<GenParams> {
  // Prefer photo IDs and resolve URLs from the DB — never fetch arbitrary
  // client-supplied URLs into FFmpeg (SSRF). photoUrls kept for back-compat.
  let photoUrls: string[] = [];
  if (Array.isArray(body.photoIds) && body.photoIds.length) {
    const ids = body.photoIds.filter((x: any) => typeof x === "string").slice(0, 20);
    const { data } = await sb().from("section_photos").select("id, photo_url").in("id", ids);
    const map = new Map((data || []).map((r: any) => [r.id, r.photo_url]));
    photoUrls = ids.map((id: string) => map.get(id)).filter(Boolean) as string[];
  } else if (Array.isArray(body.photoUrls)) {
    photoUrls = body.photoUrls.filter((u: any) => typeof u === "string");
  }

  if (photoUrls.length === 0) throw Object.assign(new Error("photoIds or photoUrls required"), { status: 400 });
  if (photoUrls.length > 20)  throw Object.assign(new Error("Maximum 20 photos per reel"), { status: 400 });

  const tpl = TEMPLATES[body.template as TemplateKey];

  return {
    photoUrls,
    transition:         body.transition       ?? tpl?.transition       ?? "fade",
    durationPerPhoto:   Math.min(8, Math.max(1, Number(body.durationPerPhoto ?? tpl?.durationPerPhoto ?? 2))),
    transitionDuration: Number(body.transitionDuration ?? tpl?.transitionDuration ?? 0.5),
    filter:             body.filter            ?? tpl?.filter           ?? "natural",
    music:              body.music             ?? tpl?.music            ?? "none",
    caption:            clean(body.caption, 80),
    schoolName:         clean(body.schoolName, 60) || "Evergreen Preschool",
    introTitle:         clean(body.introTitle, 60),
    midText:            clean(body.midText, 60),
    outroText:          clean(body.outroText, 60),
    cardBg:             CARD_BG[body.template] || CARD_BG.default,
  };
}

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  let params: GenParams;
  try {
    params = await resolveParams(body);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 400 });
  }

  // ── Streaming mode: emit real per-stage progress as NDJSON ──────────────────
  if (body.stream) {
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (s: Stage) => controller.enqueue(enc.encode(JSON.stringify(s) + "\n"));
        try {
          const { videoUrl, duration } = await runGeneration(params, send);
          send({ stage: "done", videoUrl, duration });
        } catch (err: any) {
          console.error("Reel generation error:", err);
          send({ stage: "error", error: err?.message || "Failed to generate reel" });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
    });
  }

  // ── Legacy JSON mode (existing ReelsTab + native app) ───────────────────────
  try {
    const { videoUrl, duration } = await runGeneration(params, () => {});
    return NextResponse.json({ videoUrl, duration });
  } catch (err: any) {
    console.error("Reel generation error:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate reel" }, { status: 500 });
  }
}
