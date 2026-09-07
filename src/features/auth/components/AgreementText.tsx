import { Text } from "react-native";

import { Text as AppText } from "@/components/ui/text/Text";

export type LegalDocumentKind = "terms" | "privacy";

export interface AgreementTextProps {
  onOpenLegal: (kind: LegalDocumentKind) => void;
}

export function AgreementText({ onOpenLegal }: AgreementTextProps) {
  return (
    <AppText variant="caption-3" className="text-center text-text-alternative">
      회원가입 시{" "}
      <Text
        accessibilityRole="link"
        className="text-text-normal underline"
        onPress={() => onOpenLegal("terms")}
      >
        이용약관
      </Text>{" "}
      및{" "}
      <Text
        accessibilityRole="link"
        className="text-text-normal underline"
        onPress={() => onOpenLegal("privacy")}
      >
        개인정보처리방침
      </Text>
      에{"\n"}
      동의한 것으로 간주됩니다.
    </AppText>
  );
}
