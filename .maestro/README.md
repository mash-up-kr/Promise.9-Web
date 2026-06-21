# 네이티브 앱 E2E (Maestro)

웹 E2E(Playwright)와 분리된 **네이티브(iOS/Android)** E2E. Expo 공식 권장 도구.
배경/도구 선택 근거: [docs/conventions/testing.md](../docs/conventions/testing.md)

## 사전 요건 (1회)

> 아래는 **네이티브 E2E 를 로컬에서 돌리는 사람만** 해당. 웹 E2E(Playwright)·unit/integration(jest)만 한다면 Java·dev build·시뮬레이터 모두 불필요.

1. **Maestro CLI** (시스템 설치, pnpm 아님):
   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   # 설치 후 PATH 추가: export PATH="$PATH:$HOME/.maestro/bin"
   ```
   - **Java 17+ 필요** (Gradle·Maestro 공통). 확보 방법은 아무거나 — 목적은 "Java 17 을 JAVA_HOME 으로":
     - 이미 기본 Java 가 17+ 면 **추가 설정 불필요**.
     - macOS + Android Studio 사용 시 번들 JDK 재사용:
       ```bash
       export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
       ```
     - 또는 직접 설치: `brew install openjdk@17` · sdkman(`sdk install java 17-tem`) 등.
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
