import { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Updates | Evergreen Preschool",
  description: "Latest news, announcements, events and tips from Evergreen Preschool & Daycare, Electronic City Bengaluru.",
};

const CAT_COLOR: Record<string,string> = {
  news: "#4A90D9", announcement: "#E8694A", event: "#178F78", tips: "#9B59B6", milestone: "#F5B829",
};

async function getPosts(category?: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url  = `${base}/api/blog?published=true${category ? `&category=${category}` : ""}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function NewsPage({ searchParams }: { searchParams: { category?: string } }) {
  const category = searchParams.category;
  const posts    = await getPosts(category);

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "'Quicksand',sans-serif", paddingTop: "20px", paddingBottom: "60px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "32px", fontWeight: 700, color: "#1A2F4A" }}>📰 News & Updates</div>
          <div style={{ fontSize: "14px", color: "#6B7A99", marginTop: "6px" }}>Stay informed about what's happening at Evergreen</div>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", justifyContent: "center" }}>
          {[undefined,"news","announcement","event","tips","milestone"].map(cat => (
            <a key={cat || "all"} href={cat ? `/news?category=${cat}` : "/news"}
              style={{
                padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, textDecoration: "none",
                background: (category === cat || (!category && !cat)) ? "#178F78" : "white",
                color:      (category === cat || (!category && !cat)) ? "white"   : "#6B7A99",
                border:     `1px solid ${(category === cat || (!category && !cat)) ? "#178F78" : "#EDE8DF"}`,
              }}>
              {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "All"}
            </a>
          ))}
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px", border: "1px solid #EDE8DF" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📝</div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A2F4A" }}>No posts yet</div>
            <div style={{ fontSize: "13px", color: "#6B7A99", marginTop: "6px" }}>Check back soon for updates!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {posts.map((p: any) => (
              <article key={p.id} style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", overflow: "hidden" }}>
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                )}
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span style={{ background: CAT_COLOR[p.category] + "22", color: CAT_COLOR[p.category], borderRadius: "6px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 }}>
                      {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                    </span>
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
                      {p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
                    </span>
                  </div>
                  <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "#1A2F4A", fontFamily: "'Fredoka',sans-serif" }}>{p.title}</h2>
                  {p.excerpt && <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#6B7A99", lineHeight: 1.6 }}>{p.excerpt}</p>}
                  <div style={{ fontSize: "14px", color: "#1A2F4A", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{p.content}</div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "16px" }}>By {p.author}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
