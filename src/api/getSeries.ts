import type { SeriesData } from "../types/SeriesData";
import { TCGDEX_BASE } from "./tcgdexConfig";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { useQuery } from "@tanstack/react-query";

export async function getSeries(seriesId: string): Promise<SeriesData> {
  const res = await fetchWithTimeout(`${TCGDEX_BASE}/series/${seriesId}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch series "${seriesId}": ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<SeriesData>;
}

export function useSeriesQuery(seriesId: string) {
  return useQuery({
    queryKey: ["series", seriesId],
    queryFn: () => getSeries(seriesId),
  });
}
