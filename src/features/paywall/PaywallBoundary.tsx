import { Component, type ReactNode } from "react";

import { PremiumPaywallSheet } from "./PremiumPaywallSheet";

interface PaywallBoundaryProps {
  children: ReactNode;
}

interface PaywallBoundaryState {
  hasError: boolean;
}

/**
 * 의도치 않은 에러가 화면을 깨뜨릴 때, 오류 화면 대신 "Pro 결제 유도" 시트를 띄우는
 * 이스터에그 경계. 존재하지 않는 링크·폴더 같은 예상된 상황은 각 라우트에서 홈으로
 * 리다이렉트하므로, 여기까지 도달하는 건 정말 예기치 못한 시나리오다.
 */
export class PaywallBoundary extends Component<
  PaywallBoundaryProps,
  PaywallBoundaryState
> {
  state: PaywallBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PaywallBoundaryState {
    return { hasError: true };
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return <PremiumPaywallSheet onDismiss={this.reset} />;
    }
    return this.props.children;
  }
}
