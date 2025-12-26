
/**
 * Google Custom Search API Service
 * Handles real-time image and web results fetching
 */

import { Artwork } from '../types';

const GOOGLE_API_KEY = 'AIzaSyDhUXUYkQB3BdNCNrnRAC-kt636hYcwiOc'; 
const GOOGLE_CX_ID = 'b0ef202adaed0406e';

export interface SearchResult {
  id: string;
  name: { cn: string; en: string };
  intro: { cn: string; en: string };
  artworks: Artwork[];
  links: { label: string; url: string }[];
  tags: string[];
  snippet: string;
}

/**
 * Creates a stable slug-based ID from a string
 */
const slugify = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

export const performRealSearch = async (query: string): Promise<SearchResult | null> => {
  if (!query || query.length < 2) return null;

  try {
    const stableId = `art-${slugify(query)}`;

    // 1. Search Images (Top 3 artworks)
    const imageQuery = encodeURIComponent(query + " artworks painting");
    const imageRes = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX_ID}&q=${imageQuery}&searchType=image&num=3`
    );
    const imageData = await imageRes.json();

    // 2. Search Web Snippets (Biography/Sources)
    const webQuery = encodeURIComponent(query + " artist biography official website museum");
    const webRes = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX_ID}&q=${webQuery}&num=4`
    );
    const webData = await webRes.json();

    if (imageData.error || webData.error) {
      console.error("Google API Error:", imageData.error || webData.error);
      return null;
    }

    // Extract images with basic metadata
    const artworks: Artwork[] = imageData.items ? imageData.items.map((item: any) => ({
      url: item.link,
      title: item.title || "Untitled",
      year: (item.title.match(/\b(1\d{3}|20\d{2})\b/) || [])[0] || "Unknown Year",
      media: "Visual Art" // Default, will be enriched by AI
    })) : [];

    while (artworks.length < 3) {
      artworks.push({
        url: `https://picsum.photos/seed/${query}${artworks.length}/600/400`,
        title: "Work in Progress",
        year: "2024",
        media: "Mixed Media"
      });
    }

    // Extract web info and links
    let snippet = "No biography found.";
    const links: { label: string; url: string }[] = [];

    if (webData.items && webData.items.length > 0) {
      snippet = webData.items[0].snippet;
      
      webData.items.forEach((item: any) => {
        const url = item.link;
        const hostname = new URL(url).hostname.replace('www.', '').toUpperCase();
        
        if (!links.some(l => l.url === url) && links.length < 3) {
          links.push({
            label: hostname,
            url: url
          });
        }
      });
    }

    if (links.length === 0) {
      links.push({ label: 'GOOGLE SEARCH', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` });
    }

    return {
      id: stableId,
      name: { en: query.toUpperCase(), cn: 'Google 搜索结果' },
      intro: { 
        en: snippet, 
        cn: '通过 Google 搜索获取的实时简介。' 
      },
      artworks: artworks,
      links: links,
      tags: ["Real-time", "Live Discovery"],
      snippet: snippet
    };
  } catch (error) {
    console.error("Search fetch failed:", error);
    return null;
  }
};
