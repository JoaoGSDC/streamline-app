"use client";

import { useEffect, useState } from "react";
import { services } from "@services";
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
        const json = await services.streamers.featured.findAll();
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
