import { Menu } from "lucide-react";
import { useEventContext } from "../context/EventContext";

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { events, selectedEventId, setSelectedEventId } = useEventContext();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="text-sm font-semibold leading-5 text-zinc-900">ArtAR Busan</div>
          <div className="text-xs text-zinc-500">관리자 CMS</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="hidden text-xs font-medium text-zinc-600 md:inline" htmlFor="event-selector">
            행사 선택
          </label>
          <select
            id="event-selector"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-10 max-w-[16rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none md:max-w-[22rem]"
            aria-label="현재 행사 선택"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

