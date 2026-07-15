# new-form — 선택 패턴

기본 템플릿(SKILL.md)으로 부족할 때만 꺼내 쓴다.

## 크로스 필드 검증 (refine)

필드 간 의존성이 있는 검증은 스키마에 둔다. 에러를 특정 필드에 붙이려면 `path` 를 지정한다.

```ts
export const SignUpSchema = z
  .object({
    password: z.string().min(8, '8자 이상 입력해 주세요.'),
    passwordConfirm: z.string(),
  })
  .refine((form) => form.password === form.passwordConfirm, {
    error: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });
```

## 서버 에러를 필드에 매핑 (setError)

서버가 특정 필드의 문제를 알려줄 때(예: 중복 이메일)는 전역 에러 대신 해당 필드에 붙인다.

```tsx
const { setError } = useForm<SignUpFormValues>(/* ... */);
const { mutate: signUp } = useSignUpMutation();

const onSubmit = handleSubmit((form) =>
  signUp(form, {
    onError: (error) => {
      if (isApiError(error) && error.response.data.code === 'DUPLICATE_EMAIL') {
        setError('email', { message: '이미 사용 중인 이메일입니다.' });
      }
    },
  }),
);
```

## 동적 필드 배열 (useFieldArray)

항목 추가/삭제가 있는 반복 입력. `key` 는 index 가 아니라 `field.id` 를 쓴다.

```tsx
const { fields, append, remove } = useFieldArray({ control, name: 'tags' });

{fields.map((field, index) => (
  <Controller
    key={field.id}
    control={control}
    name={`tags.${index}.value`}
    render={/* ... */}
  />
))}
```
