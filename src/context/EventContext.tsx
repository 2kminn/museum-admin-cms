import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiCreateEvent, apiCreateVenueForEvent, apiListEvents } from "../lib/api";

export type EventOption = {
  id: string;
  name: string;
  slug?: string;
  exhibitionHallName?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  organizerName?: string;
  memo?: string;
};

export type EventInput = {
  name: string;
  exhibitionHallName: string;
  location: string;
  startDate: string;
  endDate: string;
  organizerName: string;
  memo: string;
};

type EventContextValue = {
  events: EventOption[];
  selectedEventId: string;
  setSelectedEventId: (eventId: string) => void;
  selectedEvent?: EventOption;
  addEvent: (input: EventInput) => Promise<EventOption>;
};

const EventContext = createContext<EventContextValue | null>(null);
const STORAGE_KEY = "artar_admin:selected_event_id";
const LOCAL_EVENTS_KEY = "artar_admin:custom_events";
const LOCAL_EVENT_META_KEY = "artar_admin:event_meta";

const DEFAULT_EVENTS: EventOption[] = [
  {
    id: "busan-night-wave-2026",
    name: "부산 나이트 웨이브 2026",
    exhibitionHallName: "부산시립미술관",
    location: "부산 해운대구 APEC로 58",
    startDate: "2026-03-18",
    endDate: "2026-03-24",
    organizerName: "ArtAR Busan",
    memo: "대표 테스트 행사",
  },
  {
    id: "gwangalli-ar-festival",
    name: "광안리 AR 페스티벌",
    exhibitionHallName: "광안리 해변",
    location: "부산 수영구 광안해변로",
    startDate: "2026-04-10",
    endDate: "2026-04-19",
    organizerName: "ArtAR Busan",
    memo: "야외 전시 기준 샘플",
  },
  {
    id: "haeundae-media-walk",
    name: "해운대 미디어 워크",
    exhibitionHallName: "해운대 문화회관",
    location: "부산 해운대구 양운로 97",
    startDate: "2026-05-01",
    endDate: "2026-05-10",
    organizerName: "ArtAR Busan",
    memo: "실내 동선형 전시 샘플",
  },
];

function loadStoredEvents(key: string): EventOption[] {
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as EventOption[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((event) => event && typeof event.id === "string" && typeof event.name === "string");
  } catch {
    return [];
  }
}

function saveStoredEvents(key: string, events: EventOption[]) {
  window.localStorage.setItem(key, JSON.stringify(events));
}

function mergeEvents(...groups: EventOption[][]) {
  const merged = new Map<string, EventOption>();
  groups.flat().forEach((event) => {
    const previous = merged.get(event.id);
    merged.set(event.id, { ...previous, ...event });
  });
  return Array.from(merged.values());
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `event-${Date.now()}`;
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventIdState] = useState(DEFAULT_EVENTS[0]?.id ?? "");
  const [events, setEvents] = useState<EventOption[]>(() =>
    mergeEvents(DEFAULT_EVENTS, loadStoredEvents(LOCAL_EVENTS_KEY), loadStoredEvents(LOCAL_EVENT_META_KEY)),
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSelectedEventIdState(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setEvents(mergeEvents(DEFAULT_EVENTS, loadStoredEvents(LOCAL_EVENTS_KEY), loadStoredEvents(LOCAL_EVENT_META_KEY)));
      return () => {
        cancelled = true;
      };
    }

    apiListEvents()
      .then((items) => {
        if (cancelled || items.length === 0) return;
        const localEvents = loadStoredEvents(LOCAL_EVENTS_KEY);
        const localMeta = loadStoredEvents(LOCAL_EVENT_META_KEY);
        const next = mergeEvents(
          items.map((event) => ({
            id: event.id,
            name: event.name,
            slug: event.slug,
            startDate: event.start_date,
            endDate: event.end_date,
          })),
          localEvents,
          localMeta,
        );
        setEvents(next);
        setSelectedEventIdState((current) =>
          next.some((event) => event.id === current) ? current : next[0]?.id ?? "",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setEvents(
            mergeEvents(DEFAULT_EVENTS, loadStoredEvents(LOCAL_EVENTS_KEY), loadStoredEvents(LOCAL_EVENT_META_KEY)),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setSelectedEventId = (eventId: string) => {
    setSelectedEventIdState(eventId);
    window.localStorage.setItem(STORAGE_KEY, eventId);
  };

  const addEvent = useCallback(async (input: EventInput) => {
    const slug = slugify(input.name);
    const localEvent: EventOption = {
      id: `${slug}-${Date.now()}`,
      slug,
      name: input.name.trim(),
      exhibitionHallName: input.exhibitionHallName.trim(),
      location: input.location.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      organizerName: input.organizerName.trim(),
      memo: input.memo.trim(),
    };

    let nextEvent = localEvent;
    try {
      const created = await apiCreateEvent({
        name: localEvent.name,
        slug,
        startDate: localEvent.startDate ?? "",
        endDate: localEvent.endDate ?? "",
      });
      nextEvent = {
        ...localEvent,
        id: created.id,
        slug: created.slug,
        name: created.name,
        startDate: created.start_date,
        endDate: created.end_date,
      };

      if (localEvent.exhibitionHallName || localEvent.location) {
        await apiCreateVenueForEvent({
          eventId: created.id,
          name: localEvent.exhibitionHallName || localEvent.name,
          address: localEvent.location ?? "",
        }).catch(() => undefined);
      }
    } catch {
      nextEvent = localEvent;
    }

    const localEvents = mergeEvents(loadStoredEvents(LOCAL_EVENTS_KEY), [nextEvent]);
    const localMeta = mergeEvents(loadStoredEvents(LOCAL_EVENT_META_KEY), [nextEvent]);
    saveStoredEvents(LOCAL_EVENTS_KEY, localEvents);
    saveStoredEvents(LOCAL_EVENT_META_KEY, localMeta);

    setEvents((current) => mergeEvents(current, [nextEvent]));
    setSelectedEventId(nextEvent.id);
    return nextEvent;
  }, []);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId],
  );

  const value = useMemo<EventContextValue>(
    () => ({ events, selectedEventId, setSelectedEventId, selectedEvent, addEvent }),
    [events, selectedEventId, selectedEvent, addEvent],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventContext must be used within EventProvider");
  return ctx;
}
