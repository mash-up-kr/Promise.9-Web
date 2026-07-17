// 화면별(denormalized) 원본 데이터를 정규화 시드로 합친다.
// 입력: mocks/data/_raw/{home-recent,home-folders,categories}.json
// 출력: mocks/data/{links,folders}.json  (링크당 레코드 1개, 새 고유 id)
//
// 실행: node mocks/normalize.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const rawPath = (f) => join(dir, "data", "_raw", f);
const outPath = (f) => join(dir, "data", f);

function readRaw(file) {
  try {
    return JSON.parse(readFileSync(rawPath(file), "utf8"));
  } catch (err) {
    throw new Error(
      `원본 파일을 읽지 못했습니다: mocks/data/_raw/${file}\n  ${err.message}`,
    );
  }
}

const norm = (s) => (s ?? "").trim();
const FOLDER_COLOR = "blue"; // 이미지상 3개 폴더 전부 파랑

const homeRecent = readRaw("home-recent.json").data.links;
const homeFolders = readRaw("home-folders.json"); // { 폴더명: [링크] }
const byCategory = readRaw("categories.json"); // { 카테고리: [링크] }

// 1) 홈 소스에서 제목 → 폴더 / 제목 → 대표태그 를 뽑는다(대표 폴더·대표 태그는 홈 디자인을 따른다).
const titleToFolder = new Map();
const titleToRepTag = new Map();
for (const [folderName, links] of Object.entries(homeFolders)) {
  for (const l of links) {
    const t = norm(l.title);
    titleToFolder.set(t, folderName);
    if (l.representativeTag) titleToRepTag.set(t, norm(l.representativeTag));
  }
}
for (const l of homeRecent) {
  const t = norm(l.title);
  if (l.representativeTag && !titleToRepTag.has(t)) {
    titleToRepTag.set(t, norm(l.representativeTag));
  }
}

// 2) categories.json 을 마스터로(가장 풍부: url·요약·태그·메모). 제목으로 중복 제거.
// (카테고리 키는 저장하지 않는다 — 둘러보기는 링크 tags 로 파생)
const byTitle = new Map();
for (const links of Object.values(byCategory)) {
  for (const l of links) {
    const t = norm(l.title);
    if (!byTitle.has(t)) {
      byTitle.set(t, {
        title: t,
        url: l.url ?? null,
        source: l.source ?? null,
        thumbnailUrl: l.thumbnailUrl ?? null,
        publishedAt: l.publishedAt ?? null,
        savedAt: l.savedAt ?? null,
        aiSummary: l.aiSummary ?? null,
        memo: l.memo ?? null,
        tags: Array.isArray(l.tags) ? l.tags.map(norm) : [],
      });
    }
    // 같은 링크가 여러 카테고리에 있으면 첫 등장만 채택(카테고리 둘러보기는 tags 로 파생).
  }
}

// 3) 홈 최근저장 링크 중 마스터에 없는 것(고유 콘텐츠)을 추가한다.
for (const l of homeRecent) {
  const t = norm(l.title);
  if (byTitle.has(t)) {
    const rec = byTitle.get(t);
    if (!rec.thumbnailUrl) rec.thumbnailUrl = l.thumbnailUrl ?? null;
    continue;
  }
  const rep = norm(l.representativeTag);
  byTitle.set(t, {
    title: t,
    url: null,
    source: l.source ?? null,
    thumbnailUrl: l.thumbnailUrl ?? null,
    publishedAt: null,
    savedAt: l.savedAt ?? null,
    aiSummary: null,
    memo: null,
    tags: rep ? [rep] : [],
  });
}

// 4) 폴더(3개) — home-folders 순서대로 id·정렬 부여.
const folders = Object.keys(homeFolders).map((name, i) => ({
  folderId: i + 1,
  folderName: name,
  folderColor: FOLDER_COLOR,
  sortOrder: i,
}));
const folderIdByName = new Map(folders.map((f) => [f.folderName, f.folderId]));

// 5) 최종 LinkRecord — 새 고유 id, 폴더 resolve, 대표태그 결정.
let seq = 1;
const links = [...byTitle.values()].map((rec) => {
  const folderName = titleToFolder.get(rec.title) ?? null;
  const representativeTag = titleToRepTag.get(rec.title) ?? rec.tags[0] ?? null;
  return {
    linkId: seq++,
    url: rec.url,
    title: rec.title,
    source: rec.source,
    thumbnailUrl: rec.thumbnailUrl,
    savedAt: rec.savedAt,
    publishedAt: rec.publishedAt,
    folderId: folderName ? (folderIdByName.get(folderName) ?? null) : null,
    tags: rec.tags,
    representativeTag,
    processingStatus: "SUCCESS",
    aiSummary: rec.aiSummary,
    memo: rec.memo,
    isFavorite: false,
    relatedLinkIds: [],
    remindType: null,
    dominantColor: null,
    viewedAt: null,
    deletedAt: null,
  };
});

// 6) 보강 — 즐겨찾기 / 연관링크 / 최근 검색어
const catNames = new Set(Object.keys(byCategory));

// 6-1) 즐겨찾기 ~10개 (결정적 분산: id 1,11,21,...)
for (const l of links) if ((l.linkId - 1) % 10 === 0) l.isFavorite = true;

// 6-2) 연관링크 = 같은 태그 공유 링크 최대 3개
const tagIndex = new Map();
for (const l of links)
  for (const t of l.tags) {
    if (!tagIndex.has(t)) tagIndex.set(t, []);
    tagIndex.get(t).push(l.linkId);
  }
for (const l of links) {
  const seen = new Set([l.linkId]);
  const related = [];
  for (const t of l.tags) {
    for (const id of tagIndex.get(t) ?? []) {
      if (seen.has(id)) continue;
      seen.add(id);
      related.push(id);
      if (related.length >= 3) break;
    }
    if (related.length >= 3) break;
  }
  l.relatedLinkIds = related;
}

// 6-3) 최근 검색어 = 최빈 태그(카테고리명 제외) 상위 5
const freq = new Map();
for (const l of links)
  for (const t of l.tags) {
    if (catNames.has(t)) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
const recentKeywords = [...freq.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([t]) => t);

writeFileSync(outPath("links.json"), `${JSON.stringify(links, null, 2)}\n`);
writeFileSync(outPath("folders.json"), `${JSON.stringify(folders, null, 2)}\n`);
writeFileSync(
  outPath("search.json"),
  `${JSON.stringify({ recentKeywords }, null, 2)}\n`,
);

// 7) 통계
const perFolder = { 미분류: 0 };
for (const f of folders) perFolder[f.folderName] = 0;
for (const l of links) {
  const name =
    folders.find((f) => f.folderId === l.folderId)?.folderName ?? "미분류";
  perFolder[name] += 1;
}
console.log(`✅ links: ${links.length}, folders: ${folders.length}`);
console.log("   폴더별 링크 수:", perFolder);
