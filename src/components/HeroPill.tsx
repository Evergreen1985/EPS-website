"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";

export default function HeroPill() {
  const [rating, setRating] = useState<string>("4.9");
  const [count, setCount]   = useState<string>("123");

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then(d => {
        if (d.rating)       setRating(d.rating.toFixed(1));
        if (d.totalReviews) setCount(d.totalReviews.toString());
      })
      .catch(() => {}); // keep defaults on error
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-secondary font-bold text-sm mb-6 border border-accent/30">
      <Star className="w-4 h-4 text-accent fill-accent" />
      <span>Now Enrolling — {rating}★ on Google ({count}+ reviews)</span>
    </div>
  );
}
