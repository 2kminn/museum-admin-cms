import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type EventOption = {
  id: string;
  name: string;
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
  const [selectedEventId, setSelectedEventIdState] = useState(DEFAULT_EVENTS[0]?.id ?? "");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && DEFAULT_EVENTS.some((e) => e.id === saved)) setSelectedEventIdState(saved);
  }, []);

  const setSelectedEventId = (eventId: string) => {
    setSelectedEventIdState(eventId);
    window.localStorage.setItem(STORAGE_KEY, eventId);
  };

  const selectedEvent = useMemo(
    () => DEFAULT_EVENTS.find((e) => e.id === selectedEventId),
    [selectedEventId],
  );

  const value = useMemo<EventContextValue>(
    () => ({ events: DEFAULT_EVENTS, selectedEventId, setSelectedEventId, selectedEvent }),
    [selectedEventId, selectedEvent],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventContext must be used within EventProvider");
  return ctx;
}

