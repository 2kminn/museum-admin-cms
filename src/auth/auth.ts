export type AuthRole = "SUPER_ADMIN" | "MUSEUM";

export type MuseumStatus = "PENDING_MUSEUM" | "APPROVED_MUSEUM" | "REJECTED_MUSEUM";

export type AuthUser = {
  id: string;
  email: string;
  password: string;
  role: AuthRole;
  museumStatus: MuseumStatus | null;
  museumName: string | null;
  contact: string | null;
  proofFileName: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthSession = {
  userId: string;
  loggedInAt: string;
};

const USERS_KEY = "artar_auth_users_v1";
const SESSION_KEY = "artar_auth_session_v1";

function nowIso() {
  return new Date().toISOString();
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function loadUsers(): AuthUser[] {
  const parsed = safeParseJson<AuthUser[]>(localStorage.getItem(USERS_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

export function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function ensureSeededUsers() {
  const existing = loadUsers();
  const t = nowIso();
  const seeds: AuthUser[] = [
    {
      id: randomId(),
      email: "super@test.com",
      password: "password",
      role: "SUPER_ADMIN",
      museumStatus: null,
      museumName: null,
      contact: null,
      proofFileName: null,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: randomId(),
      email: "pending@test.com",
      password: "password",
      role: "MUSEUM",
      museumStatus: "PENDING_MUSEUM",
      museumName: "Pending Museum",
      contact: "010-0000-0000",
      proofFileName: "pending-proof.pdf",
      createdAt: t,
      updatedAt: t,
    },
    {
      id: randomId(),
      email: "approved@test.com",
      password: "password",
      role: "MUSEUM",
      museumStatus: "APPROVED_MUSEUM",
      museumName: "Approved Museum",
      contact: "010-1111-2222",
      proofFileName: "approved-proof.pdf",
      createdAt: t,
      updatedAt: t,
    },
  ];
  const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()));
  const toAdd = seeds.filter((u) => !existingEmails.has(u.email.toLowerCase()));
  if (toAdd.length === 0) return;

  saveUsers([...toAdd, ...existing]);
}

export function loadSession(): AuthSession | null {
  const parsed = safeParseJson<AuthSession>(localStorage.getItem(SESSION_KEY));
  if (!parsed?.userId) return null;
  return parsed;
}

export function saveSession(userId: string) {
  const session: AuthSession = { userId, loggedInAt: nowIso() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const session = loadSession();
  if (!session) return null;
  const users = loadUsers();
  return users.find((u) => u.id === session.userId) ?? null;
}

export function login(emailRaw: string, passwordRaw: string): AuthUser {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  const users = loadUsers();
  const match = users.find((u) => u.email.toLowerCase() === email && u.password === password);
  if (!match) {
    throw new Error("INVALID_CREDENTIALS");
  }
  saveSession(match.id);
  return match;
}

export function logout() {
  clearSession();
}

export function registerMuseum(input: {
  email: string;
  password: string;
  museumName: string;
  contact: string;
  proofFileName: string | null;
}): AuthUser {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("EMAIL_REQUIRED");
  if (!input.password) throw new Error("PASSWORD_REQUIRED");
  if (!input.museumName.trim()) throw new Error("MUSEUM_NAME_REQUIRED");
  if (!input.contact.trim()) throw new Error("CONTACT_REQUIRED");

  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const t = nowIso();
  const user: AuthUser = {
    id: randomId(),
    email,
    password: input.password,
    role: "MUSEUM",
    museumStatus: "PENDING_MUSEUM",
    museumName: input.museumName.trim(),
    contact: input.contact.trim(),
    proofFileName: input.proofFileName,
    createdAt: t,
    updatedAt: t,
  };
  saveUsers([user, ...users]);
  saveSession(user.id);
  return user;
}

export function listPendingMuseums(): AuthUser[] {
  return loadUsers().filter((u) => u.role === "MUSEUM" && u.museumStatus === "PENDING_MUSEUM");
}

export function listApprovedMuseums(): AuthUser[] {
  return loadUsers().filter((u) => u.role === "MUSEUM" && u.museumStatus === "APPROVED_MUSEUM");
}

export function setMuseumStatus(userId: string, status: MuseumStatus): AuthUser {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("USER_NOT_FOUND");
  const target = users[idx];
  if (target.role !== "MUSEUM") throw new Error("NOT_MUSEUM");

  const next: AuthUser = { ...target, museumStatus: status, updatedAt: nowIso() };
  const updated = users.slice();
  updated[idx] = next;
  saveUsers(updated);
  return next;
}

export function updateMuseumProfile(input: {
  userId: string;
  museumName: string;
  contact: string;
  proofFileName: string | null;
}): AuthUser {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === input.userId);
  if (idx < 0) throw new Error("USER_NOT_FOUND");
  const target = users[idx];
  if (target.role !== "MUSEUM") throw new Error("NOT_MUSEUM");
  if (!input.museumName.trim()) throw new Error("MUSEUM_NAME_REQUIRED");
  if (!input.contact.trim()) throw new Error("CONTACT_REQUIRED");

  const next: AuthUser = {
    ...target,
    museumName: input.museumName.trim(),
    contact: input.contact.trim(),
    proofFileName: input.proofFileName,
    updatedAt: nowIso(),
  };
  const updated = users.slice();
  updated[idx] = next;
  saveUsers(updated);
  return next;
}

export function resubmitMuseumApplication(input: {
  userId: string;
  museumName: string;
  contact: string;
  proofFileName: string | null;
}): AuthUser {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === input.userId);
  if (idx < 0) throw new Error("USER_NOT_FOUND");
  const target = users[idx];
  if (target.role !== "MUSEUM") throw new Error("NOT_MUSEUM");

  if (!input.museumName.trim()) throw new Error("MUSEUM_NAME_REQUIRED");
  if (!input.contact.trim()) throw new Error("CONTACT_REQUIRED");

  const next: AuthUser = {
    ...target,
    museumStatus: "PENDING_MUSEUM",
    museumName: input.museumName.trim(),
    contact: input.contact.trim(),
    proofFileName: input.proofFileName,
    updatedAt: nowIso(),
  };
  const updated = users.slice();
  updated[idx] = next;
  saveUsers(updated);
  return next;
}

export function deleteUser(userId: string) {
  const users = loadUsers();
  const next = users.filter((u) => u.id !== userId);
  if (next.length === users.length) throw new Error("USER_NOT_FOUND");
  saveUsers(next);
  const session = loadSession();
  if (session?.userId === userId) clearSession();
}
