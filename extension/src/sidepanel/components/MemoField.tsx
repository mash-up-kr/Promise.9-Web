import clsx from "clsx";

/** 서버는 1000자까지 허용하지만 Figma 스펙상 300자로 더 좁게 제한한다(앱과 같은 값). */
export const MEMO_MAX_LENGTH = 300;

export interface MemoFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * 메모 입력.
 *
 * 사이드패널은 세로가 창 높이만큼이라 팝업 시안의 3줄 고정으로는 아래가 휑하게 빈다.
 * 남는 세로 공간을 메모가 쓰도록 늘려서, 긴 메모도 스크롤 없이 보이게 한다.
 */
export function MemoField({ value, onChange, className }: MemoFieldProps) {
  return (
    <section className={clsx("flex min-h-30 flex-col", className)}>
      <h2 className="text-heading-3 text-text-strong">메모</h2>
      <div className="mt-3 flex flex-1 flex-col rounded-2xl bg-background-list p-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={MEMO_MAX_LENGTH}
          placeholder="저장한 이유나 기억하고 싶은 점을 적어보세요"
          aria-label="메모"
          className="w-full flex-1 resize-none bg-transparent text-body-2-reading text-text-normal outline-none placeholder:text-text-assistive"
        />
        <p className="text-right text-caption-2 text-text-assistive">
          {value.length}/{MEMO_MAX_LENGTH}
        </p>
      </div>
    </section>
  );
}
