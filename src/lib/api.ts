import type { AuthRole, AuthUser, MuseumStatus } from "../auth/auth";
import type { ArtworkRecord, ArtworkStatus, LocalizedText } from "./localArtworksStore";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://artar-backend-932907510949.asia-northeast3.run.app";

const TOKEN_KEY = "artar_admin:api_access_token";
const USER_KEY = "artar_admin:api_user";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: { total: number; page: number; per_page: number } | null;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
};

type I18nField = {
  ko?: string;
  en?: string;
  jp?: string;
  cn?: string;
};

export type ApiEvent = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  venue_count?: number;
};

export type ApiVenue = {
  id: string;
  event_id: string;
  name_i18n: I18nField;
  lat: number;
  lng: number;
  description_i18n?: I18nField;
  address?: string | null;
  sort_order?: number;
  is_active?: boolean;
  artwork_count?: number;
};

type ApiArtwork = {
  id: string;
  venue_id: string;
  title_i18n: I18nField;
  description_i18n?: I18nField;
  artist?: string | null;
  marker_image_url?: string | null;
  media_url?: string | null;
  media_type?: "image" | "video" | "audio" | "model3d";
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
};

type ApiStatsSummary = Record<string, unknown>;

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredApiUser(): AuthUser | null {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearApiSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

function storeApiSession(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function authHeaders() {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...Object.fromEntries(headers.entries()),
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: unknown; message?: string };
      detail =
        typeof body.message === "string"
          ? body.message
          : typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail ?? body);
    } catch {
      detail = res.statusText;
    }
    throw new Error(detail || `HTTP_${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function synthesizeUser(username: string): AuthUser {
  const now = new Date().toISOString();
  const normalized = username.trim();
  const role: AuthRole = /super|admin/i.test(normalized) ? "SUPER_ADMIN" : "MUSEUM";
  const museumStatus: MuseumStatus | null = role === "SUPER_ADMIN" ? null : "APPROVED_MUSEUM";

  return {
    id: normalized,
    email: normalized,
    password: "",
    role,
    museumStatus,
    museumName: role === "MUSEUM" ? "API Museum" : null,
    contact: null,
    proofFileName: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function apiLogin(username: string, password: string) {
  const token = await request<TokenResponse>("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const user = synthesizeUser(username);
  storeApiSession(token.access_token, user);
  return user;
}

function unwrapList<T>(body: ApiEnvelope<T[]>): T[] {
  return Array.isArray(body.data) ? body.data : [];
}

export async function apiListEvents() {
  const body = await request<ApiEnvelope<ApiEvent[]>>("/api/v1/admin/events?per_page=100");
  return unwrapList(body);
}

export async function apiListVenues(eventId: string) {
  const body = await request<ApiEnvelope<ApiVenue[]>>(`/api/v1/admin/events/${eventId}/venues`);
  return unwrapList(body);
}

async function apiCreateDefaultVenue(eventId: string) {
  const body = await request<ApiEnvelope<ApiVenue>>(`/api/v1/admin/events/${eventId}/venues`, {
    method: "POST",
    body: JSON.stringify({
      name_i18n: { ko: "기본 장소", en: "Default Venue", jp: "Default Venue", cn: "Default Venue" },
      lat: 0,
      lng: 0,
      description_i18n: { ko: "", en: "", jp: "", cn: "" },
      sort_order: 0,
      is_active: true,
    }),
  });
  return body.data;
}

async function getPrimaryVenue(eventId: string) {
  const venues = await apiListVenues(eventId);
  return venues[0] ?? (await apiCreateDefaultVenue(eventId));
}

export async function apiListArtworksForEvent(eventId: string): Promise<ArtworkRecord[]> {
  const venues = await apiListVenues(eventId);
  const nested = await Promise.all(
    venues.map(async (venue) => {
      const body = await request<ApiEnvelope<ApiArtwork[]>>(
        `/api/v1/admin/venues/${venue.id}/artworks`,
      );
      return unwrapList(body).map((artwork) => mapArtwork(artwork, eventId));
    }),
  );
  return nested.flat();
}

export async function apiSaveArtworkForEvent(
  eventId: string,
  artwork: ArtworkRecord,
  isEditing: boolean,
) {
  const payload = {
    title_i18n: toApiI18nTitle(artwork.localized),
    description_i18n: toApiI18nDescription(artwork.localized),
    media_type: "image",
    sort_order: 0,
    is_active: artwork.status === "active",
  };

  if (isEditing) {
    const body = await request<ApiEnvelope<ApiArtwork>>(`/api/v1/admin/artworks/${artwork.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return mapArtwork(body.data, eventId);
  }

  const venue = await getPrimaryVenue(eventId);
  const body = await request<ApiEnvelope<ApiArtwork>>(`/api/v1/admin/venues/${venue.id}/artworks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapArtwork(body.data, eventId);
}

export async function apiDeleteArtwork(artworkId: string) {
  await request<void>(`/api/v1/admin/artworks/${artworkId}`, { method: "DELETE" });
}

export async function apiDashboardSummary(eventId: string) {
  const body = await request<ApiEnvelope<ApiStatsSummary>>(
    `/api/v1/admin/stats/events/${eventId}/summary`,
  );
  return body.data;
}

function mapArtwork(artwork: ApiArtwork, eventId: string): ArtworkRecord {
  const localized = fromApiI18n(artwork.title_i18n, artwork.description_i18n);
  const createdAt = artwork.created_at;

  return {
    id: artwork.id,
    eventId,
    status: artwork.is_active === false ? "draft" : "active",
    localized,
    spatial: {
      x: null,
      y: null,
      z: null,
      triggerRadiusMeters: 10,
    },
    media: {
      thumbnailDataUrl: artwork.media_url ?? artwork.marker_image_url ?? null,
      artworkImageName: artwork.media_url ? filenameFromUrl(artwork.media_url) : null,
      markerImages: artwork.marker_image_url
        ? [{ fileName: filenameFromUrl(artwork.marker_image_url), size: 0 }]
        : null,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

function fromApiI18n(title: I18nField, description?: I18nField): LocalizedText {
  return {
    ko: { title: title.ko ?? "", description: description?.ko ?? "" },
    en: { title: title.en ?? "", description: description?.en ?? "" },
    ja: { title: title.jp ?? "", description: description?.jp ?? "" },
    zh: { title: title.cn ?? "", description: description?.cn ?? "" },
  };
}

function toApiI18nTitle(localized: LocalizedText): I18nField {
  return {
    ko: localized.ko.title,
    en: localized.en.title,
    jp: localized.ja.title,
    cn: localized.zh.title,
  };
}

function toApiI18nDescription(localized: LocalizedText): I18nField {
  return {
    ko: localized.ko.description,
    en: localized.en.description,
    jp: localized.ja.description,
    cn: localized.zh.description,
  };
}

function filenameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).at(-1);
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}

export type { ApiStatsSummary };
