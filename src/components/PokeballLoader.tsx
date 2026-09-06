import "./PokeballLoaderStyle.css";

import { useEffect, useRef, useState } from "react";

export type SpinnerPhase = "spinning" | "captured" | "hidden";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

// Tracks the loading -> "captured" wiggle -> hidden lifecycle of the loader.
export function useSpinnerPhase(isLoading: boolean): SpinnerPhase {
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

type PokeballLoaderProps = {
  phase: SpinnerPhase;
};

export function PokeballLoader({ phase }: PokeballLoaderProps) {
  if (phase === "hidden") return null;

  return (
    <div
      className={`pokeball-loader${phase === "captured" ? " is-captured" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="pokeball-stage">
        <span className="pokeball">
          <span className="pokeball-band" />
          <span className="pokeball-button" />
        </span>
        <span className="sparkle" />
        <span className="sparkle" />
        <span className="sparkle" />
        <span className="sparkle" />
      </span>
      <span className="visually-hidden">Loading cards…</span>
    </div>
  );
}
