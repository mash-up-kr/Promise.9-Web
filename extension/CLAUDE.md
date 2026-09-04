@../docs/conventions/extension.md

# 이 폴더에서 일할 때 (extension/)

- 명령은 반드시 이 폴더에서: `pnpm --filter promise9-extension <script>` 또는 `cd extension && pnpm ...`.
- **Expo / React Native / NativeWind 를 쓰지 않는다.** React 19 + Vite + Tailwind v4 (plain DOM).
- import 경로
  - `@/*` → `extension/src/*` (루트 `@/` 와 다른 대상이다 — 익스텐션은 루트 `src/` 를 import 하지 않는다)
  - `@shared/*` → 루트 `shared/*` (타입 · API 클라이언트 · 엔티티 쿼리 · 폴더 팔레트)
  - `@assets/*` → 루트 `assets/*` (캐릭터 이미지 · Pretendard)
- 테스트는 **vitest + @testing-library/react** (루트의 jest-expo 와 별개). `pnpm test`.
- 디자인 토큰은 `shared/styles/tokens.css` 단일 출처. 값을 여기서 다시 정의하지 않는다.
- 로컬 확인 방법은 `README.md` 참고.
