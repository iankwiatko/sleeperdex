import "./App.css";

import { useMemo, useState, type ChangeEvent } from "react";

import { useQuery } from "@tanstack/react-query";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";
const CARD_BATCH_SIZE = 20;
const SERIES_OPTIONS = ["sv", "me", "swsh"];

type SeriesData = {
  sets?: Array<{ id: string; name: string }>;
};

type SetData = {
  name?: string;
  cards?: Array<{ id: string }>;
};

type Card = {
  id: string;
  name: string;
  rarity?: string;
  pricing?: {
    tcgplayer?: Record<string, { marketPrice?: number | null }>;
  };
};

async function getSeries(seriesId: string): Promise<SeriesData> {
  const res = await fetch(`${TCGDEX_BASE}/series/${seriesId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch series "${seriesId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<SeriesData>;
}

async function getSet(setId: string): Promise<SetData> {
  const res = await fetch(`${TCGDEX_BASE}/sets/${setId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch set "${setId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<SetData>;
}

async function getCard(cardId: string): Promise<Card> {
  const res = await fetch(`${TCGDEX_BASE}/cards/${cardId}`);
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

  const {
    data: seriesData,
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
  } = useQuery({
    queryKey: ["series", seriesId],
    queryFn: () => getSeries(seriesId),
  });

  const effectiveSetId = selectedSetId || seriesData?.sets?.[0]?.id || "";

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

  if (isSeriesLoading) return <p>Loading series...</p>;
  if (isSeriesError) return <p>Failed to load series: {seriesError.message}</p>;
  if (setIsLoading) return <p>Loading set...</p>;
  if (setIsError) return <p>Failed to load set: {setError.message}</p>;
  if (cardIsLoading) return <p>Loading cards...</p>;
  if (cardIsError) return <p>Failed to load cards: {cardError.message}</p>;

  return (
    <>
      <h1>sleeperdex</h1>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h2>Choose a Series</h2>
          <select
            value={seriesId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              setSeriesId(event.target.value);
              setSelectedSetId("");
            }}
          >
            {SERIES_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h2>Choose a Set</h2>
          <select
            value={effectiveSetId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedSetId(event.target.value)
            }
          >
            {seriesData?.sets?.map((serieSet) => (
              <option key={serieSet.id} value={serieSet.id}>
                {serieSet.name} ({serieSet.id})
              </option>
            ))}
          </select>
        </div>
      </div>
      <h2>Results</h2>
      <p>{setData?.name}</p>
      <p>Loaded {cardData?.length ?? 0} full card records.</p>
      <hr />
      <h2>Set Price Filter</h2>
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

      <ul>
        {cardData?.map((card) => (
          <li key={card.id}>
            <strong>{card.name}</strong>
            {Object.entries(card.pricing?.tcgplayer ?? {})
              .filter(([, variant]) => variant?.marketPrice != null)
              .map(([variantName, variant]) => (
                <div key={variantName}>
                  {variantName}: ${variant.marketPrice}
                </div>
              ))}
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
