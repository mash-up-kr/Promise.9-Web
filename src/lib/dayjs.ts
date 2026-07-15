import "dayjs/locale/ko";
import dayjs from "dayjs";

dayjs.locale("ko");

/**
 * ko 로케일이 적용된 dayjs 의 단일 출처.
 * "dayjs" 를 직접 import 하면 로드 순서에 따라 설정이 빠질 수 있으므로 항상 이 모듈을 쓴다.
 */
export { dayjs };
