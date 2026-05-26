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
};

const MUSIC: Record<string, string> = {
  none:      "",
  upbeat:    "aevalsrc=0.4*sin(2*PI*t*261)+0.3*sin(2*PI*t*330)+0.2*sin(2*PI*t*392)+0.1*sin(2*PI*t*523):s=44100:c=mono",
  calm:      "aevalsrc=0.35*sin(2*PI*t*220)+0.25*sin(2*PI*t*277)+0.15*sin(2*PI*t*330):s=44100:c=mono",
  fun:       "aevalsrc=0.4*sin(2*PI*t*330)+0.3*sin(2*PI*t*392)+0.2*sin(2*PI*t*494)+0.1*sin(2*PI*t*659):s=44100:c=mono",
  energetic: "aevalsrc=0.4*sin(2*PI*t*440)+0.3*sin(2*PI*t*554)+0.2*sin(2*PI*t*659)+0.1*sin(2*PI*t*880):s=44100:c=mono",
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

async function processImage(
  buf: Buffer,
  schoolName: string,
  caption: string,
  filter: string
): Promise<Buffer> {
  const cfg: FilterCfg = COLOR_FILTERS[filter as FilterKey] ?? {};
  const safeName = schoolName.replace(/[<>&'"]/g, " ");
  const safeCaption = caption.replace(/[<>&'"]/g, " ");

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

export async function POST(req: Request) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "reel-"));

  try {
    const body = await req.json();
    const {
      photoUrls        = [] as string[],
      transition       = "fade",
      durationPerPhoto = 2,
      filter           = "natural",
      music            = "none",
      caption          = "",
      schoolName       = "Evergreen Preschool",
    } = body;

    if (!Array.isArray(photoUrls) || photoUrls.length === 0)
      return NextResponse.json({ error: "photoUrls required" }, { status: 400 });
    if (photoUrls.length > 20)
      return NextResponse.json({ error: "Maximum 20 photos per reel" }, { status: 400 });

    const transName    = TRANSITIONS[transition] || "fade";
    const musicExpr    = MUSIC[music] || "";
    const td           = 0.5;
    const totalDuration = photoUrls.length * durationPerPhoto - (photoUrls.length - 1) * td;

    // ── 1. Download + process images → individual clips ───────────────────────
    for (let i = 0; i < photoUrls.length; i++) {
      const res = await fetch(photoUrls[i]);
      if (!res.ok) throw new Error(`Failed to download photo ${i}: ${res.status}`);
      const raw = Buffer.from(await res.arrayBuffer());
      const processed = await processImage(raw, schoolName, caption, filter);

      const jpgPath  = path.join(tmpDir, `p${i}.jpg`);
      const clipPath = path.join(tmpDir, `c${i}.mp4`);
      await fs.writeFile(jpgPath, processed);

      await ff([
        "-y",
        "-loop", "1", "-i", jpgPath,
        "-t", String(durationPerPhoto),
        "-r", "25",
        "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        clipPath,
      ]);
    }

    // ── 2. Concatenate with xfade ─────────────────────────────────────────────
    const midPath = path.join(tmpDir, "mid.mp4");

    if (photoUrls.length === 1) {
      await fs.rename(path.join(tmpDir, "c0.mp4"), midPath);
    } else {
      const inputs: string[] = [];
      for (let i = 0; i < photoUrls.length; i++)
        inputs.push("-i", path.join(tmpDir, `c${i}.mp4`));

      let fc = "";
      for (let i = 0; i < photoUrls.length - 1; i++) {
        const inA   = i === 0 ? "[0:v]" : `[xf${i - 1}]`;
        const inB   = `[${i + 1}:v]`;
        const offset = (i * (durationPerPhoto - td)).toFixed(2);
        const out   = i === photoUrls.length - 2 ? "[out]" : `[xf${i}]`;
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

    // ── 3. Mix in music ───────────────────────────────────────────────────────
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

    // ── 4. Upload to Supabase Storage ─────────────────────────────────────────
    const videoBytes = await fs.readFile(outPath);
    const key = `reels/${Date.now()}_${randomUUID().slice(0, 8)}.mp4`;

    const { error: uploadErr } = await sb()
      .storage.from("media")
      .upload(key, videoBytes, { contentType: "video/mp4", upsert: true });

    if (uploadErr) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = sb().storage.from("media").getPublicUrl(key);
    return NextResponse.json({ videoUrl: publicUrl, duration: Math.round(totalDuration) });

  } catch (err: any) {
    console.error("Reel generation error:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate reel" }, { status: 500 });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
