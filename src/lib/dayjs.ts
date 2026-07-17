import "dayjs/locale/ko";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.locale("ko");
// 서버가 내려주는 ISO 8601 캘린더 날짜(예: savedAt)를 로컬 타임존으로 변환 없이
// 그대로 다루기 위한 플러그인 — dayjs.utc() 로 파싱하면 기기 타임존과 무관하게 날짜가 유지된다.
dayjs.extend(utc);

/**
 * ko 로케일이 적용된 dayjs 의 단일 출처.
 * "dayjs" 를 직접 import 하면 로드 순서에 따라 설정이 빠질 수 있으므로 항상 이 모듈을 쓴다.
 */
export { dayjs };
