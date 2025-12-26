
export interface Artwork {
  url: string;
  title: string;
  year: string;
  media: string;
}

export interface Artist {
  id: string;
  name: {
    cn: string;
    en: string;
  };
  intro: {
    cn: string;
    en: string;
  };
  artworks: Artwork[];
  offlineImage?: string; // Base64 string for offline viewing
  style: string[];
  media: string[];
  links: { label: string; url: string }[];
  visualElements: string[];
  culturalBackground: {
    cn: string;
    en: string;
  };
  techniques: {
    cn: string;
    en: string;
  };
}

export interface CollectionItem {
  id: string;
  artistId: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export enum View {
  SEARCH = 'search',
  COMPARISON = 'comparison',
  COLLECTION_LIST = 'collection_list'
}
