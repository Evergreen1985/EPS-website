"use client";
import { useState, useEffect } from "react";
import { Headphones, Clock, Calendar } from "lucide-react";

interface AudioOverview {
  id: string;
  title: string;
  audio_url: string;
  status: string;
  duration_seconds: number;
  created_at: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  return `${mins} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return diffMs < 7 * 24 * 60 * 60 * 1000;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        borderLeft: "4px solid #e0d6f7",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        animation: "audioPulse 1.5s ease-in-out infinite",
      }}
    >
      <div style={{ height: "16px", background: "#f0f2f7", borderRadius: "8px", width: "65%" }} />
      <div style={{ height: "12px", background: "#f0f2f7", borderRadius: "8px", width: "40%" }} />
      <div style={{ height: "36px", background: "#f0f2f7", borderRadius: "8px", width: "100%" }} />
      <style>{`
        @keyframes audioPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        gap: "14px",
        color: "#8a96b0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ede8fd, #d5f0eb)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Headphones size={30} color="#8957E5" />
      </div>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "17px", color: "#1A2F4A", fontWeight: 600 }}>
        No audio overviews yet
      </div>
      <div style={{ fontSize: "13px", color: "#8a96b0", maxWidth: "260px", lineHeight: 1.5 }}>
        No audio overviews available yet. Check back soon!
      </div>
    </div>
  );
}

export default function AudioPlayer() {
  const [overviews, setOverviews] = useState<AudioOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/audio/overviews")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: AudioOverview[]) => {
        const ready = Array.isArray(data)
          ? data.filter((item) => item.status === "ready")
          : [];
        // Sort newest first
        ready.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOverviews(ready);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Quicksand', 'Fredoka', sans-serif",
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #8957E5 0%, #178F78 100%)",
          borderRadius: "16px 16px 0 0",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            flexShrink: 0,
          }}
        >
          🎧
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            Audio Overviews
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }}>
            Podcast-style school updates &amp; newsletters
          </div>
        </div>
        {!loading && overviews.length > 0 && (
          <div
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "12px",
              color: "#ffffff",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {overviews.length} episode{overviews.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          background: "#f7f9fc",
          border: "1px solid #e8edf5",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          minHeight: "160px",
        }}
      >
        {/* Loading skeletons */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "40px 20px",
              gap: "10px",
              color: "#E8694A",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600 }}>
              Could not load audio overviews.
            </div>
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                fetch("/api/audio/overviews")
                  .then((r) => r.json())
                  .then((data: AudioOverview[]) => {
                    const ready = Array.isArray(data)
                      ? data.filter((item) => item.status === "ready")
                      : [];
                    ready.sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    );
                    setOverviews(ready);
                  })
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
              style={{
                border: "1.5px solid #E8694A",
                borderRadius: "10px",
                background: "#fff5f2",
                color: "#E8694A",
                fontSize: "13px",
                fontWeight: 600,
                padding: "7px 18px",
                cursor: "pointer",
                fontFamily: "'Quicksand', sans-serif",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && overviews.length === 0 && <EmptyState />}

        {/* Audio cards */}
        {!loading &&
          !error &&
          overviews.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                borderLeft: "4px solid #8957E5",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 4px 18px rgba(137,87,229,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)")
              }
            >
              {/* Card top row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #ede8fd, #d5f0eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Headphones size={18} color="#8957E5" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1A2F4A",
                        lineHeight: 1.25,
                      }}
                    >
                      {item.title}
                    </span>
                    {isNew(item.created_at) && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          background: "linear-gradient(90deg, #F5B829, #E8694A)",
                          color: "#ffffff",
                          borderRadius: "20px",
                          padding: "2px 9px",
                          letterSpacing: "0.5px",
                          flexShrink: 0,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "14px",
                      marginTop: "5px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "#8a96b0",
                      }}
                    >
                      <Calendar size={12} />
                      {formatDate(item.created_at)}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "#8957E5",
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={12} />
                      {formatDuration(item.duration_seconds)} listen
                    </span>
                  </div>
                </div>
              </div>

              {/* Audio element */}
              <audio
                controls
                src={item.audio_url}
                preload="none"
                style={{
                  width: "100%",
                  height: "36px",
                  borderRadius: "8px",
                  outline: "none",
                  accentColor: "#8957E5",
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
