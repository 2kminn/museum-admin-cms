import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Clock3, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ConfirmModal } from "../components/ConfirmModal";

export function WaitingForApprovalPage() {
  const { isReady, user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  if (!isReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  if (user.museumStatus === "APPROVED_MUSEUM") return <Navigate to="/cms" replace />;
  if (user.museumStatus === "REJECTED_MUSEUM") return <Navigate to="/rejected" replace />;
  if (user.museumStatus !== "PENDING_MUSEUM") return <Navigate to="/login" replace />;

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
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Clock3 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">승인 대기 중</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                관리자가 신청 정보를 확인한 뒤 접근 권한을 부여합니다.
              </p>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">이메일</div>
                    <div className="truncate font-medium">{user.email}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">기관명</div>
                    <div className="truncate font-medium">{user.museumName ?? "-"}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">연락처</div>
                    <div className="truncate font-medium">{user.contact ?? "-"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  <ShieldCheck className="h-4 w-4" />
                  상태 새로고침
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogoutOpen(true);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </button>
              </div>
              <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Tip: 다른 브라우저/탭에서 `super@test.com`으로 로그인 후 승인하면 바로 접근 가능합니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
