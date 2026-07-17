# UT mock 원본 데이터 (raw)

정규화 스크립트 `mocks/normalize.mjs` 의 **입력**입니다. 아래 3개 파일을 그대로 저장해 주세요.
(제가 손으로 옮기면 긴 URL·제목이 깨질 수 있어, 원본을 그대로 받습니다.)

## 넣어야 할 파일 (당신이 준 blob → 저장 파일명)

| 당신이 준 데이터 | 저장 파일명 | 형태 |
|---|---|---|
| 홈 "최근저장 링크" (`recent-links.json`) | `home-recent.json` | `{ "success": true, "data": { "links": [...] } }` |
| 홈 "마지막으로 저장한 폴더" | `home-folders.json` | `{ "매쉬업 활동": [...], "제주도 여행": [...], "위시리스트": [...] }` |
| 카테고리 "카테고리 관련 데이터" | `categories.json` | `{ "여행": [...], "장소": [...], ... }` (링크에 `folder` 필드 포함) |

> "최근 검색어 관련 데이터" blob 은 **넣지 않아도 됩니다** — `categories.json`(전체 링크·카테고리) + `home-folders.json`(폴더 소속)로 커버됩니다.

## 정규화 실행

```bash
node mocks/normalize.mjs
```

→ `mocks/data/links.json`, `mocks/data/folders.json` 생성.

- **linkId 충돌은 제목(title) 기준으로 자동 정리** — 최종 링크마다 새 고유 id 재부여.
- 폴더 소속 = `home-folders.json` 의 3개 폴더(제목 매칭). 나머지 링크 = 미분류.
- 카테고리 = `categories.json` 키 → 링크 `tags` 로 둘러보기.
- 새 링크(홈 최근)만 있고 카테고리에 없는 항목은 미분류 + representativeTag 만 태그로.
