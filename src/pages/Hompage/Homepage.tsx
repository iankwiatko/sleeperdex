import "./Homepage.css";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Moon, Sun } from "lucide-react";

import { DebugModal } from "../../components/DebugModal/DebugModal";
import { PokeballLoader } from "../../components/PokeballLodaer/PokeballLoader";
import { usePokeballLoader } from "../../components/PokeballLodaer/usePokeballLoader";
import { useCardQuery } from "../../api/getCardDataFromSet";
import { useSeriesQuery } from "../../api/getSeries";
import { useSetQuery } from "../../api/getSet";
import type { SortOrder } from "../../types/SortOrder";
import { getCardImageUrl } from "../../utils/getCardImageUrl";
import { getCardMaxPrice } from "../../utils/getCardMaxPrice";
import { getNumberedSets } from "../../utils/getNumberedSets";
import { getUniqueCardIds } from "../../utils/getUniqueCardIds";

const PRICE_FILTER_DEBOUNCE_MS = 500;
const SERIES_OPTIONS = ["me", "sv", "swsh"];
const THEME_STORAGE_KEY = "sleeperdex-theme";
type Theme = "light" | "dark";
const SERIES_LABELS: Record<string, string> = {
  me: "Mega Evolution",
  sv: "Scarlet & Violet",
  swsh: "Sword & Shield",
};
const ALLOWED_RARITIES = [
  "common",
  "uncommon",
  "rare",
  "double rare",
  "holo rare",
  "holo rare v",
];

function Homepage() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [seriesId, setSeriesId] = useState(SERIES_OPTIONS[0]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [price, setPrice] = useState("");
  const [appliedPrice, setAppliedPrice] = useState("");
  const [rarityFilterDisabled, setRarityFilterDisabled] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const {
    data: seriesData,
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
  } = useSeriesQuery(seriesId);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAppliedPrice(price);
    }, PRICE_FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [price]);

  const numberedSets = useMemo(() => getNumberedSets(seriesData), [seriesData]);

  const latestSetId = numberedSets[numberedSets.length - 1]?.id ?? "";
  const effectiveSetId = selectedSetId || latestSetId;

  const {
    data: setData,
    isLoading: setIsLoading,
    isError: setIsError,
    error: setError,
  } = useSetQuery(effectiveSetId);

  const cardIds = useMemo(() => getUniqueCardIds(setData), [setData]);

  const {
    data: cardData,
    isLoading: cardIsLoading,
    isError: cardIsError,
    error: cardError,
  } = useCardQuery(cardIds, effectiveSetId);

  const minPrice = appliedPrice ? Number(appliedPrice) : undefined;

  const isLoadingResults =
    isSeriesLoading ||
    setIsLoading ||
    cardIsLoading ||
    (cardIds.length > 0 && cardData == null);

  const spinnerPhase = usePokeballLoader(isLoadingResults);

  const rarityFilteredCardData = useMemo(() => {
    if (rarityFilterDisabled) return cardData;
    return cardData?.filter((card) =>
      ALLOWED_RARITIES.includes(card.rarity?.toLowerCase() ?? ""),
    );
  }, [cardData, rarityFilterDisabled]);

  const priceFilteredCardData = useMemo(() => {
    if (minPrice == null || Number.isNaN(minPrice))
      return rarityFilteredCardData;
    return rarityFilteredCardData?.filter((card) =>
      Object.values(card.pricing?.tcgplayer ?? {}).some(
        (variant) =>
          variant?.marketPrice != null && variant.marketPrice >= minPrice,
      ),
    );
  }, [rarityFilteredCardData, minPrice]);

  const sortedCardData = useMemo(() => {
    const sorted = [...(priceFilteredCardData ?? [])];
    sorted.sort((a, b) =>
      sortOrder === "asc"
        ? getCardMaxPrice(a) - getCardMaxPrice(b)
        : getCardMaxPrice(b) - getCardMaxPrice(a),
    );
    return sorted;
  }, [priceFilteredCardData, sortOrder]);

  return (
    <>
      <button
        type="button"
        className="theme-toggle"
        onClick={() =>
          setTheme((currentTheme) =>
            currentTheme === "dark" ? "light" : "dark",
          )
        }
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {import.meta.env.DEV && (
        <>
          <div
            style={{
              position: "fixed",
              top: "1rem",
              right: "1rem",
            }}
          >
            <button type="button" onClick={() => setIsDebugOpen(true)}>
              Debug
            </button>
          </div>

          <DebugModal
            isOpen={isDebugOpen}
            onClose={() => setIsDebugOpen(false)}
            isSeriesLoading={isSeriesLoading}
            setIsLoading={setIsLoading}
            cardIsLoading={cardIsLoading}
            cardCount={cardData?.length ?? 0}
            rarityFilterDisabled={rarityFilterDisabled}
            onToggleRarityFilter={setRarityFilterDisabled}
          />
        </>
      )}

      <header className="app-header">
        <img src="/sleeperdex.png" alt="" className="app-logo" />
        <div className="app-heading">
          <h1>sleeperdex</h1>
          <p className="app-tagline">
            find sleeper value in <strong>your</strong> bulk
          </p>
        </div>
      </header>

      <div className="controls-bar">
        <div className="control-group">
          <label htmlFor="series-select">Series</label>
          <select
            id="series-select"
            value={seriesId}
            disabled={isSeriesLoading}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              setSeriesId(event.target.value);
              setSelectedSetId("");
            }}
          >
            {SERIES_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SERIES_LABELS[option] ?? option} ({option})
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="set-select">Set</label>
          <select
            id="set-select"
            value={effectiveSetId}
            disabled={isSeriesLoading || !numberedSets.length}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedSetId(event.target.value)
            }
          >
            {numberedSets.map((serieSet) => (
              <option key={serieSet.id} value={serieSet.id}>
                {serieSet.name} ({serieSet.id})
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="price-input">Minimum Market Price</label>
          <input
            id="price-input"
            type="number"
            min="0"
            placeholder="0.00"
            step="0.01"
            value={price}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setPrice(event.target.value)
            }
          />
        </div>
        <div className="control-group">
          <label htmlFor="sort-order">Sort by</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSortOrder(event.target.value as SortOrder)
            }
          >
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {isSeriesError && (
        <p role="alert">Failed to load series: {seriesError.message}</p>
      )}
      {!isSeriesError && setIsError && (
        <p role="alert">Failed to load set: {setError.message}</p>
      )}
      {!isSeriesError && !setIsError && cardIsError && (
        <p role="alert">Failed to load cards: {cardError.message}</p>
      )}

      {!isSeriesError && !setIsError && !cardIsError && (
        <>
          <PokeballLoader phase={spinnerPhase} />
          {spinnerPhase === "hidden" && sortedCardData?.length === 0 && (
            <p>No cards match the current filters.</p>
          )}

          {spinnerPhase === "hidden" && (
            <ul
              className="card-results"
              key={`${effectiveSetId}-${sortOrder}-${appliedPrice}-${rarityFilterDisabled}`}
            >
              {sortedCardData?.map((card, index) => {
                const imageUrl = getCardImageUrl(card);
                return (
                  <li
                    key={card.id}
                    className="card-result"
                    style={{ animationDelay: `${Math.min(index, 20) * 35}ms` }}
                  >
                    {imageUrl && (
                      <img
                        className="card-result-image"
                        src={imageUrl}
                        alt={card.name}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="card-result-header">
                      <strong>{card.name}</strong>
                    </div>
                    <div className="card-result-meta">
                      <em className="card-result-rarity">{card.rarity}</em>
                      <span>
                        {card.localId}/{card.set?.cardCount?.official}
                      </span>
                    </div>
                    <div className="card-result-prices">
                      {Object.entries(card.pricing?.tcgplayer ?? {})
                        .filter(
                          ([, variant]) =>
                            variant?.marketPrice != null &&
                            (minPrice == null ||
                              Number.isNaN(minPrice) ||
                              variant.marketPrice >= minPrice),
                        )
                        .map(([variantName, variant]) => (
                          <div key={variantName} className="card-result-price">
                            <span>{variantName}</span>
                            <strong>${variant.marketPrice}</strong>
                          </div>
                        ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

export default Homepage;
