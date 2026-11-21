import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Grade, Grain, Vignette, ease, rnd } from './look';

/* ---------------- 通用层 ---------------- */

/** 三层景深粒子：远（糊、慢、暗）/ 中 / 近（亮、快、大） */
const DepthParticles: React.FC<{ f: number; n?: number; seed?: number; boost?: number }> = ({
  f,
  n = 90,
  seed = 1,
  boost = 1,
}) => {
  const layers = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const r1 = rnd(i, seed);
        const r2 = rnd(i, seed + 7);
        const r3 = rnd(i, seed + 13);
        const depth = r1; // 0 远 → 1 近
        return {
          x: r2 * 1920,
          y0: r3 * 1200,
          s: 1.2 + depth * depth * 5.2,
          sp: 4 + depth * 26,
          o: (0.10 + depth * 0.55) * boost,
          blur: (1 - depth) * 2.2,
          glow: depth > 0.65 ? 1 : 0.4,
        };
      }),
    [n, seed, boost]
  );

  return (
    <AbsoluteFill>
      {layers.map((p, i) => {
        const y = ((((p.y0 - f * p.sp * 0.6) % 1240) + 1240) % 1240) - 80;
        const tw = 0.62 + 0.38 * Math.sin(f * 0.07 + i * 1.7);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: y,
              width: p.s,
              height: p.s,
              borderRadius: '50%',
              background: '#D6F2FF',
              opacity: p.o * tw,
              filter: p.blur > 0.05 ? `blur(${p.blur}px)` : undefined,
              boxShadow: p.glow > 0.8 ? '0 0 10px rgba(170,230,255,.55)' : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** 体积光锥 */
const Shaft: React.FC<{
  left: number;
  top: number;
  w: number;
  h: number;
  angle?: number;
  opacity?: number;
  blur?: number;
  color?: string;
  core?: boolean;
}> = ({ left, top, w, h, angle = 0, opacity = 0.32, blur = 14, color = '190,240,255', core = true }) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      width: w,
      height: h,
      transform: `rotate(${angle}deg)`,
      filter: `blur(${blur}px)`,
      opacity,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
        background: `linear-gradient(180deg, rgba(${color},.55), rgba(${color},.20) 38%, rgba(${color},0) 92%)`,
      }}
    />
    {core && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(46% 0, 54% 0, 92% 100%, 8% 100%)',
          background: `linear-gradient(180deg, rgba(255,255,255,.55), rgba(${color},.14) 30%, rgba(${color},0) 80%)`,
        }}
      />
    )}
  </div>
);

/* ---------------- 8 个镜头 ---------------- */

/** 01 海面：船与它打下去的那道光 */
const S1: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const z = interpolate(f, [0, d], [1.0, 1.07]);
  const dy = interpolate(f, [0, d], [0, 30]);
  const ripple = Math.sin(f * 0.05) * 2.5;
  const stars = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({ x: rnd(i, 101) * 1920, y: rnd(i, 102) * 300, o: 0.2 + rnd(i, 103) * 0.6, s: 1 + rnd(i, 104) * 1.8 })),
    []
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${z}) translateY(${dy}px)` }}>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg,#081B2C 0%,#0B2F49 18%,#0A2637 34%,#061621 58%,#02070C 100%)' }} />
      {/* 星空 */}
      {stars.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.s, height: s.s, borderRadius: '50%', background: '#CFE8F8', opacity: s.o * 0.55 }} />
      ))}
      {/* 海天线辉光 */}
      <div style={{ position: 'absolute', left: 140, top: 250, width: 1640, height: 400, background: 'radial-gradient(closest-side,rgba(120,205,240,.26),rgba(80,160,210,.05) 58%,rgba(0,0,0,0))', filter: 'blur(34px)' }} />
      {/* 海面 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 468, height: 3, background: 'rgba(160,228,255,.55)', filter: 'blur(1.4px)' }} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 120 + i * 250,
            top: 486 + i * 38 + ripple * (1 + i * 0.2),
            width: 420 - i * 42,
            height: 2,
            background: `rgba(150,220,255,${0.24 - i * 0.02})`,
            filter: 'blur(2.2px)',
          }}
        />
      ))}
      {/* 光柱 */}
      <Shaft left={880} top={462} w={560} h={680} opacity={0.42} blur={11} />
      {/* 船 */}
      <svg width="260" height="150" style={{ position: 'absolute', left: 1058, top: 350 }}>
        <path d="M 18 128 L 236 128 L 214 150 L 40 150 Z" fill="#E8F4FA" />
        <rect x="150" y="92" width="62" height="36" rx="4" fill="#CFE3EF" />
        <rect x="163" y="100" width="16" height="14" fill="#4FD1E8" opacity="0.75" />
        <rect x="84" y="10" width="4" height="120" fill="#CFE3EF" />
        <path d="M 90 14 L 90 120 L 148 120 Z" fill="rgba(232,244,250,.95)" />
        <path d="M 80 40 L 22 128 L 80 128 Z" fill="rgba(210,232,244,.5)" />
      </svg>
      {/* 船底灯的溢光 */}
      <div style={{ position: 'absolute', left: 1080, top: 470, width: 240, height: 120, background: 'radial-gradient(closest-side,rgba(200,245,255,.5),rgba(120,200,240,0))', filter: 'blur(12px)' }} />
      <DepthParticles f={f} n={70} seed={2} boost={0.9} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg,rgba(2,6,11,0) 40%,rgba(2,6,11,.55) 66%,rgba(2,6,11,.97) 100%)' }} />
    </AbsoluteFill>
  );
};

/** 02 垂直剖面：光只走两百米 */
const S2: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const dy = interpolate(f, [0, d], [0, 40]);
  const dotY = interpolate(f, [0, d], [-60, 940]);
  const rays = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 470 + i * 240, w: 78 + (i % 3) * 22, o: 0.20 - i * 0.02 }));
  const Label: React.FC<{ t: string; y: number; c?: string }> = ({ t, y, c = 'rgba(212,240,255,.78)' }) => (
    <div style={{ position: 'absolute', left: 452, top: y, color: c, fontSize: 29, letterSpacing: 2, fontFamily: 'ui-monospace, monospace' }}>{t}</div>
  );
  return (
    <AbsoluteFill style={{ transform: `translateY(${-dy}px)` }}>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg,#0F3E60 0%,#0C3149 12%,#0A2A42 19%,#08202F 19.4%,#071927 40%,#050F19 46.6%,#030B13 47%,#03060B 78%,#010305 100%)',
        }}
      />
      {rays.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.x,
            top: -20,
            width: r.w,
            height: 330,
            background: 'linear-gradient(180deg,rgba(150,220,255,.42),rgba(150,220,255,0))',
            transform: `skewX(-9deg)`,
            filter: 'blur(7px)',
            opacity: r.o * 3.2,
          }}
        />
      ))}
      <div style={{ position: 'absolute', left: 400, top: 198, width: 1120, height: 2, background: 'rgba(155,222,255,.5)' }} />
      <Label t="0 m" y={228} />
      <div style={{ position: 'absolute', left: 400, top: 512, width: 1120, height: 2, background: 'rgba(120,175,205,.34)' }} />
      <Label t="200 m" y={540} c="rgba(205,235,255,.92)" />
      <div style={{ position: 'absolute', left: 452, top: 574, color: 'rgba(205,235,255,.62)', fontSize: 24, letterSpacing: 1 }}>← 光到此为止</div>
      <div style={{ position: 'absolute', left: 400, top: 760, width: 1120, height: 2, background: 'rgba(90,130,160,.22)' }} />
      <Label t="1000 m" y={790} c="rgba(150,180,200,.62)" />
      {/* 下沉的光点 */}
      <div style={{ position: 'absolute', left: 950, top: 214 + dotY, width: 13, height: 13, borderRadius: '50%', background: '#EAF8FF', boxShadow: '0 0 20px 7px rgba(180,235,255,.5)' }} />
      <DepthParticles f={f} n={60} seed={5} boost={0.8} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg,rgba(1,4,8,0) 55%,rgba(1,4,8,.85) 100%)' }} />
    </AbsoluteFill>
  );
};

/** 03 一千米以下：一束探照灯 */
const S3: React.FC<{ f: number; d: number }> = ({ f }) => {
  const sway = Math.sin(f * 0.028) * 30;
  const sway2 = Math.sin(f * 0.028 + 1.1) * 34;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(120% 90% at 70% 0%, #061521 0%, #03070C 55%, #010305 100%)' }}>
      <Shaft left={1010 + sway} top={-80} w={820} h={1300} opacity={0.55} blur={18} />
      <Shaft left={760 + sway2} top={-40} w={420} h={900} angle={4} opacity={0.22} blur={26} core={false} />
      <div style={{ position: 'absolute', left: 1330 + sway, top: -26, width: 96, height: 26, borderRadius: 9, background: 'rgba(210,240,255,.86)', filter: 'blur(3px)' }} />
      <DepthParticles f={f} n={110} seed={9} boost={1.15} />
      <AbsoluteFill style={{ background: 'radial-gradient(70% 60% at 50% 45%, rgba(0,0,0,0) 26%, rgba(0,0,0,.8) 100%)' }} />
    </AbsoluteFill>
  );
};

/** 04 剪影鱼群：三条不同深度的带 */
const S4: React.FC<{ f: number; d: number }> = ({ f }) => {
  const make = (count: number, seed: number, spd: number, size: number, blur: number, op: number) =>
    Array.from({ length: count }, (_, i) => {
      const r1 = rnd(i, seed), r2 = rnd(i, seed + 1), r3 = rnd(i, seed + 2);
      return { y: 70 + r2 * 930, s: size * (0.7 + r3 * 0.6), sp: spd * (0.6 + r1 * 0.9), x0: r1 * 2300 - 300, o: op * (0.6 + r3 * 0.5), blur };
    });
  const groups = [
    make(14, 21, 0.9, 0.5, 3.2, 0.45),
    make(16, 31, 1.5, 0.85, 1.2, 0.7),
    make(8, 41, 2.4, 1.35, 0, 0.9),
  ];
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(90% 70% at 50% 40%, #07131D 0%, #040A11 60%, #020407 100%)' }}>
      {groups.map((g, gi) =>
        g.map((b, i) => {
          const x = (((b.x0 + f * b.sp * 1.7) % 2400) + 2400) % 2400 - 320;
          const yb = b.y + Math.sin(f * 0.03 + i * 1.7) * 18;
          return (
            <div
              key={`${gi}-${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: yb,
                opacity: b.o,
                filter: b.blur ? `blur(${b.blur}px)` : undefined,
                transform: `scale(${b.s}) rotate(${Math.sin(f * 0.02 + i) * 3}deg)`,
              }}
            >
              <div style={{ width: 132, height: 54, borderRadius: '50% 62% 62% 50%', background: '#02060A', border: '1.5px solid rgba(120,185,225,.5)', boxShadow: 'inset 0 0 24px rgba(70,140,185,.2)' }} />
              <div style={{ position: 'absolute', left: -30, top: 12, width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderRight: '34px solid rgba(120,185,225,.4)' }} />
            </div>
          );
        })
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(70,150,200,.10),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(70,150,200,.08))' }} />
      <DepthParticles f={f} n={55} seed={31} boost={0.65} />
    </AbsoluteFill>
  );
};

/** 05 发光水母 */
const S5: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const pulse = 1 + Math.sin(f * 0.07) * 0.035;
  const rise = interpolate(f, [0, d], [40, -52]);
  const tent = Array.from({ length: 9 }, (_, i) => {
    const bx = -160 + i * 40;
    const sway = Math.sin(f * 0.055 + i * 0.9) * 30;
    return `M ${bx} 248 C ${bx + sway * 0.7} 350, ${bx - sway} 440, ${bx + sway * 1.6} 560`;
  });
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(62% 52% at 50% 40%, #07222F 0%, #030B12 62%, #010305 100%)' }}>
      <div style={{ position: 'absolute', left: 700, top: 180 + rise, width: 520, height: 640, transform: `scale(${pulse})` }}>
        <div style={{ position: 'absolute', left: 20, top: 40, width: 480, height: 340, borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(110,235,255,.34),rgba(45,160,215,.10) 58%,rgba(20,70,110,0))', filter: 'blur(30px)' }} />
        <svg width="520" height="640" viewBox="0 0 520 640">
          <defs>
            <radialGradient id="bell" cx="50%" cy="24%" r="76%">
              <stop offset="0%" stopColor="rgba(245,255,255,.86)" />
              <stop offset="40%" stopColor="rgba(140,230,250,.58)" />
              <stop offset="100%" stopColor="rgba(30,105,155,.10)" />
            </radialGradient>
            <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(210,255,255,0)" />
              <stop offset="50%" stopColor="rgba(225,255,255,.9)" />
              <stop offset="100%" stopColor="rgba(210,255,255,0)" />
            </linearGradient>
          </defs>
          <path d="M 120 208 C 138 68, 382 68, 400 208 C 400 246, 342 264, 260 264 C 178 264, 120 246, 120 208 Z" fill="url(#bell)" stroke="rgba(200,248,255,.8)" strokeWidth="2.6" />
          <path d="M 132 210 C 178 228, 342 228, 388 210" stroke="url(#rim)" strokeWidth="3" fill="none" />
          <path d="M 158 152 C 196 92, 324 92, 362 152" stroke="rgba(232,255,255,.32)" strokeWidth="1.6" fill="none" />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={186 + i * 38} cy={146 + (i % 2) * 34} rx={22} ry={9} fill="rgba(205,250,255,.16)" />
          ))}
          {tent.map((dp, i) => (
            <g key={i}>
              <path d={dp} stroke={i % 2 ? 'rgba(150,240,255,.44)' : 'rgba(110,215,245,.58)'} strokeWidth="2.8" fill="none" />
              <path d={dp} stroke="rgba(120,225,255,.10)" strokeWidth="12" fill="none" filter="blur(6px)" />
            </g>
          ))}
        </svg>
      </div>
      <DepthParticles f={f} n={75} seed={41} boost={0.85} />
    </AbsoluteFill>
  );
};

/** 06 鮟鱇：只有那一点诱饵亮着 */
const S6: React.FC<{ f: number; d: number }> = ({ f }) => {
  const bob = Math.sin(f * 0.045) * 16;
  const reveal = ease(f, 8, 46);
  const lx = 872, ly = 462 + bob;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(55% 45% at 45% 45%, #05141C 0%, #02070B 62%, #010305 100%)' }}>
      <div style={{ position: 'absolute', left: lx, top: ly, width: 36, height: 36, borderRadius: '50%', background: '#F0FEFF', boxShadow: '0 0 44px 18px rgba(150,240,255,.5), 0 0 150px 70px rgba(80,190,240,.16)' }} />
      <div style={{ position: 'absolute', left: lx + 18, top: ly + 18, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(120,225,255,.16),rgba(0,0,0,0))', filter: 'blur(18px)' }} />
      <svg width="1920" height="1080" style={{ position: 'absolute', left: 0, top: 0, opacity: reveal }}>
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14303D" />
            <stop offset="60%" stopColor="#08171F" />
            <stop offset="100%" stopColor="#01050A" />
          </linearGradient>
          <radialGradient id="lit" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="rgba(200,248,255,.55)" />
            <stop offset="60%" stopColor="rgba(60,150,200,.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <path d="M 600 700 C 600 470, 860 420, 1110 442 C 1250 454, 1322 506, 1386 548 L 1548 610 L 1386 684 C 1340 800, 1170 918, 950 916 C 730 914, 590 830, 600 700 Z" fill="url(#body)" stroke="rgba(140,205,240,.62)" strokeWidth="3" />
        <path d="M 600 700 C 600 470, 860 420, 1110 442 C 1250 454, 1322 506, 1386 548 L 1548 610 L 1386 684 C 1340 800, 1170 918, 950 916 C 730 914, 590 830, 600 700 Z" fill="url(#lit)" />
        <path d="M 1386 548 C 1310 588, 1310 656, 1386 684" stroke="rgba(150,220,250,.34)" strokeWidth="3" fill="none" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M ${1192 + i * 24} ${556 + i * 13} l ${9 - i} ${32 + i * 2}`} stroke="rgba(175,238,255,.36)" strokeWidth="2.6" />
        ))}
        <path d="M 700 690 C 810 668, 920 676, 1000 712" stroke="rgba(105,185,225,.20)" strokeWidth="8" fill="none" />
        <path d="M 1160 492 C 1104 424, 1018 402, 950 424" stroke="rgba(130,205,240,.42)" strokeWidth="5" fill="none" />
        <circle cx={lx + 18} cy={ly + 18} r="9" fill="#F4FFFF" opacity="0.95" />
      </svg>
      <DepthParticles f={f} n={65} seed={57} boost={0.6} />
    </AbsoluteFill>
  );
};

/** 07 探照灯扫过：才显出红色 */
const S7: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const beamX = interpolate(f, [0, d], [-620, 2180]);
  const body =
    'M 760 560 C 760 470, 1120 440, 1240 540 C 1300 590, 1290 660, 1160 690 C 1000 730, 760 660, 760 560 Z';
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(80% 70% at 50% 50%, #040E14 0%, #02060A 65%, #010305 100%)' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <clipPath id="beamClip">
            <polygon points={`${beamX - 70},0 ${beamX + 130},0 ${beamX + 420},1080 ${beamX + 200},1080`} />
          </clipPath>
          <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="24" />
          </filter>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(190,240,255,0)" />
            <stop offset="44%" stopColor="rgba(200,245,255,.26)" />
            <stop offset="56%" stopColor="rgba(225,251,255,.34)" />
            <stop offset="100%" stopColor="rgba(190,240,255,0)" />
          </linearGradient>
        </defs>
        <g opacity="0.9">
          <path d={body} fill="#0A141A" stroke="rgba(80,130,160,.28)" strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M ${820 + i * 62} ${520 + (i % 3) * 26} l 26 -54`} stroke="rgba(80,130,160,.32)" strokeWidth="3" />
          ))}
        </g>
        <g clipPath="url(#beamClip)">
          <path d={body} fill="#B23246" opacity="0.94" />
          <path d="M 900 560 C 980 545, 1080 550, 1140 580" stroke="rgba(255,180,190,.6)" strokeWidth="6" fill="none" />
          <path d={body} fill="none" stroke="rgba(255,214,220,.55)" strokeWidth="2.5" />
        </g>
        <g filter="url(#soft)">
          <polygon points={`${beamX - 70},0 ${beamX + 130},0 ${beamX + 420},1080 ${beamX + 200},1080`} fill="url(#beamGrad)" opacity="0.8" />
          <polygon points={`${beamX - 34},0 ${beamX + 96},0 ${beamX + 356},1080 ${beamX + 236},1080`} fill="url(#beamGrad)" opacity="0.55" />
        </g>
      </svg>
      <DepthParticles f={f} n={60} seed={63} boost={0.7} />
      <AbsoluteFill style={{ background: 'radial-gradient(70% 60% at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,.55) 100%)' }} />
    </AbsoluteFill>
  );
};

/** 08 退远：深海平原 */
const S8: React.FC<{ f: number; d: number }> = ({ f, d }) => {
  const z = interpolate(f, [0, d], [1.12, 1.0]);
  const glow = 0.46 + 0.2 * Math.sin(f * 0.03);
  const floor =
    'M 0 762 C 240 700, 420 812, 700 772 C 940 736, 1120 832, 1400 792 C 1620 760, 1800 822, 1920 792 L 1920 1080 L 0 1080 Z';
  const specks = useMemo(
    () => Array.from({ length: 90 }, (_, i) => ({ x: rnd(i, 201) * 1920, y: 780 + rnd(i, 202) * 280, o: 0.1 + rnd(i, 203) * 0.4, s: 1 + rnd(i, 204) * 2 })),
    []
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${z})` }}>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg,#02050A 0%,#04101A 46%,#020810 100%)' }} />
      <div style={{ position: 'absolute', left: 660, top: 440, width: 600, height: 360, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(90,205,240,${glow}), rgba(40,120,170,.10) 55%, rgba(0,0,0,0))`, filter: 'blur(34px)' }} />
      <svg width="1920" height="1080" style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={floor} fill="#061019" stroke="rgba(100,175,220,.4)" strokeWidth="2.5" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <path key={i} d={`M ${100 + i * 220} 1080 l -34 -${52 + (i % 3) * 34}`} stroke="rgba(85,155,200,.24)" strokeWidth="4" />
        ))}
        <path d="M 1200 830 C 1290 790, 1380 800, 1430 848 C 1360 872, 1250 872, 1200 830 Z" fill="#08131C" stroke="rgba(95,165,210,.28)" strokeWidth="2" />
        <path d="M 400 862 C 470 826, 560 836, 600 872 C 530 892, 450 892, 400 862 Z" fill="#071119" stroke="rgba(95,165,210,.22)" strokeWidth="2" />
      </svg>
      {specks.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.s, height: s.s, borderRadius: '50%', background: '#9FD4EE', opacity: s.o }} />
      ))}
      <DepthParticles f={f} n={95} seed={77} boost={0.85} />
      <AbsoluteFill style={{ background: 'radial-gradient(75% 65% at 50% 48%, rgba(0,0,0,0) 36%, rgba(0,0,0,.66) 100%)' }} />
    </AbsoluteFill>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8];
const STARTS = [0, 156, 300, 438, 546, 642, 756, 906];
const DURS = [156, 144, 138, 108, 96, 114, 150, 210];

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  let idx = 0;
  for (let i = 0; i < STARTS.length; i++) {
    if (frame >= STARTS[i]) idx = i;
  }
  const local = frame - STARTS[idx];
  const d = DURS[idx];
  const Comp = SCENES[idx];

  const fadeIn = interpolate(local, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [d - 8, d], [1, 0], { extrapolateLeft: 'clamp' });
  // 手持呼吸：极轻微
  const breathe = `scale(${1 + Math.sin(frame * 0.012) * 0.004}) translate(${Math.sin(frame * 0.017) * 2.2}px, ${Math.cos(frame * 0.014) * 2}px)`;

  return (
    <AbsoluteFill style={{ background: '#03060B' }}>
      <AbsoluteFill style={{ opacity: Math.min(1, fadeIn * fadeOut), transform: breathe, filter: 'brightness(1.22) contrast(1.05) saturate(1.05)' }}>
        <Comp f={local} d={d} />
        <Grade />
        <Vignette strength={0.24} />
        <Grain opacity={0.055} seed={idx * 13} />
      </AbsoluteFill>
      {/* 全片最后 40 帧压暗收尾 */}
      <AbsoluteFill
        style={{
          background: '#000',
          opacity: interpolate(frame, [durationInFrames - 46, durationInFrames - 4], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
    </AbsoluteFill>
  );
};
