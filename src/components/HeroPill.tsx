"use client";
import { useEffect, useState } from "react";

export default function HeroPill() {
  const [rating, setRating] = useState("4.9");
  const [count, setCount]   = useState("160");

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then(d => {
        if (d.rating)       setRating(d.rating.toFixed(1));
        if (d.totalReviews) setCount(d.totalReviews.toString());
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:"6px",
      background:"rgba(245,184,41,0.2)", border:"1px solid rgba(245,184,41,0.4)",
      borderRadius:"20px", padding:"4px 14px", marginBottom:"10px",
      fontFamily:"'Quicksand',sans-serif", fontSize:"12px", fontWeight:700, color:"#178F78"
    }}>
      ⭐ Now Enrolling — {rating}★ on Google ({count}+ reviews)
    </div>
  );
}
