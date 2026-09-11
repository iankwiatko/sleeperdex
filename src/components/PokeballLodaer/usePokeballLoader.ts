import { useEffect, useRef, useState } from "react";

export type SpinnerPhase = "spinning" | "captured" | "hidden";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function usePokeballLoader(isLoading: boolean): SpinnerPhase {
  const [captured, setCaptured] = useState(false);
  const wasLoadingRef = useRef(isLoading);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = isLoading;

    if (isLoading || !wasLoading || prefersReducedMotion()) return;

    setCaptured(true);
    const timeout = setTimeout(() => setCaptured(false), 950);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  return isLoading ? "spinning" : captured ? "captured" : "hidden";
}
