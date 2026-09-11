// EAS Metadata 동적 설정 — 공개 레포라 심사 연락처 전화번호는 파일에 두지 않고 환경변수에서 읽는다.
// eas.json 의 submit.production.ios.metadataPath 가 이 파일을 가리킨다.
// `eas metadata:pull` 은 이 파일을 갱신하지 못하고 store.config.json 을 새로 만든다(gitignore) —
// 받은 내용을 반영하려면 store.config.base.json 으로 옮긴다.
const fs = require("node:fs");
const path = require("node:path");

const base = require("./store.config.base.json");

const PHONE_ENV = "EAS_METADATA_REVIEW_PHONE";

// eas-cli 는 .env 파일을 읽지 않으므로 .env.local 을 직접 본다(셸 환경변수가 우선).
function readEnvLocal(name) {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return undefined;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && match[1] === name) {
      return match[2].replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

const phone = process.env[PHONE_ENV] ?? readEnvLocal(PHONE_ENV);
if (!phone) {
  throw new Error(
    `${PHONE_ENV} 가 없습니다. 심사팀 연락용 전화번호(E.164, 예: +8210…)를 .env.local 에 넣어 주세요.`,
  );
}

module.exports = {
  ...base,
  apple: {
    ...base.apple,
    review: { ...base.apple.review, phone },
  },
};
