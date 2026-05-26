import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export const maxDuration = 300;
export const dynamic    = "force-dynamic";

// ── Supabase ──────────────────────────────────────────────────────────────────
function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY         ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// ── FFmpeg singleton (reused across warm invocations) ─────────────────────────
let _ff: FFmpeg | null = null;
let _loading: Promise<void> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ff) return _ff;
  const ff = new FFmpeg();
  if (!_loading) {
    _loading = ff.load({
      coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
      wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
    });
  }
  await _loading;
  _ff = ff;
  return ff;
}

// ── Filter / transition maps ──────────────────────────────────────────────────
const COLOR_FILTERS: Record<string, string> = {
  natural: "",
  warm:    "eq=gamma_r=1.15:gamma_b=0.88:saturation=1.1",
  cool:    "eq=gamma_r=0.88:gamma_b=1.15:saturation=1.0",
  vintage: "eq=gamma=1.2:contrast=0.92:saturation=0.7:brightness=0.02",
  vibrant: "eq=saturation=1.6:contrast=1.1:brightness=0.05",
};

const TRANSITIONS: Record<string, string> = {
  fade:   "fade",
  slide:  "slideleft",
  zoom:   "zoomin",
  bounce: "circlecrop",
};

// Chord-like synthesized music using lavfi aevalsrc (royalty-free)
const MUSIC: Record<string, string> = {
  none:      "",
  upbeat:    "aevalsrc=0.4*sin(2*PI*t*261)+0.3*sin(2*PI*t*330)+0.2*sin(2*PI*t*392)+0.1*sin(2*PI*t*523):s=44100:c=mono",
  calm:      "aevalsrc=0.35*sin(2*PI*t*220)+0.25*sin(2*PI*t*277)+0.15*sin(2*PI*t*330):s=44100:c=mono",
  fun:       "aevalsrc=0.4*sin(2*PI*t*330)+0.3*sin(2*PI*t*392)+0.2*sin(2*PI*t*494)+0.1*sin(2*PI*t*659):s=44100:c=mono",
  energetic: "aevalsrc=0.4*sin(2*PI*t*440)+0.3*sin(2*PI*t*554)+0.2*sin(2*PI*t*659)+0.1*sin(2*PI*t*880):s=44100:c=mono",
};

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const ff = await getFFmpeg().catch(() => null);
  if (!ff) return NextResponse.json({ error: "FFmpeg failed to load" }, { status: 500 });

  try {
    const body = await req.json();
    const {
      photoUrls       = [] as string[],
      transition      = "fade",
      durationPerPhoto = 2,
      filter          = "natural",
      music           = "none",
      caption         = "",
      schoolName      = "Evergreen Preschool",
    } = body;

    if (!Array.isArray(photoUrls) || photoUrls.length === 0)
      return NextResponse.json({ error: "photoUrls required" }, { status: 400 });
    if (photoUrls.length > 20)
      return NextResponse.json({ error: "Maximum 20 photos per reel" }, { status: 400 });

    const colorFilter  = COLOR_FILTERS[filter]    || "";
    const transName    = TRANSITIONS[transition]  || "fade";
    const musicExpr    = MUSIC[music]             || "";
    const td           = 0.5; // transition crossfade duration (s)
    const totalDuration = photoUrls.length * durationPerPhoto - (photoUrls.length - 1) * td;

    // ── 1. Download photos → individual still-image clips ────────────────────
    for (let i = 0; i < photoUrls.length; i++) {
      const raw = await fetchFile(photoUrls[i]);
      await ff.writeFile(`p${i}.jpg`, raw);

      const scaleVf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
      const vf      = colorFilter ? `${scaleVf},${colorFilter}` : scaleVf;

      await ff.exec([
        "-loop", "1", "-i", `p${i}.jpg`,
        "-t", String(durationPerPhoto),
        "-vf", vf,
        "-r", "25",
        "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        `c${i}.mp4`,
      ]);
    }

    // ── 2. Concatenate with xfade + school watermark ─────────────────────────
    const safeName    = schoolName.replace(/[':]/g, " ");
    const safeCaption = caption.replace(/[':]/g, " ");

    const drawSchool  = `drawtext=text='${safeName}':fontsize=38:fontcolor=white@0.9:x=(w-text_w)/2:y=h-58:box=1:boxcolor=black@0.45:boxborderw=10`;
    const drawCaption = safeCaption
      ? `drawtext=text='${safeCaption}':fontsize=28:fontcolor=white:x=(w-text_w)/2:y=h-112:box=1:boxcolor=black@0.4:boxborderw=6`
      : "";
    const textVf = [drawSchool, drawCaption].filter(Boolean).join(",");

    if (photoUrls.length === 1) {
      await ff.exec([
        "-i", "c0.mp4",
        "-vf", textVf,
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
        "mid.mp4",
      ]);
    } else {
      // Build xfade chain: [0][1]xfade...[xf0];[xf0][2]xfade...[xf1];...
      const inputArgs: string[] = [];
      for (let i = 0; i < photoUrls.length; i++) inputArgs.push("-i", `c${i}.mp4`);

      let fc = "";
      for (let i = 0; i < photoUrls.length - 1; i++) {
        const inA   = i === 0 ? "[0:v]" : `[xf${i - 1}]`;
        const inB   = `[${i + 1}:v]`;
        const offset = i * (durationPerPhoto - td);
        const out   = i === photoUrls.length - 2 ? "[xout]" : `[xf${i}]`;
        fc += `${inA}${inB}xfade=transition=${transName}:duration=${td}:offset=${offset.toFixed(2)}${out};`;
      }
      fc += `[xout]${textVf}[out]`;

      await ff.exec([
        ...inputArgs,
        "-filter_complex", fc,
        "-map", "[out]",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
        "mid.mp4",
      ]);
    }

    // ── 3. Mix in music ──────────────────────────────────────────────────────
    if (musicExpr) {
      await ff.exec([
        "-i", "mid.mp4",
        "-f", "lavfi", "-i", musicExpr,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "96k",
        "-t", String(Math.ceil(totalDuration)),
        "-shortest",
        "out.mp4",
      ]);
    } else {
      await ff.exec(["-i", "mid.mp4", "-c", "copy", "out.mp4"]);
    }

    // ── 4. Upload to Supabase Storage ────────────────────────────────────────
    const videoBytes = await ff.readFile("out.mp4");
    const buf        = Buffer.from(videoBytes as Uint8Array);
    const key        = `reels/${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;

    const { error: uploadErr } = await sb()
      .storage
      .from("media")
      .upload(key, buf, { contentType: "video/mp4", upsert: true });

    // Cleanup WASM virtual FS
    const cleanup = async () => {
      for (let i = 0; i < photoUrls.length; i++) {
        for (const f of [`p${i}.jpg`, `c${i}.mp4`]) { try { await ff.deleteFile(f); } catch {} }
      }
      for (const f of ["mid.mp4", "out.mp4"]) { try { await ff.deleteFile(f); } catch {} }
    };
    await cleanup();

    if (uploadErr) {
      console.error("Supabase upload error:", uploadErr.message);
      return NextResponse.json(
        { error: `Upload failed: ${uploadErr.message}. Create a public 'media' bucket in Supabase Storage.` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = sb().storage.from("media").getPublicUrl(key);
    return NextResponse.json({ videoUrl: publicUrl, duration: Math.round(totalDuration) });

  } catch (err: any) {
    console.error("Reel generation error:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate reel" }, { status: 500 });
  }
}
