import type { Card } from "../types/Card";

export function getCardImageUrl(card: Card): string | undefined {
  return card.image ? `${card.image}/low.webp` : undefined;
}
