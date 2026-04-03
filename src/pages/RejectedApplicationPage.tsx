import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FileUp, LogOut, RotateCcw, ShieldAlert } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ConfirmModal } from "../components/ConfirmModal";

function inputBaseClasses() {
  return "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
}

function labelClasses() {
  return "text-xs font-medium text-zinc-700 dark:text-zinc-300";
}

export function RejectedApplicationPage() {
  const { isReady, user, logout, refresh, resubmitApplication } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [museumName, setMuseumName] = useState("");
  const [contact, setContact] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    setMuseumName(user.museumName ?? "");
    setContact(user.contact ?? "");
  }, [user]);

  const proofLabel = useMemo(() => {
    if (proofFile?.name) return proofFile.name;
    if (user?.proofFileName) return user.proofFileName;
    return "선택된 파일 없음";
  }, [proofFile?.name, user?.proofFileName]);

  if (!isReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  if (user.museumStatus === "PENDING_MUSEUM") return <Navigate to="/waiting" replace />;
  if (user.museumStatus === "APPROVED_MUSEUM") return <Navigate to="/cms" replace />;
  if (user.museumStatus !== "REJECTED_MUSEUM") return <Navigate to="/login" replace />;

  const onResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await resubmitApplication({
        museumName,
        contact,
        proofFileName: proofFile?.name ?? user.proofFileName ?? null,
      });
      navigate("/waiting", { replace: true });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "MUSEUM_NAME_REQUIRED") setError("미술관/기관명을 입력해 주세요.");
      else if (code === "CONTACT_REQUIRED") setError("연락처를 입력해 주세요.");
      else setError("재신청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold">승인 실패</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                제출하신 신청이 거절되었습니다. 정보를 수정한 뒤 다시 신청할 수 있습니다.
              </p>

              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">로그인 계정</div>
                <div className="mt-1 truncate font-medium">{user.email}</div>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <form onSubmit={onResubmit} className="mt-4 grid gap-4">
                <div>
                  <label className={labelClasses()} htmlFor="museumName">
                    미술관/기관명
                  </label>
                  <input
                    id="museumName"
                    value={museumName}
                    onChange={(e) => setMuseumName(e.target.value)}
                    className={inputBaseClasses()}
                    placeholder="예) 부산시립미술관"
                  />
                </div>

                <div>
                  <label className={labelClasses()} htmlFor="contact">
                    담당자 연락처
                  </label>
                  <input
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className={inputBaseClasses()}
                    placeholder="010-0000-0000"
                  />
                </div>

                <div>
                  <label className={labelClasses()} htmlFor="proof">
                    증빙 파일 업로드
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    <label
                      htmlFor="proof"
                      className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <FileUp className="h-4 w-4" />
                      파일 선택
                    </label>
                    <input
                      id="proof"
                      type="file"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                    <div className="min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {proofLabel}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    파일은 저장하지 않고 파일명만 localStorage에 기록합니다(목업).
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                    다시 신청하기
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogoutOpen(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

