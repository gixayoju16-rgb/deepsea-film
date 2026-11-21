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
  const startX = 300;
  const cell = 56;
  const baseY = 470;
  return (
    <>
      <Label x={360} y={330} text="a fraction" />
      <div style={{ position: 'absolute', left: startX, top: 356, fontFamily: MONO, fontSize: 76, color: INK, opacity: appear(lt, 0.05) }}>
        1 / 89
      </div>
      <div style={{ position: 'absolute', left: startX, top: baseY + 150, fontFamily: MONO, fontSize: 38, color: DIM, opacity: appear(lt, 1.0) }}>
        1 ÷ 89 =
      </div>
      <div style={{ position: 'absolute', left: startX + 210, top: baseY + 105, fontFamily: MONO, fontSize: 66, color: DIM, opacity: appear(lt, 1.0) }}>0.</div>
      {DIGITS.slice(0, 20).map((d, i) => {
        const at = 1.05 + i * 0.11;
        const o = appear(lt, at, 0.12);
        const isFib = i < 6;
        const isCarry = i === 6;
        const col = isFib ? CYAN : isCarry ? AMBER : INK;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: startX + 280 + i * cell,
            top: baseY + 105 - (1 - o) * 14,
            fontFamily: MONO, fontSize: 66, color: col, opacity: o,
          }}>{d}</div>
        );
      })}
      <div style={{ position: 'absolute', left: startX + 280, top: baseY + 196, width: 6 * cell + cell * 0.42, height: 2, background: CYAN, opacity: appear(lt, 1.9) * 0.6 }} />
      <div style={{ position: 'absolute', left: startX + 280 + 6 * cell, top: baseY + 196, width: cell * 0.42, height: 2, background: AMBER, opacity: appear(lt, 1.9) * 0.6 }} />
      <div style={{ position: 'absolute', left: startX + 210, top: baseY + 224, fontFamily: MONO, fontSize: 22, color: DIM, opacity: appear(lt, 2.0) }}>
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
            position: 'absolute', left: startX + 280 + i * cell, top: baseY + 105,
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
const ADD_TERMS: [string, number][] = [
  ['1', 1], ['1', 2], ['2', 3], ['3', 4], ['5', 5], ['8', 6], ['13', 7],
];
const GRID_X = 700;
const GRID_CELL = 58;
const colX = (col: number) => GRID_X + (col - 1) * GRID_CELL;

const Addend: React.FC<{ f: string; k: number; y: number; o: number; big?: boolean }> = ({ f, k, y, o, big }) => (
  <>
    <div style={{ position: 'absolute', left: GRID_X - 150, top: y, width: 50, textAlign: 'right', fontFamily: MONO, fontSize: 40, color: DIM, opacity: o }}>+</div>
    <div style={{ position: 'absolute', left: GRID_X - 112, top: y, fontFamily: MONO, fontSize: 40, color: DIM, opacity: o }}>0.</div>
    {Array.from({ length: k + 1 - f.length }).map((_, j) => (
      <div key={`z${j}`} style={{ position: 'absolute', left: colX(j + 1), top: y, fontFamily: MONO, fontSize: 46, color: 'rgba(125,141,161,0.28)', opacity: o }}>0</div>
    ))}
    {f.split('').map((d, j) => {
      const col = k + 1 - (f.length - 1 - j);
      return (
        <div key={j} style={{
          position: 'absolute', left: colX(col), top: y - (big ? 4 : 0),
          fontFamily: MONO, fontSize: big ? 52 : 46, color: k >= 7 ? AMBER : INK, opacity: o,
        }}>{d}</div>
      );
    })}
  </>
);

const S3: React.FC = () => {
  const lt = useLocal(2);
  const y0 = 300;
  return (
    <>
      <Label x={300} y={140} text="sum them · one digit per row" />
      <div style={{ position: 'absolute', left: 300, top: 190, fontFamily: MONO, fontSize: 46, color: INK, opacity: appear(lt, 0.05) }}>
        <span style={{ color: DIM }}>1/89 = </span>0.011235955…
      </div>
      {ADD_TERMS.map(([f, k], i) => {
        const o = appear(lt, 0.5 + i * 0.42, 0.3);
        const shift = (1 - o) * -30;
        return <Addend key={i} f={f} k={k} y={y0 + i * 62 + shift} o={o} />;
      })}
      <div style={{ position: 'absolute', left: GRID_X - 112, top: y0 + ADD_TERMS.length * 62 + 8, width: 11 * GRID_CELL, height: 2, background: DIM, opacity: appear(lt, 4.8) }} />
      <div style={{ position: 'absolute', left: GRID_X - 112, top: y0 + ADD_TERMS.length * 62 + 30, fontFamily: MONO, fontSize: 50, opacity: appear(lt, 5.1) }}>
        <span style={{ color: DIM }}>0.</span>
        <span style={{ color: CYAN }}>011235</span>
        <span style={{ color: AMBER }}>9</span>
        <span style={{ color: DIM }}>…</span>
      </div>
      <div style={{ position: 'absolute', left: 300, top: 300, fontFamily: MONO, fontSize: 24, color: DIM, opacity: appear(lt, 5.6), width: 300, lineHeight: 1.6 }}>
        每一行都比上一行小十倍 →<br />斜着排下来
      </div>
    </>
  );
};

/* ---------------- S4：进位 ---------------- */
const S4: React.FC = () => {
  const lt = useLocal(3);
  const y0 = 330;
  const rows: [string, number][] = [['5', 5], ['8', 6], ['13', 7], ['21', 8], ['34', 9]];
  return (
    <>
      <Label x={300} y={150} text="carry · the pattern breaks" />
      <div style={{ position: 'absolute', left: GRID_X - 66, top: 200, fontFamily: MONO, fontSize: 52, color: INK, opacity: appear(lt, 0.05) }}>
        <span style={{ color: DIM }}>0.</span>
        <span style={{ color: CYAN }}>011235</span>
        <span style={{ color: AMBER }}>9</span>
        <span style={{ color: INK }}>5</span>
      </div>
      {rows.map(([f, k], i) => {
        const o = appear(lt, 0.15 + i * 0.16, 0.3);
        return <Addend key={i} f={f} k={k} y={y0 + i * 84} o={o} big={k === 7} />;
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <path d={`M ${colX(8) + 14} ${y0 + 2 * 84 + 40} C ${colX(9) + 40} ${y0 + 2 * 84}, ${colX(9) + 30} 300, ${colX(8) + 10} 282`}
          stroke={AMBER} strokeWidth={2.5} fill="none" strokeDasharray={300} strokeDashoffset={300 * (1 - appear(lt, 2.0, 0.8))} />
        <path d={`M ${colX(9) + 26} ${y0 + 2 * 84 + 40} C ${colX(10) + 60} ${y0 + 2 * 88 - 20}, ${colX(10) + 40} 320, ${colX(9) + 20} 282`}
          stroke={AMBER} strokeWidth={2.5} fill="none" strokeDasharray={340} strokeDashoffset={340 * (1 - appear(lt, 2.4, 0.8))} />
      </svg>
      <div style={{ position: 'absolute', left: colX(9) + 70, top: 280, fontFamily: MONO, fontSize: 24, color: AMBER, opacity: appear(lt, 2.8) }}>carry</div>
      <div style={{ position: 'absolute', left: 300, top: y0 + 5 * 84 + 20, fontFamily: MONO, fontSize: 30, color: DIM, opacity: appear(lt, 3.4) }}>
        13 占两位 → 往后每一位都被推右一格
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
      <div style={{ position: 'absolute', left: 280, top: 230, fontFamily: MONO, fontSize: 62, color: INK, opacity: appear(lt, 0.2) }}>
        <span style={{ color: DIM }}>0.</span>
        <span style={{ color: CYAN }}>01123595505617977528089887640449…</span>
      </div>
      <div style={{ position: 'absolute', left: 280, top: 330, fontFamily: MONO, fontSize: 56, color: INK, opacity: appear(lt, 1.0) }}>
        = <span style={{ color: CYAN }}>1/89</span>
      </div>
      <div style={{ position: 'absolute', left: 280, top: 470, fontFamily: MONO, fontSize: 48, color: INK, opacity: appear(lt, 2.2) }}>
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
      <div style={{ position: 'absolute', left: 280, top: 226, fontFamily: MONO, fontSize: 58, color: INK, opacity: appear(lt, 0.1) }}>
        1 / 9899 = <span style={{ color: CYAN }}>0.</span>
      </div>
      {PAIRS.map((p, i) => {
        const at = 0.5 + i * 0.42;
        const o = appear(lt, at, 0.3);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: 780 + i * 88,
            top: 350 - (1 - o) * 12,
            fontFamily: MONO, fontSize: 58,
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
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.12) translateY(14%)', transformOrigin: '50% 50%' }}>
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
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
