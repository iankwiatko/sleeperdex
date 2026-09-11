import "./App.css";

import { useMemo, useState, type ChangeEvent } from "react";

import { useQuery } from "@tanstack/react-query";
import { fetchWithTimeout } from "./utils/fetchWithTimeout";
import { DebugModal } from "./components/DebugModal/DebugModal";
import { PokeballLoader } from "./components/PokeballLodaer/PokeballLoader";
import { usePokeballLoader } from "./components/PokeballLodaer/usePokeballLoader";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";
const CARD_BATCH_SIZE = 20;
const SERIES_OPTIONS = ["me", "sv", "swsh"];
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

type SeriesData = {
  sets?: Array<{ id: string; name: string }>;
};

type SetData = {
  name?: string;
  cards?: Array<{ id: string }>;
};

type Card = {
  id: string;
  localId: string;
  name: string;
  rarity?: string;
  image?: string;
  set?: {
    cardCount?: {
      official?: number;
    };
  };
  pricing?: {
    tcgplayer?: Record<string, { marketPrice?: number | null }>;
  };
};

function getCardImageUrl(card: Card): string | undefined {
  return card.image ? `${card.image}/low.webp` : undefined;
}

type SortOrder = "asc" | "desc";

async function getSeries(seriesId: string): Promise<SeriesData> {
  const res = await fetchWithTimeout(`${TCGDEX_BASE}/series/${seriesId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch series "${seriesId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<SeriesData>;
}

async function getSet(setId: string): Promise<SetData> {
  const res = await fetchWithTimeout(`${TCGDEX_BASE}/sets/${setId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch set "${setId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<SetData>;
}

async function getCard(cardId: string): Promise<Card> {
  const res = await fetchWithTimeout(`${TCGDEX_BASE}/cards/${cardId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch card "${cardId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<Card>;
}

function getUniqueCardIds(setData: SetData | undefined): string[] {
  return [...new Set(setData?.cards?.map((card) => card.id) ?? [])];
}

function getCardMaxPrice(card: Card): number {
  const prices = Object.values(card.pricing?.tcgplayer ?? {})
    .map((variant) => variant?.marketPrice)
    .filter((marketPrice): marketPrice is number => marketPrice != null);
  return prices.length ? Math.max(...prices) : -Infinity;
}

const NUMBERED_SET_ID_PATTERN = /^[a-z]+\d+(\.\d+[a-z]?)?$/i;

function getNumberedSets(
  seriesData: SeriesData | undefined,
): Array<{ id: string; name: string }> {
  return (
    seriesData?.sets?.filter((set) => NUMBERED_SET_ID_PATTERN.test(set.id)) ??
    []
  );
}

async function getCardDataFromSet(
  cardIds: string[],
  batchSize = CARD_BATCH_SIZE,
): Promise<Card[]> {
  const cardDetails: Card[] = [];

  for (let i = 0; i < cardIds.length; i += batchSize) {
    const chunk = cardIds.slice(i, i + batchSize);
    const chunkResults = await Promise.allSettled(
      chunk.map((cardId) => getCard(cardId)),
    );
    for (const [index, outcome] of chunkResults.entries()) {
      const cardId = chunk[index];

      if (outcome.status === "fulfilled") {
        cardDetails.push(outcome.value);
      } else {
        console.error(`Card fetch failed for ${cardId}:`, outcome.reason);
      }
    }
  }
  return cardDetails;
}

//---------------------------------------------------------------------------------
// Main App Component
//---------------------------------------------------------------------------------

function App() {
  const [seriesId, setSeriesId] = useState(SERIES_OPTIONS[0]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [price, setPrice] = useState("");
  const [appliedPrice, setAppliedPrice] = useState("");
  const [rarityFilterDisabled, setRarityFilterDisabled] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const {
    data: seriesData,
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
  } = useQuery({
    queryKey: ["series", seriesId],
    queryFn: () => getSeries(seriesId),
  });

  const numberedSets = useMemo(() => getNumberedSets(seriesData), [seriesData]);

  const effectiveSetId = selectedSetId || numberedSets[0]?.id || "";

  const {
    data: setData,
    isLoading: setIsLoading,
    isError: setIsError,
    error: setError,
  } = useQuery({
    queryKey: ["set", effectiveSetId],
    queryFn: () => getSet(effectiveSetId),
    enabled: Boolean(effectiveSetId),
  });

  const cardIds = useMemo(() => getUniqueCardIds(setData), [setData]);

  const {
    data: cardData,
    isLoading: cardIsLoading,
    isError: cardIsError,
    error: cardError,
  } = useQuery({
    queryKey: ["cards", effectiveSetId, cardIds],
    queryFn: () => getCardDataFromSet(cardIds),
    enabled: cardIds.length > 0,
  });

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
            find value in <strong>your</strong> bulk
          </p>
        </div>
      </header>

      <form
        className="controls-bar"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedPrice(price);
        }}
      >
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
          <label htmlFor="price-input">Min Price</label>
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
          <label htmlFor="sort-order">Sort by Price</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSortOrder(event.target.value as SortOrder)
            }
          >
            <option value="asc">Low to High</option>
            <option value="desc">High to Low</option>
          </select>
        </div>
        <button type="submit" className="filter-button">
          Filter
        </button>
      </form>

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
            <ul className="card-results">
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

export default App;
