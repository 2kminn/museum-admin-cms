import { LogOut, Menu, Moon, Sun, UserCircle2 } from "lucide-react";
import { useEventContext } from "../context/EventContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { events, selectedEventId, setSelectedEventId } = useEventContext();
  const { mode, toggleMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      <ConfirmModal
        open={logoutOpen}
        title="로그아웃"
        message="로그아웃 하시겠습니까?"
        cancelText="취소"
        confirmText="확인"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
          navigate("/login", { replace: true });
        }}
      />

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="text-sm font-semibold leading-5 text-zinc-900 dark:text-zinc-100">
            ArtAR Busan
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">관리자 CMS</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 md:flex">
              <UserCircle2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <span className="max-w-[12rem] truncate">{user.email}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={toggleMode}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label={mode === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            title={mode === "dark" ? "라이트 모드" : "다크 모드"}
          >
            {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setLogoutOpen(true);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <LogOut className="h-5 w-5" />
          </button>

          <label
            className="hidden text-xs font-medium text-zinc-600 dark:text-zinc-300 md:inline"
            htmlFor="event-selector"
          >
            행사 선택
          </label>
          <select
            id="event-selector"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-10 max-w-[16rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 md:max-w-[22rem]"
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
    </>
  );
}
