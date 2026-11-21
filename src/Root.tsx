import React from 'react';
import { Composition } from 'remotion';
import { Film3D } from './DeepSea3D';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DeepSea"
        component={Film3D}
        durationInFrames={1116}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
