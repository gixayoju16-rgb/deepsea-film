import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const rnd = (i: number, s = 1) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const ease = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** 胶片颗粒（静态点阵 + 轻微闪动，比 feTurbulence 便宜得多） */
export const Grain: React.FC<{ opacity?: number; seed?: number; n?: number }> = ({
  opacity = 0.06,
  seed = 1,
  n = 420,
}) => {
  const f = useCurrentFrame();
  const dots = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        x: rnd(i, seed) * 1920,
        y: rnd(i, seed + 3) * 1080,
        s: 1 + rnd(i, seed + 5) * 2,
        a: 0.3 + rnd(i, seed + 9) * 0.7,
      })),
    [n, seed]
  );
  const flick = 0.85 + 0.15 * Math.sin(f * 0.7);
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: opacity * flick }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: d.s,
            height: d.s,
            borderRadius: '50%',
            background: '#BEE6FF',
            opacity: d.a * 0.5,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** 暗角 */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.34 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(72% 62% at 50% 47%, rgba(0,0,0,0) 34%, rgba(0,0,0,${strength}) 78%, rgba(0,0,0,${Math.min(
        0.98,
        strength * 1.6
      )}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** 调色：暗部压青、亮部提一点暖，模拟水下偏色 */
export const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'linear-gradient(180deg, rgba(10,60,90,.10) 0%, rgba(0,0,0,0) 35%, rgba(0,20,40,.16) 100%)',
      mixBlendMode: 'screen',
      pointerEvents: 'none',
    }}
  />
);
