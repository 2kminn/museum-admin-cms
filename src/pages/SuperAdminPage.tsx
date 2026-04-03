import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LogOut, Search, Shield, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "../auth/auth";
import { listPendingMuseums, setMuseumStatus } from "../auth/auth";
import { useAuth } from "../auth/AuthContext";
import { ConfirmModal } from "../components/ConfirmModal";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function SuperAdminPage() {
  const { logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<AuthUser[]>([]);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const reload = () => setPending(listPendingMuseums());

  useEffect(() => {
    reload();
    const onStorage = () => {
      refresh();
      reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter((u) => {
      const hay = `${u.email} ${u.museumName ?? ""} ${u.contact ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pending, query]);

  const approve = (userId: string) => {
    setMuseumStatus(userId, "APPROVED_MUSEUM");
    reload();
  };

  const reject = (userId: string) => {
    setMuseumStatus(userId, "REJECTED_MUSEUM");
    reload();
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <ConfirmModal
        open={logoutOpen}
        title="Log out"
        message="Are you sure you want to log out?"
        cancelText="Cancel"
        confirmText="Confirm"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
          navigate("/login", { replace: true });
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Super Admin</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">미술관 등록 신청 승인/거절</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLogoutOpen(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div className="text-sm font-semibold">대기 목록</div>
            <div className="ml-auto flex w-full max-w-sm items-center gap-2 sm:w-auto">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="이메일/기관명/연락처 검색"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">기관명</th>
                  <th className="px-5 py-3 font-semibold">이메일</th>
                  <th className="px-5 py-3 font-semibold">연락처</th>
                  <th className="px-5 py-3 font-semibold">증빙</th>
                  <th className="px-5 py-3 font-semibold">신청일</th>
                  <th className="px-5 py-3 font-semibold">처리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      대기 중인 신청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                      <td className="px-5 py-4 font-medium">{u.museumName ?? "-"}</td>
                      <td className="px-5 py-4">{u.email}</td>
                      <td className="px-5 py-4">{u.contact ?? "-"}</td>
                      <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{u.proofFileName ?? "-"}</td>
                      <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => approve(u.id)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            승인
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(u.id)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <XCircle className="h-4 w-4" />
                            거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          승인/거절 결과는 localStorage에 저장됩니다.
        </div>
      </div>
    </div>
  );
}
