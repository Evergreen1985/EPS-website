import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse photos from Evergreen Preschool classrooms, outdoor play, arts, STEM activities and school events in Electronic City, Bengaluru.",
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
