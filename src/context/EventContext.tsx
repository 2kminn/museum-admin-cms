import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiListEvents } from "../lib/api";

type EventOption = {
  id: string;
  name: string;
  slug?: string;
};

type EventContextValue = {
  events: EventOption[];
  selectedEventId: string;
  setSelectedEventId: (eventId: string) => void;
  selectedEvent?: EventOption;
};

const EventContext = createContext<EventContextValue | null>(null);
const STORAGE_KEY = "artar_admin:selected_event_id";

const DEFAULT_EVENTS: EventOption[] = [
  { id: "busan-night-wave-2026", name: "부산 나이트 웨이브 2026" },
  { id: "gwangalli-ar-festival", name: "광안리 AR 페스티벌" },
  { id: "haeundae-media-walk", name: "해운대 미디어 워크" },
];

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventIdState] = useState(DEFAULT_EVENTS[0]?.id ?? "");
  const [events, setEvents] = useState<EventOption[]>(DEFAULT_EVENTS);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSelectedEventIdState(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setEvents(DEFAULT_EVENTS);
      return () => {
        cancelled = true;
      };
    }

    apiListEvents()
      .then((items) => {
        if (cancelled || items.length === 0) return;
        const next = items.map((event) => ({ id: event.id, name: event.name, slug: event.slug }));
        setEvents(next);
        setSelectedEventIdState((current) =>
          next.some((event) => event.id === current) ? current : next[0]?.id ?? "",
        );
      })
      .catch(() => {
        if (!cancelled) setEvents(DEFAULT_EVENTS);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setSelectedEventId = (eventId: string) => {
    setSelectedEventIdState(eventId);
    window.localStorage.setItem(STORAGE_KEY, eventId);
  };

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId],
  );

  const value = useMemo<EventContextValue>(
    () => ({ events, selectedEventId, setSelectedEventId, selectedEvent }),
    [events, selectedEventId, selectedEvent],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventContext must be used within EventProvider");
  return ctx;
}
