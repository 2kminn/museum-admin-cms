import { Link } from "react-router-dom";

export function LocationsArtworksPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">장소 및 작품 설정</h1>
          <p className="mt-1 text-sm text-zinc-600">AR 스팟(장소)과 연결 작품/템플릿을 구성합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/artworks/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            작품 등록
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-900">장소 목록</div>
          <div className="mt-2 text-sm text-zinc-600">지도 기반 장소 등록/수정 UI가 들어갈 영역입니다.</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">작품/템플릿</div>
          <div className="mt-2 text-sm text-zinc-600">장소별로 노출될 콘텐츠를 매핑합니다.</div>
          <div className="mt-3">
            <Link
              to="/artworks/new"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              작품 등록 및 수정
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
