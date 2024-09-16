import { FC } from 'react';

export interface RCodeOutputProps {
  rCode: string;
  result: any;
  outputVariableName: string;
  error?: string;
}

declare const RCodeOutput: FC<RCodeOutputProps>;

export default RCodeOutput;