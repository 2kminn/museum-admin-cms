import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  apiCreateEvent,
  apiListEvents,
  apiUpdateEvent,
  type ApiEvent,
  type ApiEventInput,
} from "../lib/api";

export type EventOption = {
  id: string;
  name: string;
  slug: string;
  exhibitionHallName: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  organizerName: string | null;
  memo: string | null;
  venueCount: number;
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
  updateEvent: (eventId: string, input: EventInput) => Promise<EventOption | null>;
};

const EventContext = createContext<EventContextValue | null>(null);
const STORAGE_KEY = "artar_admin:selected_event_id";

function mapApiEvent(event: ApiEvent): EventOption {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    exhibitionHallName: event.exhibition_hall_name,
    location: event.location,
    startDate: event.start_date,
    endDate: event.end_date,
    organizerName: event.organizer_name,
    memo: event.memo,
    venueCount: event.venue_count,
  };
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `event-${Date.now()}`;
}

function toApiEventInput(input: EventInput, slug: string): ApiEventInput {
  return {
    name: input.name.trim(),
    slug,
    startDate: input.startDate,
    endDate: input.endDate,
    exhibitionHallName: input.exhibitionHallName.trim(),
    location: input.location.trim(),
    organizerName: input.organizerName.trim(),
    memo: input.memo.trim(),
  };
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventIdState] = useState("");
  const [events, setEvents] = useState<EventOption[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSelectedEventIdState(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setEvents([]);
      setSelectedEventIdState("");
      return () => {
        cancelled = true;
      };
    }

    apiListEvents()
      .then((items) => {
        if (cancelled) return;
        const next = items.map(mapApiEvent);
        setEvents(next);
        setSelectedEventIdState((current) => {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          const preferred = current || saved || "";
          return next.some((event) => event.id === preferred) ? preferred : next[0]?.id ?? "";
        });
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setSelectedEventId = useCallback((eventId: string) => {
    setSelectedEventIdState(eventId);
    window.localStorage.setItem(STORAGE_KEY, eventId);
  }, []);

  const addEvent = useCallback(
    async (input: EventInput) => {
      const created = mapApiEvent(await apiCreateEvent(toApiEventInput(input, slugify(input.name))));
      setEvents((current) => [created, ...current.filter((event) => event.id !== created.id)]);
      setSelectedEventId(created.id);
      return created;
    },
    [setSelectedEventId],
  );

  const updateEvent = useCallback(async (eventId: string, input: EventInput) => {
    const currentEvent = events.find((event) => event.id === eventId);
    if (!currentEvent) return null;

    const updated = mapApiEvent(
      await apiUpdateEvent(eventId, toApiEventInput(input, currentEvent.slug || slugify(input.name))),
    );
    setEvents((current) => current.map((event) => (event.id === eventId ? updated : event)));
    return updated;
  }, [events]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId],
  );

  const value = useMemo<EventContextValue>(
    () => ({ events, selectedEventId, setSelectedEventId, selectedEvent, addEvent, updateEvent }),
    [events, selectedEventId, setSelectedEventId, selectedEvent, addEvent, updateEvent],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventContext must be used within EventProvider");
  return ctx;
}
