import type { LegalKind } from "./legal.types";
import { PRIVACY_MD } from "./privacy";
import { TERMS_MD } from "./terms";

export interface LegalDocument {
  title: string;
  markdown: string;
}

export const LEGAL_CONTENT: Record<LegalKind, LegalDocument> = {
  terms: { title: "서비스 이용약관", markdown: TERMS_MD },
  privacy: { title: "개인정보처리방침", markdown: PRIVACY_MD },
};
