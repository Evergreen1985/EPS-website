"use client";
import { useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";

interface Review {
  author: string; avatar: string; rating: number;
  text: string; time: string; photoUrl: string;
}
interface Data {
  name: string; rating: number; totalReviews: number;
  placeId: string; googleUrl: string; reviews: Review[];
}

export default function GoogleReviews() {
  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-white rounded-3xl border border-stone-100 p-6 animate-pulse">
          <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(s=><div key={s} className="w-4 h-4 rounded bg-stone-200"/>)}</div>
          <div className="space-y-2 mb-5"><div className="h-3 bg-stone-200 rounded w-full"/><div className="h-3 bg-stone-200 rounded w-4/6"/></div>
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-stone-200"/><div className="h-3 bg-stone-200 rounded w-24"/></div>
        </div>
      ))}
    </div>
  );

  if (!data || !data.reviews) return null;

  const googleUrl = data.googleUrl || `https://www.google.com/search?q=Evergreen+Preschool+Anantha+Nagar+Bengaluru+reviews`;

  return (
    <div>
      {/* Rating summary */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i=>(
            <Star key={i} className="w-6 h-6"
              style={{fill:i<=Math.round(data.rating)?"#F5B829":"transparent",
                      color:i<=Math.round(data.rating)?"#F5B829":"#D1D5DB"}}/>
          ))}
        </div>
        <span className="text-2xl font-bold" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>
          {data.rating.toFixed(1)}
        </span>
        <span className="text-stone-400">·</span>
        <a href={googleUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold hover:underline flex items-center gap-1"
          style={{color:"#4285F4"}}>
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {data.totalReviews} Google reviews
          <ExternalLink className="w-3 h-3"/>
        </a>
      </div>

      {/* Review cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.reviews.map((r,i)=>(
          <div key={i} className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map(s=>(
                <Star key={s} className="w-4 h-4"
                  style={{fill:s<=r.rating?"#F5B829":"transparent",color:s<=r.rating?"#F5B829":"#D1D5DB"}}/>
              ))}
            </div>
            <p className="text-stone-700 text-sm leading-relaxed mb-5 italic line-clamp-4">
              &ldquo;{r.text}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {r.photoUrl
                  ? <img src={r.photoUrl} alt={r.author} className="w-10 h-10 rounded-full object-cover border-2 border-stone-100"/>
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{background:"rgba(232,105,74,0.15)",color:"#E8694A"}}>{r.avatar}</div>
                }
                <div>
                  <p className="font-bold text-sm" style={{color:"#178F78"}}>{r.author}</p>
                  <p className="text-xs text-stone-400">{r.time}</p>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* See all link */}
      <div className="text-center mt-8">
        <a href={googleUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-full border-2 transition-all hover:-translate-y-0.5 text-sm"
          style={{borderColor:"#178F78",color:"#178F78"}}>
          See All {data.totalReviews} Reviews on Google
          <ExternalLink className="w-4 h-4"/>
        </a>
      </div>
    </div>
  );
}
