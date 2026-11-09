# 클라이언트 이벤트 수집 명세

앱·웹·크롬 익스텐션에서 수집하는 이벤트의 발생 조건, 속성, 전송 정책을 정리한다. 이를 바탕으로 확인할 핵심 지표와 주 퍼널도 함께 정리한다.

`화면·사용자 동작 → trackEvent → 공통 필드 결합 → 메모리 큐 → Firehose → S3`

## 1. 수집 이벤트

| 이벤트 | 수집 플랫폼 | 발생 조건 | `custom_data` |
| --- | --- | --- | --- |
| `in` | 앱·웹·익스텐션 | 앱 런타임·웹 문서·익스텐션 패널의 최초 진입. 웹 새로고침 제외 | `{}` |
| `reload` | 웹 | 새로고침으로 문서가 시작될 때 `in` 대신 기록 | `{}` |
| `page_view` | 앱·웹·익스텐션 | 다른 화면으로 이동하거나 탭·앱이 숨겨질 때, 그동안 머문 시간을 기록 | `screen_name`, `screen_view_id`, `path`, `duration_ms` |
| `component_clicked` | 앱·웹·익스텐션 | 추적을 연결한 활성 버튼의 클릭·탭 | `label`, `screen_name`, `screen_view_id`, 호출부 추가 속성 |
| `component_impression` | 앱·웹·익스텐션 | 사용자가 보고 있는 화면에서 대상 면적의 40% 이상이 연속 1초 보일 때 | `label`, `screen_name`, `screen_view_id`, 호출부 추가 속성 |
| `link_saved` | 앱·웹 | 링크 저장 시트의 링크 생성 API 성공 후 | `link_id`, `entry_point: "create_link_sheet"` |
| `login_completed` | 앱·웹 | 소셜 로그인 API 성공 및 토큰 저장 완료 후 | `provider` |
| `signup_completed` | 앱·웹 | 로그인 완료 응답이 `isNewUser: true`일 때 추가 기록 | `provider` |

## 2. 이벤트별 수집 규칙

### 진입과 페이지뷰

- 내부 라우팅·로그인·앱 복귀는 새로운 `in`이 아니다. 수집 런타임이 새로 만들어지면 새로운 실행으로 본다.
- 웹은 navigation 유형이 `reload`일 때만 `reload`로 구분한다. 판별 정보가 없으면 `in`으로 기록한다.
- 화면이 보이기 시작하면 경로·`screen_view_id`·시작 시각을 기억한다. 다른 화면으로 이동하거나 탭·앱이 숨겨지면 머문 시간을 계산해 `page_view`를 기록한다.
- 화면이 숨겨진 동안에는 체류 시간을 재지 않는다. 다시 보이면 새로운 `screen_view_id`를 만들고 체류 시간을 처음부터 잰다.
- `occurred_at`은 화면을 떠나거나 숨긴 시각이고, `duration_ms`는 화면이 보이기 시작한 때부터 그 시각까지의 시간이다. 같은 화면에서도 다른 탭을 봤다가 돌아오면 별도의 `page_view`가 기록되므로 화면 진입 횟수와 건수가 다를 수 있다.
- 화면이 처음부터 숨겨져 있으면 체류 시간을 측정하지 않는다. 화면이 보이기 시작하면 측정을 시작한다.
- 앱 강제 종료 등으로 마지막 체류 시간을 기록할 기회가 없으면 마지막 `page_view`가 누락될 수 있다.

### 클릭과 노출

현재 연결된 버튼은 다음과 같다.

| 플랫폼 | 대상 | `label` |
| --- | --- | --- |
| 앱·웹 | 지원되는 소셜 로그인 버튼 | `login.google`, `login.kakao`, `login.apple` |
| 앱·웹 | 링크 저장 시트의 저장 버튼 | `link.save` |
| 익스텐션 | 웹 로그인 열기 버튼 | `login.open_web` |
| 익스텐션 | 저장 버튼 | `link.save` |

- 앱·웹은 `withTracking`, 익스텐션은 `useTrack`으로 연결한 대상만 수집한다. 전체 버튼을 자동 수집하지 않는다.
- 빈 라벨·비활성 버튼·수집 비활성 상태에서는 기록하지 않는다. 저장 중인 버튼도 수집을 중단한다.
- 노출은 마운트당 한 번이다. 큐가 이벤트를 수락하면 관찰을 멈추고, 재렌더링·화면 복귀만으로 다시 기록하지 않는다. 새로 마운트하면 다시 판정한다.
- 웹·익스텐션은 연속 노출 판정 로직을 공유한다. 각 플랫폼에서 IntersectionObserver를 공유하며, 노출 조건을 충족하는 대상별 일회성 타이머를 사용한다. 보이는 면적이 40% 미만이 되거나 화면이 숨겨지면, 다음에 조건을 충족했을 때부터 1초를 다시 센다.
- 네이티브는 대상별로 250ms마다 위치를 측정한다. 전체 화면 기준이며 부모 영역에 의해 잘린 부분은 반영하지 않는다. 현재 목록 항목에는 연결하지 않았다.
- 클릭이 1초 이내에 발생하면 클릭 이벤트만 있고 노출 이벤트는 없을 수 있다.

### 완료 이벤트

- `link_saved`는 `useCreateLinkMutation`의 훅 옵션 `onSuccess`에 연결한다. 저장 응답이 오기 전에 시트가 닫혀도, 요청이 성공하면 이벤트를 기록한다.
- API 실패·중복 저장 응답에서는 `link_saved`를 기록하지 않는다. 별도의 저장 시도 이벤트는 없으며 버튼 클릭으로 확인한다.
- 기존 회원은 `login_completed`만, 신규 회원은 `login_completed`와 `signup_completed`를 기록한다. 인증·토큰 저장 실패 시 둘 다 기록하지 않는다.
- 서버에서 가입이 끝난 뒤 응답이 유실되면 다시 시도한 로그인은 기존 회원으로 기록돼 `signup_completed`가 빠질 수 있다. 정확한 가입 수는 서버의 회원 수로 확인한다.
- 완료 이벤트는 `{ flushSoon: true }`로 전송을 요청한다. 전송 완료를 기다리지 않고 서비스 처리를 이어간다.
- 익스텐션은 저장 버튼 클릭까지 수집하며, 저장 성공 시 `link_saved`를 기록하는 연결이 아직 없다. 익스텐션의 저장 완료 전환율을 보려면 이 이벤트를 추가해야 한다.
- 익스텐션에서 연 웹의 로그인 완료는 웹 이벤트로 기록된다. 익스텐션 진입부터 웹 로그인까지 연결하려면 서로 다른 실행 세션을 연결하는 기준이 필요하다.
- iOS 공유 확장과 Android 공유 화면의 저장·로그인·가입 완료 이벤트는 아직 연결하지 않았다. 두 화면은 앱 루트의 분석 Provider 밖에서 따로 실행된다.

## 3. 공통 필드·식별자·UTM

전송 이벤트에는 다음 14개 키가 포함된다.

`schema_version`, `event_id`, `occurred_at`, `event_name`, `source`, `environment`, `anonymous_id`, `user_id`, `session_id`, `os`, `browser`, `client_version`, `utm`, `custom_data`

- `source`는 `app`·`web`·`extension`, `environment`는 `development`·`production`이다.
- `custom_data`는 호출할 때 JSON 객체, 전송할 때 JSON 문자열이다. 생략하면 `"{}"`로 전송한다.
- `anonymous_id`는 로컬 저장소에서 복구한다. 이전에 식별된 회원의 로그아웃·계정 전환 시 새 익명 ID로 분리한다.
- `session_id`는 수집기 초기화 시 새로 만든다. 앱 재실행·웹 새로고침·익스텐션 패널 재실행 후에는 이전 세션 ID를 재사용하지 않는다. 일정 시간이 지났다는 이유만으로 세션을 바꾸지는 않는다.
- 회원 확인 전·동기화 중에는 `user_id`가 `null`일 수 있다. 로그인 완료 이벤트도 회원 조회보다 먼저 발생할 수 있으며, 과거 이벤트에 회원 ID를 소급해서 채우지 않는다.
- 초기화 전에 받은 이벤트는 큐에 보관하고 초기화 시 비어 있는 익명·세션 ID를 보완한다. 나머지 필드는 이벤트를 기록했을 때의 값을 유지한다.

### UTM

- 이벤트의 `utm`은 `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` 객체 또는 `null`이다. 객체 안의 값은 문자열 또는 `null`이다.
- 앱·웹은 URL·딥링크의 UTM을 수집한다. UTM 없는 이동은 기존 유입 정보를 유지한다.
- 익스텐션은 서버에서 현재 회원의 유입 정보를 조회하거나 로컬 저장소에 저장된 값을 읽으며, 브라우징 중인 모든 페이지의 UTM을 자동 수집하지 않는다.
- 로그인 상태 변경 시 `GET /users/me/attribution`으로 사용자·UTM을 확인하고, 아직 서버에 반영하지 않은 유입 정보는 `PATCH /users/me/attribution`으로 보낸다.
- `touch_id`와 `captured_at`은 동기화용이며 전송 이벤트에는 포함하지 않는다.
- 이벤트 큐와 달리 식별자와 아직 서버에 반영하지 않은 유입 정보는 로컬 저장소에 보관한다.

## 4. 큐와 전송 정책

| 항목 | 정책 |
| --- | --- |
| 큐 | 메모리 최대 1,000건. 가득 차면 새 이벤트 거절 |
| 기본 전송 | 대기 이벤트가 있으면 5초 후 전송. 100건 도달 시 즉시 전송 시도 |
| 즉시 전송 | `flushSoon` 또는 `flush()` 사용. 진행 중인 요청은 중복 실행하지 않음 |
| 배치 | 최대 500건, UTF-8 데이터 합계 `3 MiB - 64 KiB` 이하 |
| 단일 이벤트 | UTF-8 기준 1,000 KiB 초과 시 전송에서 제외 |
| 요청 제한 시간 | 5초. 시간 초과 시 취소 신호 전달 |
| 요청 전체 실패 | 큐에 남겨 같은 이벤트 ID로 재시도 |
| 성공 응답의 부분 실패 | 개별 레코드 실패는 검사·재전송하지 않음 |
| 탭·앱이 숨겨질 때 | 마지막 체류 시간을 `page_view`로 기록하고 대기 이벤트 전송 시도. 화면이 다시 보일 때까지 주기 전송 중단 |
| 브라우저 keepalive | 지원 환경에서 SDK가 만든 최종 요청 본문 64KiB 이하에만 적용 |

`trackEvent()`가 `true`를 반환하면 이벤트가 전송 대기열에 들어간 것이다. Firehose 전송·S3 저장까지 완료됐다는 뜻은 아니다. 재시도 과정에서 중복 적재가 가능하므로 조회 시 `event_id` 기준 중복 제거가 필요하다.

새로고침·강제 종료·패널 종료 후 미전송 큐는 복구하지 않는다. keepalive도 종료 시 전송 완료를 보장하지 않는다.

## 5. 새 이벤트 추가 방법

1. `analytics.events.ts`에 이름·속성 타입을 정의하고 이 문서에 발생 조건과 수집 플랫폼을 추가한다.
2. 실제 동작을 책임지는 화면·훅에 한 번만 연결한다. 클릭과 완료를 구분하고 서비스 성공 여부를 먼저 판단한다.
3. 사용자·세션·UTM·AWS 처리는 공통 코어에 맡긴다. 공유 엔티티가 분석 모듈을 직접 의존하게 만들지 않는다.
4. 성공·실패·중복·화면 해제 조건을 테스트한다. 노출 이벤트는 비율·시간·숨김·재마운트 조건도 확인한다.
5. 해당 플랫폼에서 실제 동작을 수행하고 개발 이벤트의 전송·적재를 확인한다.

### 완료 이벤트 기록

실제 동작이 성공한 경로에서 기록한다. 아래 코드는 API 사용 예시이며, 현재 링크 저장 시트에는 이미 연결되어 있으므로 중복 추가하지 않는다.

```tsx
import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import { useAnalytics } from "@/components/analytics/AnalyticsContext";

const { trackEvent } = useAnalytics();

trackEvent(
  {
    event_name: ANALYTICS_EVENTS.LINK_SAVED,
    custom_data: {
      link_id: createdLink.linkId,
      entry_point: "create_link_sheet",
    },
  },
  { flushSoon: true },
);
```

`useAnalytics()`는 컴포넌트 또는 훅 안에서 호출한다. `trackEvent` 호출에는 공통 사용자·세션·UTM 필드를 직접 넣지 않는다.

### 버튼 클릭·노출 연결

HOC는 모듈 최상위에서 한 번 만든다. 아래 버튼을 렌더하는 컴포넌트는 분석 Provider 아래에 있어야 한다.

```tsx
import { Pressable } from "react-native";
import { withTracking } from "@/components/analytics/withTracking";

const TrackedPressable = withTracking(Pressable);

// 컴포넌트의 JSX 안에서 사용한다.
<TrackedPressable
  tracking={{
    label: "home.save",
    custom_data: { link_id: linkId },
  }}
  disabled={isSaving}
  onPress={save}
/>
```

`tracking.disabled`는 수집만 끄고, 컴포넌트의 `disabled`는 버튼 동작과 수집을 함께 끈다. 커스텀 컴포넌트를 감쌀 때는 `onPress`와 측정 가능한 ref를 실제 요소로 전달해야 한다. 익스텐션은 `useTrack(label, options)`에서 받은 ref를 버튼에 연결한다.

## 6. 환경 설정과 검증

앱·웹은 `EXPO_PUBLIC_ANALYTICS_*`, 익스텐션은 `VITE_ANALYTICS_*` 환경변수를 사용한다.

- `ENABLED=true`일 때 수집한다. 기본값은 비활성이다.
- `ENVIRONMENT`, `REGION`, `IDENTITY_POOL_ID`, `STREAM_NAME`을 설정한다.
- 앱에 고정 AWS 비밀 키를 넣지 않고 Cognito 임시 자격 증명을 사용한다.
- 테스트 데이터는 `environment=development`로 보내고 운영 지표에서 제외한다.
- 검증은 큐 수락, 전송 요청 성공, S3 적재 확인을 구분한다. S3 조회 시 Firehose 버퍼 지연을 고려한다.

## 7. 구현 위치

| 위치 | 책임 |
| --- | --- |
| `shared/analytics/analytics.events.ts` | 이벤트 이름과 이벤트별 속성 타입 |
| `shared/analytics/analytics.schema.ts` | 공통 필드와 JSON 입력 검사 |
| `shared/analytics/analytics.client.ts`, `analytics.queue.ts` | 큐·배치·전송·재시도 |
| `shared/analytics/analytics.runtime.ts`, `identity/` | 식별자 복구와 사용자·UTM 동기화 |
| `shared/analytics/analytics.screen.ts` | 화면이 보인 시간 측정과 페이지뷰 기록 |
| `shared/analytics/analytics.impression.ts` | 웹·익스텐션의 순수 노출 판정 |
| `shared/analytics/adapters/firehose.ts` | Cognito 임시 자격 증명과 Firehose 전송 |
| `shared/entities/user/user.attribution.contracts.ts` | 사용자·UTM API 계약 |
| `src/components/analytics`, `src/hooks`, `src/lib/analytics` | 앱·웹의 React·라우터·플랫폼 연결 |
| `extension/src/analytics` | 익스텐션 패널·DOM·Chrome 저장소 연결 |

공유 코어는 DOM·React Native·Chrome API를 직접 사용하지 않는다. 플랫폼의 활성 상태와 브라우저 keepalive 지원 여부는 각 플랫폼에서 확인해 전달한다. 앱은 SDK 기본 전송 핸들러를 사용한다.

## 8. 수집 지표와 주 퍼널 (제안)

> 아래 지표 정의는 수집 이벤트로 계산할 수 있는 기준을 제안한 것이다. 확정 전에 바뀔 수 있다.

주 퍼널은 **서비스 진입 → 로그인 / 회원가입 → 링크 저장**이다. 로그인과 회원가입은 순차 단계가 아니라 기존 회원·신규 회원의 구분이다.

| 단계 | 기준 이벤트 |
| --- | --- |
| 서비스 진입 | `in` 또는 웹 새로고침의 `reload` |
| 로그인 / 회원가입 | `login_completed`. `signup_completed`가 함께 발생하면 신규 가입으로 구분 |
| 링크 저장 | 인증 완료 이후 `link_saved` |

- 같은 `session_id + anonymous_id` 안에서 발생 순서대로 연결하고, 같은 단계가 반복되어도 세션당 한 번만 센다. 신규 가입자의 두 완료 이벤트도 인증 단계에서는 한 번만 센다.
- 이미 로그인된 방문은 인증 단계를 거치지 않으므로 `진입 → 링크 저장`으로 별도 확인한다.

| 핵심 지표 | 집계 기준 |
| --- | --- |
| 회원 DAU | KST 하루 동안 활동한 고유 `user_id` 수. 플랫폼별·플랫폼 통합으로 확인 |
| 익명 활동 | 회원 ID가 확인되지 않은 고유 `anonymous_id` 수. 회원 DAU와 별도 표시 |
| 단계별 전환율 | 다음 단계 도달 세션 / 이전 단계 도달 세션 |
| 전체 전환율 | 저장까지 도달한 세션 / 진입 세션 |
| 단계별 이탈 | 조회 기간이 끝날 때까지 다음 단계 이벤트가 기록되지 않은 세션 |

활동은 노출을 제외한 수집 이벤트가 발생한 경우로 본다. `event_id`로 중복 제거하고, 운영 지표는 `production`만 집계한다. 날짜·플랫폼·로그인 제공자·UTM별로 나눠 확인한다.
