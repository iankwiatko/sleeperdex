import type { Card } from "../types/Card";

//creates url for low res image of card
export function getCardImageUrl(card: Card): string | undefined {
  return card.image ? `${card.image}/low.webp` : undefined;
}
