// Copyright (c) 2026 oneDiversified / APK.audio
// MIT License.

import { ConnectorArt } from './ConnectorArt';

export const ConnectorVisual = ({ type }: { type: string }) => {
  return <ConnectorArt type={type} />;
};

export default ConnectorVisual;
