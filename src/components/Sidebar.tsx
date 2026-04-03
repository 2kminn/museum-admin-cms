import { BarChart3, CalendarDays, LayoutDashboard, MapPinned, Palette } from "lucide-react";
import { NavLink } from "react-router-dom";

type Props = {
  onNavigate?: () => void;
};

const navItems = [
  { to: "/cms", end: true, label: "대시보드", icon: LayoutDashboard },
  { to: "/cms/events", label: "행사 관리", icon: CalendarDays },
  { to: "/cms/locations", label: "작품 설정", icon: MapPinned },
  { to: "/cms/analytics", label: "데이터 통계", icon: BarChart3 },
  { to: "/cms/theme", label: "테마 편집기", icon: Palette },
] as const;

export function Sidebar({ onNavigate }: Props) {
  return (
    <div className="flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-4 py-5">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ArtAR Busan</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          공공 미디어아트 · AR 템플릿 플랫폼
        </div>
      </div>

      <nav className="px-2 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              end={"end" in item ? item.end : false}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={[
                      "h-5 w-5 transition-colors duration-200",
                      isActive
                        ? "text-white"
                        : "text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200",
                    ].join(" ")}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">v0.1 · Admin CMS</div>
      </div>
    </div>
  );
}
