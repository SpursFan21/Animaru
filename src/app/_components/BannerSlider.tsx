//src/app/_components/BannerSlider.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  banner_path: string; // path inside the `banners` bucket
};

function bannerUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("banners").getPublicUrl(path).data.publicUrl;
}

export default function BannerSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // You can pull these from `anime` as well; here we expect a banner_path to exist.
      const { data, error } = await supabase
        .from("anime")
        .select("id, slug, title, synopsis, banner_path")
        .not("banner_path", "is", null)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (!mounted) return;
      if (error) {
        setSlides([]);
        return;
      }

      const mapped: Slide[] =
        (data ?? []).map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          tagline: r.synopsis ?? "",
          banner_path: r.banner_path as string,
        })) ?? [];

      setSlides(mapped);
      setIdx(0);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  // autoplay
  useEffect(() => {
    if (slides.length <= 1) return;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [slides.length]);

  const current = slides[idx];
  const bg = bannerUrl(current?.banner_path);

  const go = (next: number) => {
    if (slides.length === 0) return;
    setIdx((next + slides.length) % slides.length);
  };

  return (
    <div
      className="
        relative
        min-h-[42vh] sm:min-h-[50vh] lg:min-h-[56vh]
        max-h-[680px]
        bg-blue-900
      "
    >
      {/* background image */}
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bg}
          alt={current?.title ?? "Banner"}
          className="
            absolute inset-0 h-full w-full object-cover
            object-[center_right]
          "
          loading="eager"
        />
      )}

      {/* left gradient overlay for readability */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-r
          from-blue-950/95 via-blue-950/75 to-transparent
        "
      />

      {/* content container aligned with site width */}
      <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
        <div className="w-full max-w-2xl pr-6">
          <div className="text-xs uppercase tracking-wider text-slate-300/80 mb-2">
            #1 Spotlight
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-3 drop-shadow">
            {current?.title ?? ""}
          </h2>
          {current?.tagline && (
            <p className="text-slate-200/90 max-w-xl mb-6 line-clamp-3">
              {current.tagline}
            </p>
          )}

          <div className="flex gap-3">
            <Link
              href={`/anime/${current?.slug ?? ""}`}
              className="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium"
            >
              Watch Now
            </Link>
            <Link
              href={`/anime/${current?.slug ?? ""}`}
              className="px-5 py-2.5 rounded-md border border-slate-600 hover:border-sky-500 text-slate-100"
            >
              Details
            </Link>
          </div>
        </div>
      </div>

      {/* arrows */}
      <button
        aria-label="Previous"
        onClick={() => go(idx - 1)}
        className="
          absolute left-3 sm:left-6 top-1/2 -translate-y-1/2
          grid place-items-center h-10 w-10 rounded-full
          bg-blue-950/60 hover:bg-blue-950/80
          border border-blue-800/70
          text-slate-100
        "
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Next"
        onClick={() => go(idx + 1)}
        className="
          absolute right-3 sm:right-6 top-1/2 -translate-y-1/2
          grid place-items-center h-10 w-10 rounded-full
          bg-blue-950/60 hover:bg-blue-950/80
          border border-blue-800/70
          text-slate-100
        "
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={[
              "h-2.5 w-2.5 rounded-full transition",
              i === idx ? "bg-sky-400" : "bg-slate-400/60 hover:bg-slate-300/90",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
