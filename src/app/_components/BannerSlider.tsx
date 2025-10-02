// src/app/_components/BannerSlider.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  banner_path: string | null;
};

type AnimeRow = {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  banner_path: string | null;
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
      const { data, error } = await supabase
        .from("anime")
        .select("id, slug, title, synopsis, banner_path, updated_at")
        .not("banner_path", "is", null)
        .order("updated_at", { ascending: false })
        .limit(5)
        .returns<AnimeRow[]>();

      if (!mounted) return;
      if (error || !data) {
        setSlides([]);
        return;
      }

      const mapped: Slide[] = data.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        tagline: r.synopsis ?? "",
        banner_path: r.banner_path,
      }));

      setSlides(mapped);
      setIdx(0);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setIdx((i) => (i + 1) % slides.length),
      6000
    );
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
      {/* Background + overlay (30% solid, 20% fade, right 50% clear) */}
      {bg && (
        <>
          <img
            src={bg}
            alt={current?.title ?? "Banner"}
            className="absolute inset-0 h-full w-full object-cover object-[center_right]"
            loading="eager"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(30,58,138,1) 0%, rgba(30,58,138,1) 30%, rgba(30,58,138,0) 50%, rgba(30,58,138,0) 100%)",
            }}
          />
        </>
      )}

      {/* Content: full-width container so we can hug the left overlay.
          The text block is sized to live entirely inside that left 30% + a bit of the fade. */}
      <div className="relative h-full flex items-center">
        <div
          className="
            /* nudge from the very edge so it feels intentional */
            ml-4 sm:ml-6 md:ml-10 lg:ml-14 xl:ml-50
            my-4 sm:my-6 md:my-10 lg:my-14 xl:my-50
            /* take up the left zone */
            w-[85%] sm:w-[72%] md:w-[60%] lg:w-[52%] xl:w-[45%]
            max-w-[780px]
            pr-6
          "
        >
          <div className="mb-2 text-[10px] sm:text-xs uppercase tracking-wider text-slate-300/90">
            #1 Spotlight
          </div>

          <h2
            className="
              font-extrabold
              text-4xl sm:text-5xl md:text-6xl lg:text-7xl
              leading-[1.05]
              drop-shadow
              mb-4 sm:mb-5
            "
          >
            {current?.title ?? ""}
          </h2>

          {current?.tagline && (
            <p
              className="
                text-slate-200/95
                text-sm sm:text-base md:text-lg
                leading-relaxed
                max-w-none
                mb-6 md:mb-8
                line-clamp-3 md:line-clamp-4
              "
            >
              {current.tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/anime/${current?.slug ?? ""}`}
              className="
                px-4 sm:px-5 md:px-6
                py-2 sm:py-2.5 md:py-3
                rounded-md
                bg-sky-600 hover:bg-sky-500
                text-white font-semibold
                text-sm sm:text-base
              "
            >
              Watch Now
            </Link>
            <Link
              href={`/anime/${current?.slug ?? ""}`}
              className="
                px-4 sm:px-5 md:px-6
                py-2 sm:py-2.5 md:py-3
                rounded-md
                border border-slate-600 hover:border-sky-500
                text-slate-100 font-medium
                text-sm sm:text-base
              "
            >
              Details
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
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

      {/* Dots */}
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
