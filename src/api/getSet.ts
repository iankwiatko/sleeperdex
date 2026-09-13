import type { SetData } from "../types/SetData";
import { TCGDEX_BASE } from "./tcgdexConfig";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { useQuery } from "@tanstack/react-query";

export async function getSet(setId: string): Promise<SetData> {
  const res = await fetchWithTimeout(`${TCGDEX_BASE}/sets/${setId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch set "${setId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<SetData>;
}

export function useSetQuery(effectiveSetId: string) {
  return useQuery({
    queryKey: ["set", effectiveSetId],
    queryFn: () => getSet(effectiveSetId),
    enabled: Boolean(effectiveSetId),
  });
}
