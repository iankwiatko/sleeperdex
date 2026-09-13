import type { SeriesData } from "../types/SeriesData";

const NUMBERED_SET_ID_PATTERN = /^[a-z]+\d{1,3}(\.\d+[a-z]?)?$/i;
//ensures only numbered sets are returned, no special sets
export function getNumberedSets(
  seriesData: SeriesData | undefined,
): Array<{ id: string; name: string }> {
  return (
    seriesData?.sets?.filter((set) => NUMBERED_SET_ID_PATTERN.test(set.id)) ??
    []
  );
}
