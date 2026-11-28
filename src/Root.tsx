import React from 'react';
import { Composition } from 'remotion';
import { Napoleon, TOTAL } from './Napoleon';

export const Root: React.FC = () => (
  <Composition
    id="Napoleon"
    component={Napoleon}
    durationInFrames={TOTAL}
    fps={30}
    width={1920}
    height={1080}
  />
);
