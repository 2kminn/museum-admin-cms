import type { LanguageKey } from "../components/LanguageTabs";

export type ArtworkStatus = "draft" | "active";

export type LocalizedText = Record<LanguageKey, { title: string; description: string }>;

export type ArtworkSpatial = {
  x: number | null;
  y: number | null;
  z: number | null;
  triggerRadiusMeters: number;
};

export type ArtworkMedia = {
  thumbnailDataUrl: string | null;
  artworkImageName: string | null;
  markerImages: Array<{ fileName: string; size: number }> | null;
};

export type ArtworkRecord = {
  id: string;
  eventId: string;
  status: ArtworkStatus;
  localized: LocalizedText;
  spatial: ArtworkSpatial;
  media: ArtworkMedia;
  createdAt: string;
  updatedAt: string;
};

function storageKeyFor(eventId: string) {
  return `artar_admin:artworks:${eventId}`;
}

export function createEmptyLocalizedText(): LocalizedText {
  return {
    ko: { title: "", description: "" },
    en: { title: "", description: "" },
    ja: { title: "", description: "" },
    zh: { title: "", description: "" },
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export function generateArtworkId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `aw_${Date.now().toString(36)}_${rand}`;
}

export function loadArtworksForEvent(eventId: string): ArtworkRecord[] {
  if (!eventId) return [];
  const raw = window.localStorage.getItem(storageKeyFor(eventId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ArtworkRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((a) => a && a.eventId === eventId && typeof a.id === "string");
  } catch {
    return [];
  }
}

export function saveArtworksForEvent(eventId: string, artworks: ArtworkRecord[]) {
  if (!eventId) return;
  window.localStorage.setItem(storageKeyFor(eventId), JSON.stringify(artworks));
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

