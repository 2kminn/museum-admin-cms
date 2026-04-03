import React, { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Building2, FileUp, Landmark, Lock, LogIn, Mail, Phone, UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import {
  formatKoreanMobile,
  isValidEmail,
  isValidKoreanMobileDigits,
  toKoreanMobileDigits,
} from "../lib/authInput";

type Tab = "login" | "register";

function inputBaseClasses() {
  return "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
}

function labelClasses() {
  return "text-xs font-medium text-zinc-700 dark:text-zinc-300";
}

export function LoginPage() {
  const { isReady, user, login, registerMuseum, devImpersonate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState<string | null>(null);
  const authBypassEnabled = true;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [museumName, setMuseumName] = useState("");
  const [contactDigits, setContactDigits] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [emailTouched, setEmailTouched] = useState(false);
  const [contactTouched, setContactTouched] = useState(false);

  const redirectPath = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    return typeof from === "string" && from.startsWith("/") ? from : null;
  }, [location.state]);

  const emailError = useMemo(() => {
    if (!emailTouched) return null;
    if (!email.trim()) return "이메일을 입력해 주세요.";
    if (!isValidEmail(email)) return "이메일 형식이 올바르지 않습니다. 예) example@domain.com";
    return null;
  }, [email, emailTouched]);

  const contactError = useMemo(() => {
    if (!contactTouched) return null;
    if (!contactDigits.trim()) return "연락처를 입력해 주세요.";
    if (!isValidKoreanMobileDigits(contactDigits)) return "휴대폰 번호 형식이 올바르지 않습니다. 예) 010-0000-0000";
    return null;
  }, [contactDigits, contactTouched]);

  if (!isReady) return null;
  if (user) {
    if (user.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
    if (user.museumStatus === "PENDING_MUSEUM") return <Navigate to="/waiting" replace />;
    if (user.museumStatus === "APPROVED_MUSEUM") return <Navigate to="/cms" replace />;
    if (user.museumStatus === "REJECTED_MUSEUM") return <Navigate to="/rejected" replace />;
    return <Navigate to="/login" replace />;
  }

  const navigateAfterAuth = (nextUser: Awaited<ReturnType<typeof login>>) => {
    if (nextUser.role === "SUPER_ADMIN") {
      navigate("/super-admin", { replace: true });
      return;
    }
    if (nextUser.museumStatus === "PENDING_MUSEUM") {
      navigate("/waiting", { replace: true });
      return;
    }
    if (nextUser.museumStatus === "APPROVED_MUSEUM") {
      navigate(redirectPath ?? "/cms", { replace: true });
      return;
    }
    if (nextUser.museumStatus === "REJECTED_MUSEUM") {
      navigate("/rejected", { replace: true });
      return;
    }
    navigate("/login", { replace: true });
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    if (!isValidEmail(email)) return;
    try {
      const next = await login(email, password);
      navigateAfterAuth(next);
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    setContactTouched(true);
    if (!isValidEmail(email) || !isValidKoreanMobileDigits(contactDigits)) return;
    try {
      await registerMuseum({
        email,
        password,
        museumName,
        contact: formatKoreanMobile(contactDigits),
        proofFileName: proofFile?.name ?? null,
      });
      navigate("/waiting", { replace: true });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "EMAIL_ALREADY_EXISTS") setError("이미 사용 중인 이메일입니다.");
      else if (code === "EMAIL_REQUIRED") setError("이메일을 입력해 주세요.");
      else if (code === "PASSWORD_REQUIRED") setError("비밀번호를 입력해 주세요.");
      else if (code === "MUSEUM_NAME_REQUIRED") setError("미술관/기관명을 입력해 주세요.");
      else if (code === "CONTACT_REQUIRED") setError("연락처를 입력해 주세요.");
      else setError("등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-semibold">ArtAR Busan</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Admin CMS · Multi-role 인증(Mock)</div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">테스트 계정</div>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">SUPER_ADMIN</span>: super@test.com
                    </li>
                    <li>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">PENDING_MUSEUM</span>: pending@test.com
                    </li>
                    <li>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">APPROVED_MUSEUM</span>: approved@test.com
                    </li>
                    <li className="pt-1 text-zinc-500 dark:text-zinc-400">비밀번호: password</li>
                  </ul>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  본 화면은 localStorage를 사용해 서버 없이 인증/승인 플로우를 시뮬레이션합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">인증</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">로그인 또는 미술관 등록 신청</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className={[
                    "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold",
                    tab === "login"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
                  ].join(" ")}
                >
                  <LogIn className="h-4 w-4" />
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className={[
                    "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold",
                    tab === "register"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
                  ].join(" ")}
                >
                  <UserPlus className="h-4 w-4" />
                  등록 신청
                </button>
              </div>
            </div>

            <div className="px-5 py-5">
              {error ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              {tab === "login" ? (
                <form onSubmit={onLogin} className="space-y-4">
                  <div>
                    <label className={labelClasses()} htmlFor="email">
                      이메일
                    </label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="email"
                        value={email}
                        onChange={(e) => {
                          if (!emailTouched) setEmailTouched(true);
                          setEmail(e.target.value);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        className={[inputBaseClasses(), "pl-10"].join(" ")}
                        placeholder="you@museum.com"
                        autoComplete="email"
                      />
                    </div>
                    {emailError ? (
                      <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">{emailError}</div>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClasses()} htmlFor="password">
                      비밀번호
                    </label>
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={[inputBaseClasses(), "pl-10"].join(" ")}
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <LogIn className="h-4 w-4" />
                    로그인
                  </button>

                  {authBypassEnabled ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        테스트 바로가기 (인증 우회)
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const next = await devImpersonate("super@test.com");
                              navigateAfterAuth(next);
                            } catch {
                              setError("개발용 로그인 처리에 실패했습니다.");
                            }
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Super Admin
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const next = await devImpersonate("approved@test.com");
                              navigateAfterAuth(next);
                            } catch {
                              setError("개발용 로그인 처리에 실패했습니다.");
                            }
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                        >
                          CMS
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        인증 없이 바로 로그인됩니다(테스트용).
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 lg:hidden">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      <Building2 className="h-4 w-4" />
                      테스트 계정
                    </div>
                    <div className="mt-2 grid gap-1">
                      <div>super@test.com / password</div>
                      <div>pending@test.com / password</div>
                      <div>approved@test.com / password</div>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={onRegister} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClasses()} htmlFor="reg-email">
                        이메일
                      </label>
                      <div className="relative mt-1">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="reg-email"
                          value={email}
                          onChange={(e) => {
                            if (!emailTouched) setEmailTouched(true);
                            setEmail(e.target.value);
                          }}
                          onBlur={() => setEmailTouched(true)}
                          className={[inputBaseClasses(), "pl-10"].join(" ")}
                          placeholder="you@museum.com"
                          autoComplete="email"
                        />
                      </div>
                      {emailError ? (
                        <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">{emailError}</div>
                      ) : null}
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClasses()} htmlFor="reg-password">
                        비밀번호
                      </label>
                      <div className="relative mt-1">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="reg-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={[inputBaseClasses(), "pl-10"].join(" ")}
                          placeholder="비밀번호"
                          type="password"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
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

                    <div className="sm:col-span-2">
                      <label className={labelClasses()} htmlFor="contact">
                        담당자 연락처
                      </label>
                      <div className="relative mt-1">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
                          className={[inputBaseClasses(), "pl-10"].join(" ")}
                          placeholder="010-0000-0000"
                        />
                      </div>
                      {contactError ? (
                        <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">{contactError}</div>
                      ) : null}
                    </div>

                    <div className="sm:col-span-2">
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
                          {proofFile?.name ?? "선택된 파일 없음"}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        파일은 저장하지 않고 파일명만 localStorage에 기록합니다(목업).
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <UserPlus className="h-4 w-4" />
                    등록 신청
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
