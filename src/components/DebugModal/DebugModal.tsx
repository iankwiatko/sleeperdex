import { type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import "./DebugModalStyle.css";

const TCGDEX_STATUS_MONITOR_GROUPS = [
  [
    { id: "api-na-east", label: "API NA East" },
    { id: "assets-na-east", label: "Assets NA East" },
  ],
  [
    { id: "api-eu-west", label: "API EU West" },
    { id: "assets", label: "Assets EU West" },
  ],
  [{ id: "api-as1", label: "API AS South" }],
];

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
        <hr />
        <div className="debug-status-list">
          {TCGDEX_STATUS_MONITOR_GROUPS.map((group) => (
            <div className="debug-status-group" key={group[0].id}>
              {group.map((monitor) => (
                <a
                  className="debug-status-badge"
                  href={`https://status.tcgdex.dev/?monitor=${monitor.id}`}
                  target="_blank"
                  rel="noreferrer"
                  key={monitor.id}
                >
                  <span>{monitor.label}</span>
                  <img
                    src={`https://status.tcgdex.dev/badge/${monitor.id}/status`}
                    alt={`${monitor.label} status`}
                  />
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
