import "./App.css";

import { useMemo, useState } from "react";

import TCGdex from "@tcgdex/sdk";
import { useQuery } from "@tanstack/react-query";

const tcgdex = new TCGdex("en");
const series = "sv";
// Series: swsh, sv, me

async function getSeries() {
  const seriesData = await tcgdex.serie.get(series);
  return seriesData;
}

async function getSet(setId) {
  const setData = await tcgdex.set.get(setId);
  return setData;
}

function getUniqueCardIds(setData) {
  return [...new Set(setData?.cards?.map((card) => card.id) ?? [])];
}

async function getCardDataFromSet(cardIds, batchSize = 20) {
  const cardDetails = [];

  for (let i = 0; i < cardIds.length; i += batchSize) {
    const chunk = cardIds.slice(i, i + batchSize);
    const chunkResults = await Promise.allSettled(
      chunk.map((cardId) => tcgdex.card.get(cardId)),
    );
    for (let j = 0; j < chunkResults.length; j += 1) {
      const outcome = chunkResults[j];
      const cardId = chunk[j];

      if (outcome.status === "fulfilled") {
        cardDetails.push(outcome.value);
      } else {
        console.error(`Card fetch failed for ${cardId}:`, outcome.reason);
      }
    }
  }
  return cardDetails;
}

function App() {
  const [selectedSetId, setSelectedSetId] = useState("");
  const [price, setPrice] = useState("");

  const {
    data: seriesData,
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
  } = useQuery({
    queryKey: ["series", series],
    queryFn: getSeries,
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
    queryKey: ["card", effectiveSetId],
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
      <h2>Choose a Set</h2>
      <select
        value={effectiveSetId}
        onChange={(event) => setSelectedSetId(event.target.value)}
      >
        {seriesData?.sets?.map((serieSet) => (
          <option key={serieSet.id} value={serieSet.id}>
            {serieSet.name} ({serieSet.id})
          </option>
        ))}
      </select>
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
        onChange={(event) => setPrice(event.target.value)}
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
