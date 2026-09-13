import type { Card } from "../types/Card";
import { TCGDEX_BASE } from "./tcgdexConfig";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

export async function getCard(cardId: string): Promise<Card> {
  const res = await fetchWithTimeout(`${TCGDEX_BASE}/cards/${cardId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch card "${cardId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<Card>;
}
