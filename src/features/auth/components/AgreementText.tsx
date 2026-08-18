import { Text } from "react-native";

import { Text as AppText } from "@/components/ui/text/Text";

// TODO(약관/개인정보 라우트): 타 브랜치의 이용약관·개인정보처리방침 페이지 머지 후 onPress 로 연결한다.
// 지금은 문구·밑줄만 렌더하고 탭 동작은 붙이지 않는다.
export function AgreementText() {
  return (
    <AppText variant="caption-3" className="text-center text-text-alternative">
      회원가입 시 <Text className="text-text-normal underline">이용약관</Text>{" "}
      및 <Text className="text-text-normal underline">개인정보처리방침</Text>에
      {"\n"}
      동의한 것으로 간주됩니다.
    </AppText>
  );
}
