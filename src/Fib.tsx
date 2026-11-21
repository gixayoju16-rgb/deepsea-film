import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from 'remotion';

/* ---------------- 时间轴（秒） ---------------- */
const DUR = [5.193, 7.812, 6.719, 6.666, 6.333, 6.588];
const PAD = 1.0;
const INTRO = 2.4;
export const SEG_LEN = DUR.map((d) => d + PAD);
export const SEG_START = (() => {
  const out: number[] = [];
  let t = INTRO;
  for (const l of SEG_LEN) { out.push(t); t += l; }
  return out;
})();
const OUTRO = 4.0;
export const TOTAL_SEC = INTRO + SEG_LEN.reduce((a, b) => a + b, 0) + OUTRO;
export const TOTAL_FRAMES = Math.round(TOTAL_SEC * 30);

/* ---------------- 色彩 / 排版 ---------------- */
const INK = '#E6EDF3';
const DIM = '#7D8DA1';
const CYAN = '#4FD1E8';
const AMBER = '#FFB86B';
const RED = '#FF6B6B';
const BG = '#0D1117';
const MONO = '"JetBrains Mono","DejaVu Sans Mono",ui-monospace,monospace';

const DIGITS = '0112359550561797752808988764044943820224'.split('');

/* ---------------- 基础层 ---------------- */
const Grid: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 56} y1={0} x2={i * 56} y2={1080} stroke="rgba(255,255,255,0.045)" strokeWidth={1} />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 56} x2={1920} y2={i * 56} stroke="rgba(255,255,255,0.045)" strokeWidth={1} />
      ))}
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.72) 100%)' }} />
  </AbsoluteFill>
);

const Label: React.FC<{ x: number; y: number; text: string; color?: string; size?: number }> = ({ x, y, text, color = DIM, size = 20 }) => (
  <div style={{ position: 'absolute', left: x, top: y, fontFamily: MONO, fontSize: size, letterSpacing: '0.18em', color, textTransform: 'uppercase' }}>{text}</div>
);

const useLocal = (i: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps - SEG_START[i];
};
const appear = (lt: number, at: number, dur = 0.45) => interpolate(lt, [at, at + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const pop = (lt: number, at: number, fps = 30) => spring({ frame: (lt - at) * fps, fps, config: { damping: 200, mass: 0.4 } });

/* ---------------- S1：小数逐位 ---------------- */
const S1: React.FC = () => {
  const lt = useLocal(0);
  const { fps } = useVideoConfig();
  const startX = 360;
  const cell = 52;
  const baseY = 470;
  return (
    <>
      <Label x={360} y={330} text="a fraction" />
      <div style={{ position: 'absolute', left: startX, top: 356, fontFamily: MONO, fontSize: 62, color: INK, opacity: appear(lt, 0.05) }}>
        1 / 89
      </div>
      <div style={{ position: 'absolute', left: startX, top: baseY + 120, fontFamily: MONO, fontSize: 34, color: DIM, opacity: appear(lt, 1.0) }}>
        1 ÷ 89 = 0.
      </div>
      {DIGITS.slice(0, 26).map((d, i) => {
        const at = 1.05 + i * 0.11;
        const o = appear(lt, at, 0.12);
        const isFib = i < 6;
        const isCarry = i === 6;
        const col = isFib ? CYAN : isCarry ? AMBER : INK;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: startX + 175 + i * cell,
            top: baseY + 105 - (1 - o) * 14,
            fontFamily: MONO, fontSize: 62, color: col, opacity: o,
          }}>{d}</div>
        );
      })}
      <div style={{ position: 'absolute', left: startX + 175, top: baseY + 186, width: 6 * cell + cell * 0.42, height: 2, background: CYAN, opacity: appear(lt, 1.9) * 0.6 }} />
      <div style={{ position: 'absolute', left: startX + 175 + 6 * cell, top: baseY + 186, width: cell * 0.42, height: 2, background: AMBER, opacity: appear(lt, 1.9) * 0.6 }} />
      <div style={{ position: 'absolute', left: startX + 175, top: baseY + 210, fontFamily: MONO, fontSize: 20, color: DIM, opacity: appear(lt, 2.0) }}>
        <span style={{ color: CYAN }}>fibonacci</span> · <span style={{ color: AMBER }}>and then?</span>
      </div>
    </>
  );
};

/* ---------------- S2：F 行对位 ---------------- */
const FIB = ['0', '1', '1', '2', '3', '5', '8', '13', '21', '34', '55'];
const S2: React.FC = () => {
  const lt = useLocal(1);
  const startX = 360;
  const cell = 52;
  const baseY = 470;
  return (
    <>
      <Label x={360} y={250} text="F(n)  →  digits" />
      {FIB.map((f, i) => {
        const at = 0.3 + i * 0.28;
        const o = appear(lt, at, 0.25);
        const two = f.length > 1;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: startX + 175 + i * cell - (two ? cell * 0.55 : 0),
            top: 330 - (1 - o) * 10,
            fontFamily: MONO, fontSize: 40, color: i < 6 ? CYAN : AMBER, opacity: o,
          }}>{f}</div>
        );
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        {FIB.slice(0, 6).map((_, i) => {
          const o = appear(lt, 0.45 + i * 0.28, 0.3);
          return <line key={i} x1={startX + 175 + i * cell + 16} y1={385} x2={startX + 175 + i * cell + 16} y2={440} stroke={CYAN} strokeWidth={1.5} opacity={o * 0.5} />;
        })}
        <line x1={startX + 175 + 6 * cell + 16} y1={385} x2={startX + 175 + 6 * cell + 16} y2={440} stroke={AMBER} strokeWidth={1.5} opacity={appear(lt, 2.2) * 0.6} />
      </svg>
      {DIGITS.slice(0, 9).map((d, i) => {
        const o = appear(lt, 0.1, 0.3);
        return (
          <div key={i} style={{
            position: 'absolute', left: startX + 175 + i * cell, top: baseY + 105,
            fontFamily: MONO, fontSize: 62,
            color: i < 6 ? CYAN : i === 6 ? AMBER : INK, opacity: o,
          }}>{d}</div>
        );
      })}
      <div style={{ position: 'absolute', left: startX, top: 700, fontFamily: MONO, fontSize: 30, color: INK, opacity: appear(lt, 3.2) }}>
        1 1 2 3 5 8 <span style={{ color: AMBER }}>should be 8</span> → 却是 <span style={{ color: AMBER }}>9</span>
      </div>
      <div style={{ position: 'absolute', left: startX, top: 760, fontFamily: MONO, fontSize: 24, color: DIM, opacity: appear(lt, 4.2) }}>
        因为不只是「写出来」，是「加起来」
      </div>
    </>
  );
};

/* ---------------- S3：竖式相加 ---------------- */
const ADD = [
  { f: '1', k: 1 }, { f: '1', k: 2 }, { f: '2', k: 3 }, { f: '3', k: 4 },
  { f: '5', k: 5 }, { f: '8', k: 6 }, { f: '13', k: 7 }, { f: '21', k: 8 }, { f: '34', k: 9 },
];
const S3: React.FC = () => {
  const lt = useLocal(2);
  const x0 = 620;
  const cell = 46;
  const y0 = 250;
  return (
    <>
      <Label x={280} y={180} text="sum them, one digit per row" />
      <div style={{ position: 'absolute', left: 280, top: 210, fontFamily: MONO, fontSize: 34, color: INK, opacity: appear(lt, 0.1) }}>1/89 =</div>
      {ADD.map((row, i) => {
        const at = 0.5 + i * 0.42;
        const o = appear(lt, at, 0.3);
        const drop = (1 - o) * -26;
        const startCol = row.k + 1 - row.f.length + 1;
        return (
          <div key={i} style={{ position: 'absolute', top: y0 + i * 54 + drop, opacity: o, display: 'flex', alignItems: 'baseline' }}>
            <div style={{ position: 'absolute', left: x0 - 70, width: 40, textAlign: 'right', fontFamily: MONO, fontSize: 34, color: DIM }}>{i === 0 ? '' : '+'}</div>
            <div style={{ position: 'absolute', left: x0 + 2 * cell, fontFamily: MONO, fontSize: 34, color: DIM }}>0.</div>
            {row.f.split('').map((d, j) => (
              <div key={j} style={{
                position: 'absolute',
                left: x0 + (startCol + j - 1) * cell,
                fontFamily: MONO, fontSize: 44,
                color: row.k >= 7 ? AMBER : INK,
              }}>{d}</div>
            ))}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: x0, top: y0 + ADD.length * 54 + 6, width: 12 * cell, height: 2, background: DIM, opacity: appear(lt, 4.6) }} />
      <div style={{ position: 'absolute', left: x0, top: y0 + ADD.length * 54 + 34, fontFamily: MONO, fontSize: 46, color: INK, opacity: appear(lt, 5.0) }}>
        <span style={{ color: DIM }}>0.</span>
        <span style={{ color: CYAN }}>011235</span>
        <span style={{ color: AMBER }}>9</span>
        <span style={{ color: DIM }}>…</span>
      </div>
    </>
  );
};

/* ---------------- S4：进位 ---------------- */
const S4: React.FC = () => {
  const lt = useLocal(3);
  const x0 = 620;
  const cell = 46;
  const y0 = 250;
  const rows = [
    { f: '5', k: 5 }, { f: '8', k: 6 }, { f: '13', k: 7 }, { f: '21', k: 8 }, { f: '34', k: 9 },
  ];
  return (
    <>
      <Label x={280} y={170} text="carry" />
      {rows.map((row, i) => {
        const o = appear(lt, 0.1 + i * 0.16, 0.3);
        const startCol = row.k + 1 - row.f.length + 1;
        const push = row.k >= 7 ? appear(lt, 1.2) * 8 : 0;
        return (
          <div key={i} style={{ position: 'absolute', top: y0 + i * 74, opacity: o }}>
            <div style={{ position: 'absolute', left: x0 - 70, width: 40, textAlign: 'right', fontFamily: MONO, fontSize: 34, color: DIM }}>{i === 0 ? '' : '+'}</div>
            <div style={{ position: 'absolute', left: x0 + 2 * cell, fontFamily: MONO, fontSize: 34, color: DIM }}>0.</div>
            {row.f.split('').map((d, j) => (
              <div key={j} style={{
                position: 'absolute',
                left: x0 + (startCol + j - 1) * cell + push * (j + 1),
                fontFamily: MONO, fontSize: 48,
                color: row.k >= 7 ? AMBER : INK,
              }}>{d}</div>
            ))}
          </div>
        );
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <path d={`M ${x0 + 7 * cell + 10} ${y0 + 2 * 74 + 54} C ${x0 + 8 * cell} ${y0 + 2 * 74 + 20}, ${x0 + 8 * cell} ${y0 - 20}, ${x0 + 7 * cell + 4} ${y0 - 44}`}
          stroke={AMBER} strokeWidth={2.5} fill="none" strokeDasharray={220} strokeDashoffset={220 * (1 - appear(lt, 2.0, 0.7))} />
        <path d={`M ${x0 + 8 * cell + 10} ${y0 + 2 * 74 + 54} C ${x0 + 9 * cell} ${y0 + 2 * 74 + 10}, ${x0 + 10 * cell} ${y0 - 30}, ${x0 + 8 * cell + 4} ${y0 - 44}`}
          stroke={AMBER} strokeWidth={2.5} fill="none" strokeDasharray={260} strokeDashoffset={260 * (1 - appear(lt, 2.3, 0.7))} />
      </svg>
      <div style={{ position: 'absolute', left: x0, top: y0 - 96, fontFamily: MONO, fontSize: 46, color: INK, opacity: appear(lt, 0.05) }}>
        <span style={{ color: DIM }}>0.</span>
        <span style={{ color: CYAN }}>011235</span>
        <span style={{ color: AMBER }}>9</span>
        <span style={{ color: INK }}>5</span>
      </div>
      <div style={{ position: 'absolute', left: x0, top: y0 + 5 * 74 + 60, fontFamily: MONO, fontSize: 28, color: DIM, opacity: appear(lt, 3.0) }}>
        13 占两位 → 后面每一位都被推右一格
      </div>
    </>
  );
};

/* ---------------- S5：恒等式 ---------------- */
const S5: React.FC = () => {
  const lt = useLocal(4);
  return (
    <>
      <Label x={280} y={190} text="identity" />
      <div style={{ position: 'absolute', left: 280, top: 230, fontFamily: MONO, fontSize: 56, color: INK, opacity: appear(lt, 0.2) }}>
        <span style={{ color: DIM }}>0.</span>
        <span style={{ color: CYAN }}>01123595505617977528089887640449…</span>
      </div>
      <div style={{ position: 'absolute', left: 280, top: 320, fontFamily: MONO, fontSize: 44, color: INK, opacity: appear(lt, 1.0) }}>
        = <span style={{ color: CYAN }}>1/89</span>
      </div>
      <div style={{ position: 'absolute', left: 280, top: 460, fontFamily: MONO, fontSize: 40, color: INK, opacity: appear(lt, 2.2) }}>
        Σ<sub style={{ fontSize: 22 }}>n≥1</sub> F(n) / 10<span style={{ fontSize: 24, verticalAlign: 'super' }}>n+1</span>
        <span style={{ color: DIM }}> = </span>
        <span style={{ color: AMBER }}>1/89</span>
      </div>
      <div style={{ position: 'absolute', left: 280, top: 560, fontFamily: MONO, fontSize: 26, color: DIM, opacity: appear(lt, 3.4) }}>
        每个加数都小一点，但永远不停 → 收敛到同一个数
      </div>
      <div style={{ position: 'absolute', left: 280, top: 640, fontFamily: MONO, fontSize: 26, color: DIM, opacity: appear(lt, 4.2) }}>
        不是彩蛋，是幂级数的必然
      </div>
    </>
  );
};

/* ---------------- S6：1/9899 ---------------- */
const PAIRS = ['01', '01', '02', '03', '05', '08', '13', '21', '34', '55', '89'];
const S6: React.FC = () => {
  const lt = useLocal(5);
  return (
    <>
      <Label x={280} y={190} text="one more digit of shift" />
      <div style={{ position: 'absolute', left: 280, top: 226, fontFamily: MONO, fontSize: 52, color: INK, opacity: appear(lt, 0.1) }}>
        1 / 9899 = <span style={{ color: CYAN }}>0.</span>
      </div>
      {PAIRS.map((p, i) => {
        const at = 0.5 + i * 0.42;
        const o = appear(lt, at, 0.3);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: 280 + 470 + i * 92,
            top: 300 - (1 - o) * 12,
            fontFamily: MONO, fontSize: 54,
            color: i < 8 ? CYAN : AMBER, opacity: o,
          }}>{p}</div>
        );
      })}
      <div style={{ position: 'absolute', left: 280, top: 470, fontFamily: MONO, fontSize: 30, color: INK, opacity: appear(lt, 3.6) }}>
        每项留两位，斐波那契就又排整齐了
      </div>
      <div style={{ position: 'absolute', left: 280, top: 530, fontFamily: MONO, fontSize: 24, color: DIM, opacity: appear(lt, 4.4) }}>
        1/9899 = Σ F(n) / 100<span style={{ fontSize: 15, verticalAlign: 'super' }}>n+1</span>　·　同样的把戏
      </div>
    </>
  );
};

/* ---------------- 主片 ---------------- */
export const Fib: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const seg = SEG_START.findIndex((s, i) => t >= s && t < s + SEG_LEN[i]);
  const idx = seg === -1 ? (t < INTRO ? -1 : 6) : seg;

  const zoom = interpolate(t, [0, TOTAL_SEC], [1, 1.045]);
  const fadeIn = interpolate(t, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(t, [TOTAL_SEC - 0.8, TOTAL_SEC], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, opacity: fadeIn * fadeOut }}>
        <Grid />
        {idx === -1 && (
          <>
            <Label x={280} y={300} text="a small puzzle" />
            <div style={{ position: 'absolute', left: 280, top: 340, fontFamily: MONO, fontSize: 76, color: INK }}>1 / 89</div>
            <div style={{ position: 'absolute', left: 280, top: 450, fontFamily: MONO, fontSize: 30, color: DIM }}>what is hidden after the decimal point</div>
          </>
        )}
        {idx === 0 && <S1 />}
        {idx === 1 && <S2 />}
        {idx === 2 && <S3 />}
        {idx === 3 && <S4 />}
        {idx === 4 && <S5 />}
        {idx === 5 && <S6 />}
        {idx === 6 && (
          <>
            <Label x={280} y={300} text="power series" />
            <div style={{ position: 'absolute', left: 280, top: 340, fontFamily: MONO, fontSize: 60, color: INK, opacity: appear(t - (TOTAL_SEC - OUTRO), 0.2) }}>
              1/89 <span style={{ color: DIM }}>·</span> 1/9899 <span style={{ color: DIM }}>·</span> 1/998999 …
            </div>
            <div style={{ position: 'absolute', left: 280, top: 450, fontFamily: MONO, fontSize: 30, color: CYAN, opacity: appear(t - (TOTAL_SEC - OUTRO), 0.9) }}>
              斐波那契一直在那儿，只是进位把它藏起来了
            </div>
          </>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
