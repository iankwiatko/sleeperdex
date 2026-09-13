import type { Card } from "../types/Card";
import { getCard } from "./getCard";
import { useQuery } from "@tanstack/react-query";

export const CARD_BATCH_SIZE = 20;

export async function getCardDataFromSet(
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

export function useCardQuery(cardIds: string[], effectiveSetId: string) {
  return useQuery({
    queryKey: ["cards", effectiveSetId, cardIds],
    queryFn: () => getCardDataFromSet(cardIds),
    enabled: cardIds.length > 0,
  });
}
