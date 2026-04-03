import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileUp, LogOut, Pencil, Search, Shield, Trash2, Users, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "../auth/auth";
import { deleteUser, listApprovedMuseums, listPendingMuseums, setMuseumStatus, updateMuseumProfile } from "../auth/auth";
import { useAuth } from "../auth/AuthContext";
import { ConfirmModal } from "../components/ConfirmModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { formatKoreanMobile, isValidKoreanMobileDigits, toKoreanMobileDigits } from "../lib/authInput";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function SuperAdminPage() {
  const { logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<AuthUser[]>([]);
  const [approved, setApproved] = useState<AuthUser[]>([]);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [tab, setTab] = useState<"pending" | "approved">("pending");

  const [pendingQuery, setPendingQuery] = useState("");
  const [approvedQuery, setApprovedQuery] = useState("");

  const [approvedMode, setApprovedMode] = useState<"list" | "form">("list");
  const [editingApprovedId, setEditingApprovedId] = useState<string | null>(null);
  const [museumName, setMuseumName] = useState("");
  const [contactDigits, setContactDigits] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [contactTouched, setContactTouched] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const reloadPending = () => setPending(listPendingMuseums());
  const reloadApproved = () => setApproved(listApprovedMuseums());

  useEffect(() => {
    reloadPending();
    reloadApproved();
    const onStorage = () => {
      refresh();
      reloadPending();
      reloadApproved();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const filteredPending = useMemo(() => {
    const q = pendingQuery.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter((u) => {
      const hay = `${u.email} ${u.museumName ?? ""} ${u.contact ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pending, pendingQuery]);

  const filteredApproved = useMemo(() => {
    const q = approvedQuery.trim().toLowerCase();
    if (!q) return approved;
    return approved.filter((u) => {
      const hay = `${u.email} ${u.museumName ?? ""} ${u.contact ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [approved, approvedQuery]);

  const editingApproved = useMemo(() => {
    if (!editingApprovedId) return null;
    return approved.find((u) => u.id === editingApprovedId) ?? null;
  }, [approved, editingApprovedId]);

  const approve = (userId: string) => {
    setMuseumStatus(userId, "APPROVED_MUSEUM");
    reloadPending();
    reloadApproved();
  };

  const reject = (userId: string) => {
    setMuseumStatus(userId, "REJECTED_MUSEUM");
    reloadPending();
    reloadApproved();
  };

  const startEditApproved = (u: AuthUser) => {
    setApprovedMode("form");
    setEditingApprovedId(u.id);
    setMuseumName(u.museumName ?? "");
    setContactDigits(toKoreanMobileDigits(u.contact ?? ""));
    setProofFile(null);
    setSaveError(null);
    setContactTouched(false);
  };

  const cancelEditApproved = () => {
    setApprovedMode("list");
    setEditingApprovedId(null);
    setMuseumName("");
    setContactDigits("");
    setProofFile(null);
    setSaveError(null);
    setContactTouched(false);
  };

  const onSaveApproved = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setContactTouched(true);
    if (!editingApprovedId) return;
    if (!museumName.trim()) {
      setSaveError("미술관/기관명을 입력해 주세요.");
      return;
    }
    if (!isValidKoreanMobileDigits(contactDigits)) {
      setSaveError("휴대폰 번호 형식이 올바르지 않습니다. 예) 010-0000-0000");
      return;
    }

    try {
      updateMuseumProfile({
        userId: editingApprovedId,
        museumName,
        contact: formatKoreanMobile(contactDigits),
        proofFileName: proofFile?.name ?? editingApproved?.proofFileName ?? null,
      });
      reloadApproved();
      cancelEditApproved();
    } catch {
      setSaveError("저장 중 오류가 발생했습니다.");
    }
  };

  const onDeleteApproved = () => {
    if (!editingApprovedId) return;
    try {
      deleteUser(editingApprovedId);
      reloadApproved();
      cancelEditApproved();
    } catch {
      setSaveError("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
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
      <ConfirmModal
        open={deleteOpen}
        title="삭제"
        message="정말 삭제할까요?"
        cancelText="취소"
        confirmText="확인"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          onDeleteApproved();
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
                <p className="text-sm text-zinc-600 dark:text-zinc-300">미술관 등록 승인/관리</p>
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
            <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "approved")} className="flex items-center gap-3">
              <TabsList>
                <TabsTrigger value="pending">
                  <span className="inline-flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    대기
                  </span>
                </TabsTrigger>
                <TabsTrigger value="approved">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    승인됨
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="ml-auto flex w-full max-w-sm items-center gap-2 sm:w-auto">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={pendingQuery}
                    onChange={(e) => setPendingQuery(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    placeholder="이메일/기관명/연락처 검색"
                  />
                </div>
              </TabsContent>

              <TabsContent value="approved" className="ml-auto flex w-full max-w-sm items-center gap-2 sm:w-auto">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={approvedQuery}
                    onChange={(e) => setApprovedQuery(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    placeholder="이메일/기관명/연락처 검색"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {tab === "pending" ? (
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
                  {filteredPending.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                      >
                        대기 중인 신청이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredPending.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
                      >
                        <td className="px-5 py-4 font-medium">{u.museumName ?? "-"}</td>
                        <td className="px-5 py-4">{u.email}</td>
                        <td className="px-5 py-4">{u.contact ?? "-"}</td>
                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">
                          {u.proofFileName ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">
                          {formatDate(u.createdAt)}
                        </td>
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
          ) : (
            <div className="p-5">
              {approvedMode === "list" ? (
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    승인된 미술관 ({filteredApproved.length})
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        <tr>
                          <th className="px-4 py-3 font-semibold">기관명</th>
                          <th className="px-4 py-3 font-semibold">이메일</th>
                          <th className="px-4 py-3 font-semibold">연락처</th>
                          <th className="px-4 py-3 font-semibold">증빙</th>
                          <th className="px-4 py-3 font-semibold">수정</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApproved.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                            >
                              승인된 계정이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          filteredApproved.map((u) => (
                            <tr
                              key={u.id}
                              className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
                            >
                              <td className="px-4 py-4 font-medium">{u.museumName ?? "-"}</td>
                              <td className="px-4 py-4">{u.email}</td>
                              <td className="px-4 py-4">{u.contact ?? "-"}</td>
                              <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400">
                                {u.proofFileName ?? "-"}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => startEditApproved(u)}
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                                >
                                  <Pencil className="h-4 w-4" />
                                  수정/삭제
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSaveApproved} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        승인된 미술관 수정
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        이메일: <span className="font-medium">{editingApproved?.email ?? "-"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEditApproved}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                      >
                        저장
                      </button>
                    </div>
                  </div>

                  {saveError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                      {saveError}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300" htmlFor="museumName">
                        미술관/기관명
                      </label>
                      <input
                        id="museumName"
                        value={museumName}
                        onChange={(e) => setMuseumName(e.target.value)}
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        placeholder="예) 부산시립미술관"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300" htmlFor="contact">
                        담당자 연락처
                      </label>
                      <input
                        id="contact"
                        value={formatKoreanMobile(contactDigits)}
                        onChange={(e) => {
                          if (!contactTouched) setContactTouched(true);
                          setContactDigits(toKoreanMobileDigits(e.target.value));
                        }}
                        onBlur={() => setContactTouched(true)}
                        onKeyDown={(e) => {
                          if (e.ctrlKey || e.metaKey || e.altKey) return;
                          if (e.key.length !== 1) return;
                          if (!/^\d$/.test(e.key)) e.preventDefault();
                        }}
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={13}
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        placeholder="010-0000-0000"
                      />
                      {contactTouched && !isValidKoreanMobileDigits(contactDigits) ? (
                        <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                          휴대폰 번호 형식이 올바르지 않습니다. 예) 010-0000-0000
                        </div>
                      ) : null}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300" htmlFor="proof">
                        증빙 파일
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
                          {proofFile?.name ?? editingApproved?.proofFileName ?? "선택된 파일 없음"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      삭제 시 계정이 localStorage에서 제거됩니다.
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          승인/거절 결과는 localStorage에 저장됩니다.
        </div>
      </div>
    </div>
  );
}
