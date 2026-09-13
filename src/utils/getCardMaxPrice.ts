import type { Card } from "../types/Card";

export function getCardMaxPrice(card: Card): number {
  const prices = Object.values(card.pricing?.tcgplayer ?? {})
    .map((variant) => variant?.marketPrice)
    .filter((marketPrice): marketPrice is number => marketPrice != null);

  return prices.length ? Math.max(...prices) : -Infinity;
}
