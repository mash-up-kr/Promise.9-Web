---
name: pr
description: |
  Creates a GitHub Pull Request by analyzing branch changes and filling in the project PR template.
  TRIGGER when: user invokes /pr directly, or says 'PR 만들어줘', 'PR 작성해줘'.
---

# PR 생성

현재 브랜치의 변경사항을 분석하여 프로젝트 PR 템플릿(.github/PULL_REQUEST_TEMPLATE.md)에 맞는 Pull Request를 생성합니다.

## 작업 절차

1. `git branch --show-current` 로 브랜치명을 확인하고 **이슈 번호를 추출**한다.
   - 브랜치명 패턴 `feature/#30`, `fix/#12` 등에서 `#` 뒤 숫자가 이슈 번호.
   - **이슈 번호가 없으면(브랜치에 `#번호` 패턴이 없음) 묻지 말고 이슈 번호 없이 작성한다.**
2. `git log <base>...HEAD --oneline` 과 `git diff <base>...HEAD` 로 변경사항 전체를 파악한다.
3. 아래 형식으로 제목/본문을 작성한다.
4. push가 필요하면 먼저 push한 뒤 `gh pr create` 로 생성한다.

## 제목 형식

```
<Type>/#<이슈번호> - <한 줄 요약 (한글)>
```

- 예: `Feature/#30 - favicon, ogimage 적용`
- `Type` 은 브랜치 종류에 맞춘 PascalCase: `Feature`, `Fix`, `Refactor`, `Chore`, `Docs`, `Style`, `Test`, `CI`
- **이슈 번호가 없으면 `/#<이슈번호>` 를 빼고 `<Type> - <한 줄 요약>` 형식으로 한다.** (예: `Chore - claude 세팅 정리`)

## 본문 형식 (실제 PR에 들어가는 내용)

**섹션 제목 + 내용만** 넣는다. 아래 "작성 기준" 같은 **안내 문구는 절대 본문에 포함하지 않는다.**

```
## 관련 이슈

- Resolves : #<이슈번호>   <!-- 이슈 번호가 없으면 이 줄을 `- 해당 없음` 으로 둔다 -->

## 작업 사항

- <이 PR에서 수행한 작업을 bullet 으로, 한글로>

## 참고 사항

- <리뷰어가 알아야 할 맥락/주의사항. 없으면 `-` 그대로 둔다>
```

- 모든 내용은 **한글**로 작성한다.
- 추측하지 말고 코드와 커밋 이력에서 파악된 사실만 기재한다.
- 이슈 번호가 없으면 `관련 이슈` 섹션을 `- 해당 없음` 으로 두고 그대로 진행한다(묻지 않는다).

## 섹션별 작성 기준 (참고용 — PR 본문에 넣지 말 것)

- **관련 이슈**: 해결한 문제의 Issue Index 를 `Resolves : #<번호>` 로 연결. 이슈 번호가 없으면 `- 해당 없음`.
- **작업 사항**: 이 PR 에서 수행한 작업 목록.
- **참고 사항**: 구현 상의 선택, 주의사항 등 리뷰어가 알아야 할 맥락.

## 실행

```bash
gh pr create --title "<title>" --body "<filled template>"
```

- base 브랜치는 `main`. (팀이 git-flow 로 `develop` 을 쓰면 `--base develop` 으로 변경)
