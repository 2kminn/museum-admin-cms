import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  ListChecks,
  MapPin,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { FileDropzone } from "../components/FileDropzone";
import {
  apiCreatePlace,
  apiDeletePlace,
  apiListPlaces,
  apiUpdatePlace,
  apiUploadPublicImage,
  type ApiPlace,
  type ApiPlaceInput,
} from "../lib/api";

type ViewMode = "list" | "create";

type PlaceFormValues = {
  title: string;
  category: string;
  location: string;
  hours: string;
  fee: string;
  phone: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_FORM: PlaceFormValues = {
  title: "",
  category: "",
  location: "",
  hours: "",
  fee: "",
  phone: "",
  description: "",
  imageUrl: "",
  isActive: true,
  sortOrder: "0",
};

function inputBaseClasses() {
  return "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
}

function textareaBaseClasses() {
  return "min-h-24 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
}

function labelClasses() {
  return "text-xs font-medium text-zinc-700 dark:text-zinc-300";
}

function errorMessage(error: unknown) {
  const message = error instanceof Error && error.message ? error.message : "";
  if (message.includes("422")) return "필수값을 확인해 주세요. 장소명, 지역구, 주소는 반드시 입력해야 합니다.";
  if (message === "UNSUPPORTED_UPLOAD_TYPE") return "대표 이미지는 jpg, png, webp, gif 파일만 업로드할 수 있습니다.";
  return message || "요청 처리 중 오류가 발생했습니다.";
}

function placeToForm(place: ApiPlace): PlaceFormValues {
  return {
    title: place.title,
    category: place.category,
    location: place.location,
    hours: place.hours ?? "",
    fee: place.fee ?? "",
    phone: place.phone ?? "",
    description: place.description ?? "",
    imageUrl: place.imageUrl ?? "",
    isActive: place.isActive,
    sortOrder: String(place.sortOrder ?? 0),
  };
}

function validatePlaceInput(input: PlaceFormValues) {
  if (!input.title.trim()) return "장소명을 입력해 주세요.";
  if (!input.category.trim()) return "지역구를 입력해 주세요.";
  if (!input.location.trim()) return "주소를 입력해 주세요.";
  return null;
}

function formToInput(form: PlaceFormValues, imageUrl: string): ApiPlaceInput {
  const sortOrder = Number.parseInt(form.sortOrder, 10);
  return {
    title: form.title,
    category: form.category,
    location: form.location,
    hours: form.hours,
    fee: form.fee,
    phone: form.phone,
    description: form.description,
    imageUrl,
    isActive: form.isActive,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-2 break-words text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {String(value ?? "").trim() ? value : "-"}
      </div>
    </div>
  );
}

function PlaceForm({
  form,
  setForm,
  imageFiles,
  setImageFiles,
  submitLabel,
  isSaving,
  onSubmit,
}: {
  form: PlaceFormValues;
  setForm: React.Dispatch<React.SetStateAction<PlaceFormValues>>;
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  submitLabel: string;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses()} htmlFor="place-title">
            장소명
          </label>
          <input
            id="place-title"
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            className={inputBaseClasses()}
            placeholder="예) 부산현대미술관"
          />
        </div>

        <div>
          <label className={labelClasses()} htmlFor="place-category">
            지역구
          </label>
          <input
            id="place-category"
            value={form.category}
            onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
            className={inputBaseClasses()}
            placeholder="예) 해운대구"
          />
        </div>
      </div>

      <div>
        <label className={labelClasses()} htmlFor="place-location">
          주소
        </label>
        <div className="relative mt-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="place-location"
            value={form.location}
            onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
            className={[inputBaseClasses(), "pl-10"].join(" ")}
            placeholder="예) 부산 해운대구 APEC로 58"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClasses()} htmlFor="place-hours">
            운영 시간
          </label>
          <input
            id="place-hours"
            value={form.hours}
            onChange={(e) => setForm((current) => ({ ...current, hours: e.target.value }))}
            className={inputBaseClasses()}
            placeholder="10:00 - 18:00"
          />
        </div>
        <div>
          <label className={labelClasses()} htmlFor="place-fee">
            관람료
          </label>
          <input
            id="place-fee"
            value={form.fee}
            onChange={(e) => setForm((current) => ({ ...current, fee: e.target.value }))}
            className={inputBaseClasses()}
            placeholder="무료 관람"
          />
        </div>
        <div>
          <label className={labelClasses()} htmlFor="place-phone">
            전화번호
          </label>
          <input
            id="place-phone"
            value={form.phone}
            onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
            className={inputBaseClasses()}
            placeholder="051-278-2345"
          />
        </div>
      </div>

      <div>
        <label className={labelClasses()} htmlFor="place-description">
          장소 설명
        </label>
        <textarea
          id="place-description"
          value={form.description}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          className={textareaBaseClasses()}
          placeholder="장소 설명을 입력해 주세요."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
        <div>
          <label className={labelClasses()} htmlFor="place-image-url">
            대표 이미지 URL
          </label>
          <input
            id="place-image-url"
            value={form.imageUrl}
            onChange={(e) => setForm((current) => ({ ...current, imageUrl: e.target.value }))}
            className={inputBaseClasses()}
            placeholder="이미지 업로드 시 public_url이 저장됩니다."
          />
        </div>
        <div>
          <label className={labelClasses()} htmlFor="place-sort-order">
            정렬 순서
          </label>
          <input
            id="place-sort-order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((current) => ({ ...current, sortOrder: e.target.value }))}
            className={inputBaseClasses()}
          />
        </div>
      </div>

      <FileDropzone
        label="대표 이미지 업로드"
        accept="image/jpeg,image/png,image/webp,image/gif"
        value={imageFiles}
        onChange={setImageFiles}
      />

      {form.imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <img src={form.imageUrl} alt="대표 이미지 미리보기" className="h-48 w-full object-cover" />
        </div>
      ) : null}

      <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-zinc-300"
        />
        앱 목록에 노출
      </label>

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <Save className="h-4 w-4" />
        {isSaving ? "저장 중" : submitLabel}
      </button>
    </form>
  );
}

export function EventManagementPage() {
  const [places, setPlaces] = useState<ApiPlace[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [createForm, setCreateForm] = useState<PlaceFormValues>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<PlaceFormValues>(EMPTY_FORM);
  const [createImageFiles, setCreateImageFiles] = useState<File[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [detailPlaceId, setDetailPlaceId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiPlace | null>(null);

  const sortedPlaces = useMemo(
    () =>
      [...places].sort((a, b) => {
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        return a.title.localeCompare(b.title, "ko-KR");
      }),
    [places],
  );

  const detailPlace = useMemo(
    () => places.find((place) => place.id === detailPlaceId) ?? null,
    [detailPlaceId, places],
  );

  const loadPlaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPlaces(await apiListPlaces());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlaces();
  }, []);

  const uploadImageIfNeeded = async (files: File[], fallbackUrl: string) => {
    if (files[0]) return apiUploadPublicImage(files[0]);
    return fallbackUrl.trim();
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    const validationError = validatePlaceInput(createForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const imageUrl = await uploadImageIfNeeded(createImageFiles, createForm.imageUrl);
      const created = await apiCreatePlace(formToInput(createForm, imageUrl));
      setPlaces((current) => [created, ...current.filter((place) => place.id !== created.id)]);
      setCreateForm(EMPTY_FORM);
      setCreateImageFiles([]);
      setViewMode("list");
      setDetailPlaceId(created.id);
      setIsEditing(false);
      setSavedMessage(`${created.title} 장소가 추가되었습니다.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onStartEdit = (place: ApiPlace) => {
    setEditForm(placeToForm(place));
    setEditImageFiles([]);
    setIsEditing(true);
    setError(null);
    setSavedMessage(null);
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailPlace) return;
    setError(null);
    setSavedMessage(null);

    const validationError = validatePlaceInput(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const imageUrl = await uploadImageIfNeeded(editImageFiles, editForm.imageUrl);
      const updated = await apiUpdatePlace(detailPlace.id, formToInput(editForm, imageUrl));
      setPlaces((current) => current.map((place) => (place.id === updated.id ? updated : place)));
      setIsEditing(false);
      setEditImageFiles([]);
      setSavedMessage(`${updated.title} 장소 정보가 수정되었습니다.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setSavedMessage(null);
    setIsDeleting(true);
    try {
      await apiDeletePlace(deleteTarget.id);
      setPlaces((current) => current.filter((place) => place.id !== deleteTarget.id));
      setDetailPlaceId(null);
      setIsEditing(false);
      setDeleteTarget(null);
      setSavedMessage(`${deleteTarget.title} 장소가 삭제되었습니다.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="장소 삭제"
        message={deleteTarget ? `${deleteTarget.title} 장소를 삭제하시겠습니까? 앱 목록에서도 사라집니다.` : ""}
        confirmText={isDeleting ? "삭제 중" : "삭제"}
        cancelText="취소"
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!isDeleting) void onConfirmDelete();
        }}
      />

      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">장소 관리</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          안드로이드 앱에 노출할 미술관/문화공간 장소 데이터를 관리합니다.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-950 sm:w-[22rem]">
          <button
            type="button"
            onClick={() => {
              setViewMode("list");
              setDetailPlaceId(null);
              setIsEditing(false);
              setError(null);
            }}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold",
              viewMode === "list"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
            ].join(" ")}
          >
            <ListChecks className="h-4 w-4" />
            장소 목록
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("create");
              setDetailPlaceId(null);
              setIsEditing(false);
              setSavedMessage(null);
              setError(null);
            }}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold",
              viewMode === "create"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
            ].join(" ")}
          >
            <Plus className="h-4 w-4" />
            장소 등록
          </button>
        </div>

        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          총 {sortedPlaces.length}개 장소
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      {savedMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {savedMessage}
        </div>
      ) : null}

      {viewMode === "create" ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">장소 기본 정보</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                장소명, 지역구, 주소는 필수입니다.
              </div>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <PlaceForm
            form={createForm}
            setForm={setCreateForm}
            imageFiles={createImageFiles}
            setImageFiles={setCreateImageFiles}
            submitLabel="장소 추가"
            isSaving={isSaving}
            onSubmit={onCreate}
          />
        </section>
      ) : detailPlace ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  setDetailPlaceId(null);
                  setIsEditing(false);
                  setError(null);
                }}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                목록으로
              </button>
              <h2 className="mt-4 break-words text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {detailPlace.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span>{detailPlace.category}</span>
                <span>{detailPlace.isActive ? "앱 노출" : "비노출"}</span>
                <span>ID {detailPlace.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditImageFiles([]);
                    setError(null);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  <X className="h-4 w-4" />
                  취소
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(detailPlace)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-50 dark:border-rose-900/50 dark:bg-zinc-950 dark:text-rose-200 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartEdit(detailPlace)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    <Edit3 className="h-4 w-4" />
                    수정
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-6">
              <PlaceForm
                form={editForm}
                setForm={setEditForm}
                imageFiles={editImageFiles}
                setImageFiles={setEditImageFiles}
                submitLabel="수정 저장"
                isSaving={isSaving}
                onSubmit={onSaveEdit}
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-[18rem_1fr]">
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                {detailPlace.imageUrl ? (
                  <img src={detailPlace.imageUrl} alt={detailPlace.title} className="h-60 w-full object-cover" />
                ) : (
                  <div className="flex h-60 w-full items-center justify-center text-zinc-400">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow label="지역구" value={detailPlace.category} />
                <DetailRow label="정렬 순서" value={detailPlace.sortOrder} />
                <DetailRow label="주소" value={detailPlace.location} />
                <DetailRow label="전화번호" value={detailPlace.phone} />
                <DetailRow label="운영 시간" value={detailPlace.hours} />
                <DetailRow label="관람료" value={detailPlace.fee} />
                <div className="md:col-span-2">
                  <DetailRow label="대표 이미지 URL" value={detailPlace.imageUrl} />
                </div>
                <div className="md:col-span-2">
                  <DetailRow label="장소 설명" value={detailPlace.description} />
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">등록된 장소</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                장소 카드를 선택하면 상세 정보를 확인할 수 있습니다.
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadPlaces()}
              disabled={isLoading}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              {isLoading ? "불러오는 중" : "새로고침"}
            </button>
          </div>

          {isLoading ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              장소 목록을 불러오고 있습니다.
            </div>
          ) : sortedPlaces.length === 0 ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              등록된 장소가 없습니다.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {sortedPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => {
                    setDetailPlaceId(place.id);
                    setIsEditing(false);
                    setError(null);
                    setSavedMessage(null);
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <div className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                      {place.imageUrl ? (
                        <img src={place.imageUrl} alt={place.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {place.title}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {place.category} · 정렬 {place.sortOrder ?? 0}
                          </div>
                        </div>
                        {place.isActive ? (
                          <Eye className="h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <EyeOff className="h-5 w-5 shrink-0 text-zinc-400" />
                        )}
                      </div>
                      <div className="mt-3 flex items-start gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2 break-words">{place.location}</span>
                      </div>
                      {place.isActive ? (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          앱 노출
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
