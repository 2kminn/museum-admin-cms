import type { AuthRole, AuthUser, MuseumStatus } from "../auth/auth";
import {
  loadArtworksForEvent,
  type ArtworkRecord,
  type ArtworkStatus,
  type LocalizedText,
} from "./localArtworksStore";

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
  user: ApiAuthUser;
};

type RegisterResponse = ApiEnvelope<TokenResponse>;

type ApiAuthUser = {
  id: string;
  email: string;
  role: AuthRole;
  museum_status: MuseumStatus | null;
  museum_name: string | null;
  contact: string | null;
  proof_file_name: string | null;
  proof_file_url: string | null;
  created_at: string;
  updated_at: string;
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
  exhibition_hall_name: string | null;
  location: string | null;
  organizer_name: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  venue_count: number;
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
  code?: number | null;
  qr_url?: string | null;
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

type ApiSignedUrl = {
  upload_url: string;
  public_url: string;
  key: string;
  content_type: string;
  expires_in_minutes: number;
};

type ApiStatsSummary = Record<string, unknown>;

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function hasApiSession() {
  return Boolean(getToken());
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
      const body = (await res.json()) as {
        detail?: unknown;
        message?: string;
        error?: { code?: string; message?: string };
      };
      detail =
        typeof body.error?.code === "string"
          ? body.error.code
          : typeof body.error?.message === "string"
            ? body.error.message
            : typeof body.message === "string"
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

function mapAuthUser(user: ApiAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    museumStatus: user.museum_status,
    museumName: user.museum_name,
    contact: user.contact,
    proofFileName: user.proof_file_name,
    proofFileUrl: user.proof_file_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function apiLogin(username: string, password: string) {
  const body = await request<TokenResponse>("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const user = mapAuthUser(body.user);
  storeApiSession(body.access_token, user);
  return user;
}

export async function apiRegisterMuseum(input: {
  email: string;
  password: string;
  museumName: string;
  contact: string;
  proofFile: File | null;
}) {
  const form = new FormData();
  form.append("email", input.email);
  form.append("password", input.password);
  form.append("museum_name", input.museumName);
  form.append("contact", input.contact);
  if (input.proofFile) form.append("proof_file", input.proofFile);

  const body = await request<RegisterResponse>("/api/v1/admin/auth/register-museum", {
    method: "POST",
    body: form,
  });
  const user = mapAuthUser(body.data.user);
  storeApiSession(body.data.access_token, user);
  return user;
}

export async function apiGetMe() {
  const body = await request<ApiEnvelope<ApiAuthUser>>("/api/v1/admin/auth/me");
  const user = mapAuthUser(body.data);
  const token = getToken();
  if (token) storeApiSession(token, user);
  return user;
}

export async function apiResubmitMuseumApplication(input: {
  museumName: string;
  contact: string;
  proofFile: File | null;
}) {
  const form = new FormData();
  form.append("museum_name", input.museumName);
  form.append("contact", input.contact);
  if (input.proofFile) form.append("proof_file", input.proofFile);

  const body = await request<ApiEnvelope<ApiAuthUser>>(
    "/api/v1/admin/auth/museum-application/resubmit",
    {
      method: "PATCH",
      body: form,
    },
  );
  const user = mapAuthUser(body.data);
  const token = getToken();
  if (token) storeApiSession(token, user);
  return user;
}

export async function apiListMuseums(input: {
  status?: MuseumStatus;
  q?: string;
  page?: number;
  perPage?: number;
} = {}) {
  const params = new URLSearchParams();
  if (input.status) params.set("status", input.status);
  if (input.q?.trim()) params.set("q", input.q.trim());
  params.set("page", String(input.page ?? 1));
  params.set("per_page", String(input.perPage ?? 100));

  const body = await request<ApiEnvelope<ApiAuthUser[]>>(
    `/api/v1/admin/museums?${params.toString()}`,
  );
  return {
    data: unwrapList(body).map(mapAuthUser),
    meta: body.meta ?? { total: 0, page: input.page ?? 1, per_page: input.perPage ?? 100 },
  };
}

export async function apiSetMuseumStatus(userId: string, museumStatus: MuseumStatus) {
  const body = await request<ApiEnvelope<ApiAuthUser>>(`/api/v1/admin/museums/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ museum_status: museumStatus }),
  });
  return mapAuthUser(body.data);
}

export async function apiUpdateMuseumProfile(input: {
  userId: string;
  museumName: string;
  contact: string;
  proofFile: File | null;
}) {
  const form = new FormData();
  form.append("museum_name", input.museumName);
  form.append("contact", input.contact);
  if (input.proofFile) form.append("proof_file", input.proofFile);

  const body = await request<ApiEnvelope<ApiAuthUser>>(`/api/v1/admin/museums/${input.userId}`, {
    method: "PATCH",
    body: form,
  });
  return mapAuthUser(body.data);
}

export async function apiDeleteMuseum(userId: string) {
  await request<ApiEnvelope<{ ok: boolean }>>(`/api/v1/admin/museums/${userId}`, {
    method: "DELETE",
  });
}

export async function apiGetMuseumProofUrl(userId: string) {
  const body = await request<ApiEnvelope<{ url: string; proof_file_name: string | null }>>(
    `/api/v1/admin/museums/${userId}/proof-url`,
  );
  return {
    url: body.data.url,
    proofFileName: body.data.proof_file_name,
  };
}

function unwrapList<T>(body: ApiEnvelope<T[]>): T[] {
  return Array.isArray(body.data) ? body.data : [];
}

export async function apiListEvents() {
  const body = await request<ApiEnvelope<ApiEvent[]>>("/api/v1/admin/events?per_page=100");
  return unwrapList(body);
}

export type ApiEventInput = {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  exhibitionHallName: string;
  location: string;
  organizerName: string;
  memo: string;
};

function toApiEventPayload(input: ApiEventInput) {
  return {
    name: input.name,
    slug: input.slug,
    start_date: input.startDate,
    end_date: input.endDate,
    is_public: true,
    exhibition_hall_name: input.exhibitionHallName,
    location: input.location,
    organizer_name: input.organizerName,
    memo: input.memo || null,
  };
}

export async function apiCreateEvent(input: ApiEventInput) {
  const body = await request<ApiEnvelope<ApiEvent>>("/api/v1/admin/events", {
    method: "POST",
    body: JSON.stringify(toApiEventPayload(input)),
  });
  return body.data;
}

export async function apiGetEvent(eventId: string) {
  const body = await request<ApiEnvelope<ApiEvent>>(`/api/v1/admin/events/${eventId}`);
  return body.data;
}

export async function apiUpdateEvent(eventId: string, input: ApiEventInput) {
  const body = await request<ApiEnvelope<ApiEvent>>(`/api/v1/admin/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(toApiEventPayload(input)),
  });
  return body.data;
}

export async function apiDeleteEvent(eventId: string) {
  await request<void>(`/api/v1/admin/events/${eventId}`, { method: "DELETE" });
}

export async function apiListVenues(eventId: string) {
  const body = await request<ApiEnvelope<ApiVenue[]>>(`/api/v1/admin/events/${eventId}/venues`);
  return unwrapList(body);
}

export async function apiCreateVenueForEvent(input: {
  eventId: string;
  name: string;
  address: string;
}) {
  const body = await request<ApiEnvelope<ApiVenue>>(`/api/v1/admin/events/${input.eventId}/venues`, {
    method: "POST",
    body: JSON.stringify({
      name_i18n: { ko: input.name, en: input.name, jp: input.name, cn: input.name },
      lat: 0,
      lng: 0,
      description_i18n: { ko: "", en: "", jp: "", cn: "" },
      address: input.address,
      sort_order: 0,
      is_active: true,
    }),
  });
  return body.data;
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
  const localById = new Map(loadArtworksForEvent(eventId).map((artwork) => [artwork.id, artwork]));
  const venues = await apiListVenues(eventId);
  const nested = await Promise.all(
    venues.map(async (venue) => {
      const body = await request<ApiEnvelope<ApiArtwork[]>>(
        `/api/v1/admin/venues/${venue.id}/artworks`,
      );
      return unwrapList(body).map((artwork) => {
        const mapped = mapArtwork(artwork, eventId);
        return mergeLocalArtworkMedia(mapped, localById.get(mapped.id));
      });
    }),
  );
  return nested.flat();
}

export async function apiGetArtwork(eventId: string, artworkId: string): Promise<ArtworkRecord> {
  const body = await request<ApiEnvelope<ApiArtwork>>(`/api/v1/admin/artworks/${artworkId}`);
  const mapped = mapArtwork(body.data, eventId);
  const local = loadArtworksForEvent(eventId).find((artwork) => artwork.id === artworkId);
  return mergeLocalArtworkMedia(mapped, local);
}

export async function apiUploadArtworkMedia(file: File) {
  const contentType = normalizeUploadContentType(file);
  const pageOrigin = window.location.origin;
  let signed: ApiEnvelope<ApiSignedUrl>;
  try {
    signed = await request<ApiEnvelope<ApiSignedUrl>>("/api/v1/admin/upload/signed-url", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        content_type: contentType,
      }),
    });
  } catch (error) {
    throw new Error(`SIGNED_URL_FAILED:${error instanceof Error ? error.message : "UNKNOWN"}`);
  }

  const uploadHost = getUrlHost(signed.data.upload_url);
  let uploadRes: Response;
  try {
    uploadRes = await fetch(signed.data.upload_url, {
      method: "PUT",
      headers: {
        "content-type": signed.data.content_type,
      },
      body: file,
    });
  } catch (error) {
    throw new Error(
      `STORAGE_UPLOAD_FETCH_FAILED:origin=${pageOrigin};host=${uploadHost};detail=${
        error instanceof Error ? error.message : "UNKNOWN"
      }`,
    );
  }

  if (!uploadRes.ok) {
    throw new Error(`UPLOAD_FAILED_${uploadRes.status}`);
  }

  return signed.data.public_url;
}

function getUrlHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "UNKNOWN";
  }
}

export async function apiSaveArtworkForEvent(
  eventId: string,
  artwork: ArtworkRecord,
  isEditing: boolean,
) {
  const imageUrl =
    artwork.mediaType === "image" ? artwork.mediaUrl || artwork.media.thumbnailDataUrl : null;
  const payload = {
    title_i18n: toApiI18nTitle(artwork.localized),
    description_i18n: toApiI18nDescription(artwork.localized),
    artist: artwork.artist?.trim() || null,
    marker_image_url: imageUrl,
    media_url: artwork.mediaUrl || null,
    media_type: artwork.mediaType,
    sort_order: artwork.sortOrder,
    is_active: artwork.status === "active",
  };

  if (isEditing) {
    const body = await request<ApiEnvelope<ApiArtwork>>(`/api/v1/admin/artworks/${artwork.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return mergeLocalArtworkMedia(mapArtwork(body.data, eventId), artwork);
  }

  const venueId = artwork.venueId ?? (await getPrimaryVenue(eventId)).id;
  const body = await request<ApiEnvelope<ApiArtwork>>(`/api/v1/admin/venues/${venueId}/artworks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mergeLocalArtworkMedia(mapArtwork(body.data, eventId), artwork);
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
  const artworkImageUrl = artwork.media_url ?? artwork.marker_image_url ?? null;

  return {
    id: artwork.id,
    code: artwork.code ?? null,
    qrUrl: artwork.qr_url ?? null,
    venueId: artwork.venue_id,
    eventId,
    status: artwork.is_active === false ? "draft" : "active",
    artist: artwork.artist ?? null,
    mediaUrl: artwork.media_url ?? null,
    mediaType: artwork.media_type ?? "image",
    sortOrder: artwork.sort_order ?? 0,
    localized,
    spatial: {
      x: null,
      y: null,
      z: null,
      triggerRadiusMeters: 10,
    },
    media: {
      thumbnailDataUrl: artworkImageUrl,
      artworkImageName: artworkImageUrl ? filenameFromUrl(artworkImageUrl) : null,
      markerImages: artwork.marker_image_url
        ? [{ fileName: filenameFromUrl(artwork.marker_image_url), size: 0 }]
        : null,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

function mergeLocalArtworkMedia(remote: ArtworkRecord, local?: ArtworkRecord): ArtworkRecord {
  if (!local?.media.thumbnailDataUrl || remote.media.thumbnailDataUrl) return remote;
  return {
    ...remote,
    media: {
      ...remote.media,
      thumbnailDataUrl: local.media.thumbnailDataUrl,
      artworkImageName: remote.media.artworkImageName ?? local.media.artworkImageName,
      markerImages: remote.media.markerImages ?? local.media.markerImages,
    },
  };
}

function normalizeUploadContentType(file: File): string {
  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif") {
    return file.type;
  }
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".gif")) return "image/gif";
  throw new Error("UNSUPPORTED_UPLOAD_TYPE");
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
