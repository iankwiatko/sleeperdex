export type Card = {
  id: string;
  localId: string;
  name: string;
  rarity?: string;
  image?: string;
  set?: {
    cardCount?: {
      official?: number;
    };
  };
  pricing?: {
    tcgplayer?: Record<string, { marketPrice?: number | null }>;
  };
};
