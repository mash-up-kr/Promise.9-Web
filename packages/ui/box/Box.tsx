import { View } from "react-native";

type RNViewProps = React.ComponentProps<typeof View>;

export interface BoxProps extends Omit<RNViewProps, "className"> {
  className?: string;
}

export function Box({ className, ...props }: BoxProps) {
  return <View {...props} className={className} />;
}
