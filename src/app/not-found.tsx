import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--warm50)" }}
    >
      <div className="text-center px-4 max-w-md">
        <div className="text-8xl mb-6">🍃</div>
        <h1
          className="text-7xl font-normal mb-3"
          style={{ color: "var(--forest)", fontFamily: "var(--font-display)" }}
        >
          404
        </h1>
        <h2 className="text-2xl font-semibold text-stone-800 mb-4">Page Not Found</h2>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Looks like this page has wandered off to explore the garden. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/contact" className="btn-outline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
