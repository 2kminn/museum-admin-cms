import { BarChart3, CalendarDays, LayoutDashboard, MapPinned, Palette } from "lucide-react";
import { NavLink } from "react-router-dom";

type Props = {
  onNavigate?: () => void;
};

const navItems = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/events", label: "행사 관리", icon: CalendarDays },
  { to: "/locations", label: "장소 및 작품 설정", icon: MapPinned },
  { to: "/analytics", label: "데이터 통계 (Analytics)", icon: BarChart3 },
  { to: "/theme", label: "테마 편집기", icon: Palette },
] as const;

export function Sidebar({ onNavigate }: Props) {
  return (
    <div className="flex h-full flex-col border-r border-zinc-200 bg-white">
      <div className="px-4 py-5">
        <div className="text-sm font-semibold text-zinc-900">ArtAR Busan</div>
        <div className="text-xs text-zinc-500">Public Media Art · AR Template Platform</div>
      </div>

      <nav className="px-2 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={[
                      "h-5 w-5",
                      isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-700",
                    ].join(" ")}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-200 px-4 py-4">
        <div className="text-xs text-zinc-500">v0.1 · Admin CMS</div>
      </div>
    </div>
  );
}
