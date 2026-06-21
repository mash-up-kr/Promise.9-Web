# 네이티브 앱 E2E (Maestro)

웹 E2E(Playwright)와 분리된 **네이티브(iOS/Android)** E2E. Expo 공식 권장 도구.
배경/도구 선택 근거: [docs/conventions/testing.md](../docs/conventions/testing.md)

## 사전 요건 (1회)

1. **Maestro CLI** (시스템 설치, pnpm 아님):
   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   # 설치 후 PATH 추가: export PATH="$PATH:$HOME/.maestro/bin"
   ```
   - **Java 17+ 필요.** 시스템 기본이 Java 11 이면 Android Studio 번들 JDK 를 쓴다:
     ```bash
     export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
     ```
2. **dev build 설치된 시뮬레이터/에뮬레이터**:
   - iOS:   `pnpm expo run:ios`      (Xcode + CocoaPods 필요)
   - Android: `pnpm expo run:android`  (에뮬레이터 부팅 후)
   - 디버그 빌드는 Metro 가 떠 있어야 JS 를 로드한다 → `pnpm start` 를 함께 실행.

## 실행

```bash
pnpm test:e2e:app            # .maestro 하위 모든 플로우
maestro test .maestro/home.yaml   # 단일 플로우
maestro studio              # 셀렉터 탐색용 인터랙티브 도구
```

## 플로우 작성 메모

- `appId` 는 app.json 의 `ios.bundleIdentifier` / `android.package` 와 일치해야 한다 (현재 `com.mashup.promise9`).
- 셀렉터 우선순위: 보이는 텍스트 → `id`(RN 의 `testID`) 순. testID 남발 금지(웹 E2E·RNTL 과 동일 원칙).
