export type AuthRole = "SUPER_ADMIN" | "MUSEUM";

export type MuseumStatus = "PENDING_MUSEUM" | "APPROVED_MUSEUM" | "REJECTED_MUSEUM";

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
  museumStatus: MuseumStatus | null;
  museumName: string | null;
  contact: string | null;
  proofFileName: string | null;
  proofFileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
