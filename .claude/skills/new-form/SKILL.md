---
name: new-form
description: react-hook-form + zod 폼을 팀 컨벤션대로 스캐폴드한다. Use when creating a form or adding input validation (예:"폼 만들어줘", "입력 검증 추가해줘", "로그인 폼 구현"). 서버 상태 조회는 /new-query, 검색어 하나 같은 단순 로컬 입력(useState 1개)·익스텐션 코드에는 사용하지 않는다.
---

# new-form — 폼 (앱/웹)

## 먼저
- **`/check-dup` 를 먼저 수행**(이미 했으면 생략). 같은 도메인 스키마·폼이 있으면 재사용한다.
- **TDD**: `/new-test` 의 컴포넌트 통합 패턴(userEvent)으로 "입력 → 제출 → 단언" 실패 테스트부터 쓴다.

## 위치 / 네이밍
- zod 스키마: `src/features/<기능>/api/<도메인>.contracts.ts` — 스키마는 `XxxSchema`, 타입은 `z.infer` 로 도출한 `XxxFormValues`.
- 폼 컴포넌트: `src/features/<기능>/components/` (컴포넌트 규칙은 `/new-component`).

## 규칙
1. **검증은 zod 스키마 + `zodResolver`** 로 폼 단위 정의가 기본. 필드 간 의존성 없는 단발 검증만 개별 validate — 기준은 good-code "폼 응집도" 절.
2. **타입은 `z.infer`** 로 스키마에서 도출한다. 스키마와 별도로 폼 타입을 손으로 다시 쓰지 않는다.
3. **입력 연결은 `Controller`** 로 한다. RN 의 `TextInput` 은 DOM ref 가 없어 `register()` 가 동작하지 않는다.
4. **`defaultValues` 를 항상 명시**한다. RN 은 uncontrolled 입력이 없어 값이 `undefined` 로 시작하면 controlled 전환 경고가 난다.
5. **제출은 mutation 훅**(`/new-query` 의 `useXxxMutation`)으로 보내고, `isPending` 동안 제출 버튼을 비활성화한다.
6. **에러는 두 층으로 구분**한다: 필드 에러(`formState.errors.<필드>`)는 해당 입력 아래, 서버 에러(mutation `error`)는 폼 상단/토스트 — 섞지 않는다.

## 템플릿

`link.contracts.ts`:
```ts
import { z } from 'zod';

export const CreateLinkSchema = z.object({
  url: z.url('올바른 URL 을 입력해 주세요.'),
  title: z.string().min(1, '제목을 입력해 주세요.'),
});

export type CreateLinkFormValues = z.infer<typeof CreateLinkSchema>;
```

폼 컴포넌트:
```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { Input, InputField } from '@/components/ui/input/Input';

import { CreateLinkSchema, type CreateLinkFormValues } from '../api/link.contracts';
import { useCreateLinkMutation } from '../api/link.queries';

export function CreateLinkForm() {
  const { control, handleSubmit, formState } = useForm<CreateLinkFormValues>({
    resolver: zodResolver(CreateLinkSchema),
    mode: 'onTouched',
    defaultValues: { url: '', title: '' },
  });
  const { mutate: createLink, isPending, error } = useCreateLinkMutation();

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="url"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input>
            <InputField value={value} onChangeText={onChange} onBlur={onBlur} />
          </Input>
        )}
      />
      {formState.errors.url && (
        <Text className="text-sm">{formState.errors.url.message}</Text>
      )}

      <Pressable disabled={isPending} onPress={handleSubmit((form) => createLink(form))}>
        <Text>저장</Text>
      </Pressable>
    </View>
  );
}
```

## 더 필요할 때 (references/patterns.md)
크로스 필드 검증(`refine`) · 서버 에러를 필드에 매핑(`setError`) · 동적 필드 배열(`useFieldArray`) 은 [references/patterns.md](references/patterns.md) 를 보고 추가한다.

> Controller 보일러플레이트를 줄이는 FormField 래퍼는 **아직 만들지 않는다** — 실제 폼이 2~3개 쌓여 반복이 확인되면 그때 추출한다.

작성 후 `pnpm test` 로 red → green 확인, `pnpm check` 로 lint 확인.
