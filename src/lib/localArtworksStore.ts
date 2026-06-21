import type { LanguageKey } from "../components/LanguageTabs";

export type ArtworkStatus = "draft" | "active";
export type ArtworkMediaType = "image" | "video" | "audio" | "model3d";

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
  code: number | null;
  qrUrl: string | null;
  venueId: string | null;
  eventId: string;
  status: ArtworkStatus;
  artist: string | null;
  mediaUrl: string | null;
  mediaType: ArtworkMediaType;
  sortOrder: number;
  localized: LocalizedText;
  spatial: ArtworkSpatial;
  media: ArtworkMedia;
  createdAt: string;
  updatedAt: string;
};

const USER_KEY = "artar_admin:api_user";

function currentStorageOwnerId() {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return "anonymous";
  try {
    const parsed = JSON.parse(raw) as { id?: unknown; email?: unknown };
    if (typeof parsed.id === "string" && parsed.id.trim()) return parsed.id.trim();
    if (typeof parsed.email === "string" && parsed.email.trim()) return parsed.email.trim();
  } catch {
    return "anonymous";
  }
  return "anonymous";
}

function storageKeyFor(eventId: string) {
  return `artar_admin:artworks:${currentStorageOwnerId()}:${eventId}`;
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
    return parsed
      .filter((a) => a && a.eventId === eventId && typeof a.id === "string")
      .map((a) => ({
        ...a,
        venueId: a.venueId ?? null,
        artist: a.artist ?? null,
        mediaUrl: a.mediaUrl ?? a.media?.thumbnailDataUrl ?? null,
        mediaType: a.mediaType ?? "image",
        sortOrder: a.sortOrder ?? 0,
      }));
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
