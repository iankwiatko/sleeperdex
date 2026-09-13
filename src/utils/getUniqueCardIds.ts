import type { SetData } from "../types/SetData";

//ensures set data only returns unique cards
export function getUniqueCardIds(setData: SetData | undefined): string[] {
  return [...new Set(setData?.cards?.map((card) => card.id) ?? [])];
}
