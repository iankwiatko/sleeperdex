import { type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import "./DebugModalStyle.css";

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSeriesLoading: boolean;
  setIsLoading: boolean;
  cardIsLoading: boolean;
  cardCount: number;
  rarityFilterDisabled: boolean;
  onToggleRarityFilter: (disabled: boolean) => void;
}

export function DebugModal({
  isOpen,
  onClose,
  isSeriesLoading,
  setIsLoading,
  cardIsLoading,
  cardCount,
  rarityFilterDisabled,
  onToggleRarityFilter,
}: DebugModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="debug-modal-backdrop" onClick={onClose}>
      <div
        className="debug-modal-content"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="debug-modal-header">
          <h2>debug</h2>
          <button type="button" className="debug-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        {isSeriesLoading || setIsLoading ? (
          <p>Loading set...</p>
        ) : (
          <p>
            {cardIsLoading
              ? "Loading cards..."
              : `Loaded ${cardCount} total cards from set.`}
          </p>
        )}
        <div className="debug-modal-row">
          <label htmlFor="rarity-filter-toggle">disable rarity filter</label>
          <input
            id="rarity-filter-toggle"
            type="checkbox"
            checked={rarityFilterDisabled}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onToggleRarityFilter(event.target.checked)
            }
          />
        </div>
        <a
          className="debug-status-badge"
          href="https://status.tcgdex.dev/?monitor=api-na-east"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://status.tcgdex.dev/badge/api-na-east/status"
            alt="TCGdex API North America East status"
          />
        </a>
      </div>
    </div>,
    document.body,
  );
}
