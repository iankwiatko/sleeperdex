import "./PokeballLoaderStyle.css";

import type { SpinnerPhase } from "./usePokeballLoader";

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
