import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const apiKey  = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json({ error: "Missing API keys" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&reviews_sort=newest&key=${apiKey}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      return NextResponse.json({ error: data.status }, { status: 400 });
    }

    const result = data.result;
    return NextResponse.json({
      name:         result.name,
      rating:       result.rating,
      totalReviews: result.user_ratings_total,
      reviews:      (result.reviews || []).map((r: any) => ({
        author:   r.author_name,
        avatar:   r.author_name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase(),
        rating:   r.rating,
        text:     r.text,
        time:     r.relative_time_description,
        photoUrl: r.profile_photo_url,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
