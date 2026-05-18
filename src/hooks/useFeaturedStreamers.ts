"use client";

import { useEffect, useState } from "react";
import type { FeaturedStreamersResponse } from "@/types/landing";

export function useFeaturedStreamers() {
  const [data, setData] = useState<FeaturedStreamersResponse>({
    partners: [],
    premium: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/streamers/public/featured", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("fetch failed");
        const json = (await res.json()) as FeaturedStreamersResponse;
        if (!cancelled) {
          setData({
            partners: Array.isArray(json.partners) ? json.partners : [],
            premium: Array.isArray(json.premium) ? json.premium : [],
          });
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading, error };
}
