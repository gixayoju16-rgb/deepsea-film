import React from 'react';
import { Composition } from 'remotion';
import { FibB, TOTAL_FRAMES } from './FibB';

export const Root: React.FC = () => (
  <Composition
    id="DeepSea"
    component={FibB}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);
