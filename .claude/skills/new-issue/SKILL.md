---
name: new-issue
description: GitHub MCP 로 이슈를 생성한다. Use when the user invokes /new-issue or says '이슈 만들어줘', '이슈 생성', '이슈 등록'.
---

# new-issue — GitHub 이슈 생성

GitHub MCP 서버를 통해 원격 레포에 이슈를 생성한다. (설정: 루트 `.mcp.json` + `GITHUB_PAT`)

## 사전 확인
- GitHub MCP 가 연결돼 있어야 한다(`create_issue` 툴 사용 가능). 안 되면 사용자에게:
  - `.claude/settings.local.json` 의 `GITHUB_PAT` 가 채워졌는지, 세션 리로드했는지 확인 요청.
  - PAT 권한: 대상 레포 **Issues: Read and write**.

## 작업 절차
1. **대상 레포 확인.** `git remote get-url origin` 에서 `owner/repo` 를 추출한다.
   - 예: `https://github.com/mash-up-kr/Promise.9-Web.git` → owner `mash-up-kr`, repo `Promise.9-Web`.
   - remote 가 여러 개거나 추출 실패 시 사용자에게 묻는다.
2. **제목·본문 정리.** 사용자가 준 내용으로 아래 형식을 채운다. 추측으로 내용을 지어내지 않는다 — 부족하면 묻는다.
3. **라벨·담당자·마일스톤** 은 사용자가 **명시했을 때만** 포함한다. 임의로 붙이지 않는다.
4. `create_issue` (GitHub MCP) 를 호출해 생성한다.
5. 생성된 **이슈 번호와 URL** 을 보고한다.

## 제목 형식

```
<type>(<scope>): <한 줄 요약 (한글)>
```

- 예: `chore: 프로젝트 초기 셋업 보강`, `fix(extension): popup 크래시`
- type 소문자, scope 선택. 다영역/추상 이슈는 scope 생략.

## 본문 형식
- **`.github/ISSUE_TEMPLATE.md` 의 형식을 그대로 따른다** (웹에서 만든 이슈와 형식 일치). 안내용 HTML 주석(`<!-- -->`)은 본문에 넣지 않는다.
- 섹션: `배경 / 목적` · `할 일`(체크박스) · `참고 사항`. 내용이 단순하면 `참고 사항` 은 `-` 로 둔다.
- 모든 내용은 **한글**로 작성한다.

## create_issue 호출 파라미터
- `owner`, `repo` — 1번에서 추출한 값.
- `title` — 위 제목 형식.
- `body` — 위 본문 형식.
- (선택) `labels`, `assignees`, `milestone` — 사용자가 지정했을 때만.

## 경계
- 이슈 생성은 **외부에 게시**되는 작업이다. 제목·본문·대상 레포를 사용자에게 확인받고 생성한다.
- PAT 등 시크릿을 로그/이슈 본문에 절대 노출하지 않는다.

상세 컨벤션 (Branch · Commit · PR · Issue 통합): `docs/conventions/git.md`
