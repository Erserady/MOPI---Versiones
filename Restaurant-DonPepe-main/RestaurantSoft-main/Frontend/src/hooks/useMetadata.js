import { useEffect, useRef, useState } from "react";

const cache = new Map();

export function useMetadata(module) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      const key = module;
      if (cache.has(key)) {
        setData(cache.get(key));
        setLoading(false);
        return;
      }
      try {
        const ts = import.meta.env.DEV ? `?t=${Date.now()}` : "";
        const res = await fetch(`/config/${module}-metadata.json${ts}`);
        if (!res.ok) throw new Error(`No se pudo cargar metadata de ${module}`);
        const json = await res.json();
        cache.set(key, json);
        try {
          window.__META_CACHE = window.__META_CACHE || {};
          window.__META_CACHE[key] = json;
        } catch {}
        if (mounted.current) setData(json);
      } catch (e) {
        if (mounted.current) setError(e);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }
    run();
  }, [module]);

  return { data, loading, error };
}
