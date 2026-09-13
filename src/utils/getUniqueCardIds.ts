import type { SetData } from "../types/SetData";

export function getUniqueCardIds(setData: SetData | undefined): string[] {
  return [...new Set(setData?.cards?.map((card) => card.id) ?? [])];
}
