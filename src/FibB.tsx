import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from 'remotion';

/* ================= 时间轴（秒，来自 /root/workspace/fib-b/timing.json） ================= */
const DUR = [2.73, 5.543, 4.979, 4.803, 5.267, 5.61, 4.663];
const PAD = 0.8;
const INTRO = 1.6;
const OUTRO = 6.0;
export const SEG_LEN = DUR.map((d) => d + PAD);
export const SEG_START = (() => {
  const out: number[] = [];
  let t = INTRO;
  for (const l of SEG_LEN) { out.push(t); t += l; }
  return out;
})();
export const TOTAL_SEC = INTRO + SEG_LEN.reduce((a, b) => a + b, 0) + OUTRO;
export const TOTAL_FRAMES = Math.round(TOTAL_SEC * 30);

/* ================= 色彩 / 字体 ================= */
const INK = '#E8EEF5';
const DIM = '#7C8CA0';
const FAINT = 'rgba(124,140,160,0.30)';
const BLUE = '#5AA6FF';
const AMBER = '#FFB86B';
const RED = '#FF6B6B';
const BG = '#0B0F14';
const MONO = '"JetBrains Mono","DejaVu Sans Mono",ui-monospace,monospace';

const DIGITS = '0112359550561797752808988764044943820224'.split('');
const FIB_ALL = ['0', '1', '1', '2', '3', '5', '8', '13', '21', '34', '55'];

/* ================= 基础层 ================= */
const Grid: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 56} y1={0} x2={i * 56} y2={1080} stroke="rgba(255,255,255,0.040)" strokeWidth={1} />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 56} x2={1920} y2={i * 56} stroke="rgba(255,255,255,0.040)" strokeWidth={1} />
      ))}
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.70) 100%)' }} />
  </AbsoluteFill>
);

const Label: React.FC<{ x: number; y: number; text: string; color?: string; size?: number }> = ({ x, y, text, color = DIM, size = 20 }) => (
  <div style={{ position: 'absolute', left: x, top: y, fontFamily: MONO, fontSize: size, letterSpacing: '0.18em', color, textTransform: 'uppercase' }}>{text}</div>
);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const useLocal = (i: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps - SEG_START[i];
};
const appear = (lt: number, at: number, dur = 0.45) => interpolate(lt, [at, at + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const pop = (lt: number, at: number, fps = 30) => spring({ frame: (lt - at) * fps, fps, config: { damping: 200, mass: 0.4 } });

/* ================= S1：逐位打字 ================= */
const S1: React.FC = () => {
  const lt = useLocal(0);
  const cell = 62;
  const startX = 330;
  const typed = Math.floor(clamp01((lt - 0.7) / 2.0) * 12);
  return (
    <>
      <Label x={320} y={300} text="a fraction" />
      <div style={{ position: 'absolute', left: 320, top: 340, fontFamily: MONO, fontSize: 96, color: INK, opacity: appear(lt, 0.05) }}>1 / 89</div>
      <div style={{ position: 'absolute', left: startX, top: 500, fontFamily: MONO, fontSize: 72, color: DIM, opacity: appear(lt, 0.5) }}>1 ÷ 89 =</div>
      <div style={{ position: 'absolute', left: startX + 292, top: 500, fontFamily: MONO, fontSize: 72, color: INK, opacity: appear(lt, 0.55) }}>0.</div>
      {DIGITS.slice(0, 20).map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: startX + 292 + 62 + i * cell,
          top: 500,
          fontFamily: MONO, fontSize: 72,
          color: i < 12 ? INK : 'rgba(232,238,245,0.28)',
          opacity: i < typed ? 1 : 0,
        }}>{d}</div>
      ))}
      <div style={{ position: 'absolute', left: 320, top: 640, fontFamily: MONO, fontSize: 30, letterSpacing: '0.04em', color: BLUE, opacity: appear(lt, 2.6) }}>
        0.01123595505617977528…
      </div>
    </>
  );
};

/* ================= S2：数字 ↔ 斐波那契 ================= */
const S2: React.FC = () => {
  const lt = useLocal(1);
  const cell = 96;
  const startX = 420;
  const baseY = 300;
  const fib = FIB_ALL.slice(0, 8);
  return (
    <>
      <Label x={320} y={200} text="F(n) → digits" />
      {fib.map((f, i) => {
        const o = appear(lt, 0.15 + i * 0.52, 0.35);
        const len = f.length;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: startX + i * cell + (len === 2 ? 30 : 0),
            top: baseY - (1 - o) * 22,
            fontFamily: MONO, fontSize: 68,
            color: i < 6 ? BLUE : AMBER,
            opacity: o,
          }}>{f}</div>
        );
      })}
      {fib.map((f, i) => (
        <div key={`d${i}`} style={{ position: 'absolute', left: startX + i * cell, top: baseY + 92, width: 44, height: 2, background: i < 6 ? BLUE : AMBER, opacity: appear(lt, 0.3 + i * 0.52) * 0.8 }} />
      ))}
      <div style={{ position: 'absolute', left: startX, top: 480, fontFamily: MONO, fontSize: 62, letterSpacing: '0.08em', color: INK, opacity: appear(lt, 4.6) }}>
        <span style={{ color: BLUE }}>0 1 1 2 3 5</span>
        <span style={{ color: AMBER }}> 8 13 21</span>
      </div>
      <div style={{ position: 'absolute', left: 320, top: 600, width: 700, fontFamily: MONO, fontSize: 28, lineHeight: 1.7, color: DIM, opacity: appear(lt, 5.0) }}>
        一位一位读，就是一个数列；
        <br />数到两位的那一项，往后就开始挤。
      </div>
    </>
  );
};

/* ================= S3：竖式阶梯 ================= */
const GRID_X = 760;
const CELL = 60;
const colX = (col: number) => GRID_X + (col - 1) * CELL;
const TERMS3: [string, number][] = [['1', 1], ['1', 2], ['2', 3], ['3', 4], ['5', 5], ['8', 6], ['13', 7]];

const Row: React.FC<{ f: string; k: number; y: number; o: number; two?: boolean }> = ({ f, k, y, o, two }) => (
  <>
    <div style={{ position: 'absolute', left: GRID_X - 150, top: y, width: 46, textAlign: 'right', fontFamily: MONO, fontSize: 40, color: FAINT, opacity: o }}>+</div>
    <div style={{ position: 'absolute', left: GRID_X - 88, top: y, fontFamily: MONO, fontSize: 40, color: FAINT, opacity: o }}>0.</div>
    {Array.from({ length: k + 1 - f.length }).map((_, j) => (
      <div key={`z${j}`} style={{ position: 'absolute', left: colX(j + 1), top: y, fontFamily: MONO, fontSize: 46, color: FAINT, opacity: o }}>0</div>
    ))}
    {f.split('').map((d, j) => {
      const col = k + 1 - (f.length - 1 - j);
      return (
        <div key={j} style={{
          position: 'absolute', left: colX(col), top: y,
          fontFamily: MONO, fontSize: two ? 54 : 46,
          color: two ? AMBER : INK, opacity: o,
        }}>{d}</div>
      );
    })}
  </>
);

const S3: React.FC = () => {
  const lt = useLocal(2);
  const y0 = 300;
  const shift = (i: number) => Math.min(1, clamp01((lt - (0.3 + i * 0.55)) / 0.55));
  return (
    <>
      <Label x={320} y={190} text="sum them · each row slides right" />
      <div style={{ position: 'absolute', left: 320, top: 226, fontFamily: MONO, fontSize: 46, color: INK, opacity: appear(lt, 0.05) }}>
        <span style={{ color: DIM }}>1/89 = </span>0.011235955…
      </div>
      {TERMS3.map(([f, k], i) => {
        const o = appear(lt, 0.3 + i * 0.55, 0.3);
        return <Row key={i} f={f} k={k} y={y0 + i * 64 + (1 - shift(i)) * 26} o={o} two={k === 7} />;
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        {Array.from({ length: 7 }).map((_, j) => {
          const a = shift(j);
          return (
            <line key={j}
              x1={colX(1) + 16} y1={y0 + j * 64 + 70}
              x2={colX(1) + 16 + 4.2 * CELL * a} y2={y0 + j * 64 + 70}
              stroke="rgba(90,166,255,0.42)" strokeWidth={2} strokeDasharray="6 8" />
          );
        })}
      </svg>
      <div style={{ position: 'absolute', left: 300, top: 790, fontFamily: MONO, fontSize: 26, color: DIM, opacity: appear(lt, 4.6) }}>
        每一行都比上一行小十倍 → 斜着排成一条阶梯
      </div>
    </>
  );
};

/* ================= S4：进位破坏 → 合起来仍是 1/89 ================= */
const S4: React.FC = () => {
  const lt = useLocal(3);
  const y0 = 300;
  const rows: [string, number][] = [['5', 5], ['8', 6], ['13', 7], ['21', 8], ['34', 9]];
  const sumIn = appear(lt, 3.2);
  return (
    <>
      <Label x={320} y={190} text="carry · the staircase breaks" />
      <div style={{ position: 'absolute', left: GRID_X - 88, top: 226, fontFamily: MONO, fontSize: 52, color: INK, opacity: appear(lt, 0.05) }}>
        <span style={{ color: DIM }}>0.</span>
        <span style={{ color: BLUE }}>011235</span>
        <span style={{ color: AMBER }}>9</span>
        <span>5</span>
      </div>
      {rows.map(([f, k], i) => {
        const o = appear(lt, 0.2 + i * 0.34, 0.3);
        return <Row key={i} f={f} k={k} y={y0 + i * 70} o={o} two={k === 7} />;
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <path
          d={`M ${colX(8) + 6} ${y0 + 2 * 70 + 60} C ${colX(9) + 44} ${y0 + 2 * 70}, ${colX(9) + 34} ${y0 - 30}, ${colX(8)} ${y0 - 6}`}
          stroke={AMBER} strokeWidth={2.6} fill="none" strokeDasharray={320} strokeDashoffset={320 * (1 - appear(lt, 1.9, 0.9))} />
        <path
          d={`M ${colX(9) + 20} ${y0 + 2 * 70 + 60} C ${colX(10) + 52} ${y0 + 2 * 70 - 30}, ${colX(10) + 34} ${y0 - 20}, ${colX(9) + 14} ${y0 - 6}`}
          stroke={AMBER} strokeWidth={2.6} fill="none" strokeDasharray={360} strokeDashoffset={360 * (1 - appear(lt, 2.3, 0.9))} />
      </svg>
      <div style={{ position: 'absolute', left: colX(9) + 74, top: y0 - 16, fontFamily: MONO, fontSize: 24, color: AMBER, opacity: appear(lt, 2.7) }}>carry</div>
      <div style={{ position: 'absolute', left: 320, top: 700, fontFamily: MONO, fontSize: 26, color: DIM, opacity: appear(lt, 2.9) }}>
        13 占两位 → 后面每一位都被推右一格
      </div>
      <div style={{ position: 'absolute', left: 320, top: 790, fontFamily: MONO, fontSize: 40, color: INK, opacity: sumIn, transform: `translateY(${(1 - sumIn) * 14}px)` }}>
        但加起来 = <span style={{ color: BLUE }}>1 / 89</span>
        <span style={{ fontSize: 26, color: DIM }}>　（不干净，但正好）</span>
      </div>
    </>
  );
};

/* ================= S5：1/9899 每项两位 ================= */
const PAIRS = ['01', '01', '02', '03', '05', '08', '13', '21', '34', '55', '89'];
const S5: React.FC = () => {
  const lt = useLocal(4);
  return (
    <>
      <Label x={320} y={190} text="one more digit of shift" />
      <div style={{ position: 'absolute', left: 320, top: 226, fontFamily: MONO, fontSize: 58, color: INK, opacity: appear(lt, 0.1) }}>
        1 / 9899 = <span style={{ color: BLUE }}>0.</span>
      </div>
      {PAIRS.map((p, i) => {
        const o = appear(lt, 0.45 + i * 0.36, 0.3);
        return (
          <div key={i} style={{
            position: 'absolute', left: 740 + i * 92, top: 350 - (1 - o) * 12,
            fontFamily: MONO, fontSize: 58, color: i < 8 ? BLUE : AMBER, opacity: o,
          }}>{p}</div>
        );
      })}
      <div style={{ position: 'absolute', left: 320, top: 500, fontFamily: MONO, fontSize: 30, color: INK, opacity: appear(lt, 4.4) }}>
        每项留两位 → 斐波那契又排整齐了
      </div>
      <div style={{ position: 'absolute', left: 320, top: 566, fontFamily: MONO, fontSize: 24, color: DIM, opacity: appear(lt, 4.9) }}>
        1/9899 = Σ F(n) / 100<span style={{ fontSize: 15, verticalAlign: 'super' }}>n+1</span>　·　同一个把戏
      </div>
    </>
  );
};

/* ================= S6：欧拉数里也有它（接续） ================= */
const E_DIGITS = '27182818284590452353602874713526624977572470936999'.split('');
const S6: React.FC = () => {
  const lt = useLocal(5);
  const cell = 44;
  const startX = 300;
  const shown = Math.min(22, Math.floor(clamp01((lt - 0.3) / 2.6) * 22));
  const groups: [number, number, string][] = [[1, 3, '1'], [3, 6, '2'], [6, 10, '3'], [10, 13, '4']];
  return (
    <>
      <Label x={300} y={190} text="the same numbers, somewhere else" />
      <div style={{ position: 'absolute', left: 300, top: 226, fontFamily: MONO, fontSize: 58, color: INK, opacity: appear(lt, 0.05) }}>
        e = <span style={{ color: BLUE }}>2.</span>
      </div>
      <div style={{ position: 'absolute', left: startX, top: 340, display: 'flex' }}>
        {E_DIGITS.slice(0, 23).map((d, i) => (
          <div key={i} style={{
            width: cell, textAlign: 'center', fontFamily: MONO, fontSize: 56,
            color: i === 1 ? BLUE : INK,
            opacity: i === 1 ? appear(lt, 0.2) : i < shown ? 1 : 0,
          }}>{d}</div>
        ))}
      </div>
      {groups.map(([a, b, txt], gi) => {
        const o = appear(lt, 1.6 + gi * 0.55, 0.4);
        const x1 = startX + a * cell + 2;
        const x2 = startX + b * cell - 2;
        const col = gi % 2 === 0 ? BLUE : AMBER;
        return (
          <svg key={gi} width={1920} height={1080} style={{ position: 'absolute', opacity: o }}>
            <path d={`M ${x1} 300 L ${x2} 300 L ${x2} 320`} stroke={col} strokeWidth={2.5} fill="none" />
            <path d={`M ${x1} 300 L ${x1} 320`} stroke={col} strokeWidth={2.5} fill="none" />
            <text x={(x1 + x2) / 2} y={360} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={col}>{txt}</text>
          </svg>
        );
      })}
      <div style={{ position: 'absolute', left: 300, top: 440, fontFamily: MONO, fontSize: 26, color: DIM, opacity: appear(lt, 3.9) }}>
        下标 1 · 2 · 3 · 4 —— 连续的自然数，组不成一个递推数列
      </div>
      <div style={{ position: 'absolute', left: 300, top: 560, width: 1250, fontFamily: MONO, fontSize: 34, lineHeight: 1.6, color: INK, opacity: appear(lt, 4.6) }}>
        能藏在 1/89 里，是因为斐波那契<strong> 越往后越大 </strong>；
        <br />
        <span style={{ color: DIM, fontSize: 30 }}>常数的小数位只跟着前面的位数走，不会越走越宽。</span>
      </div>
    </>
  );
};

/* ================= 主片 ================= */
export const FibB: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const seg = SEG_START.findIndex((s, i) => t >= s && t < s + SEG_LEN[i]);
  const idx = seg === -1 ? (t < INTRO ? -1 : 7) : seg;

  const zoom = interpolate(t, [0, TOTAL_SEC], [1, 1.045]);
  const fadeIn = interpolate(t, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(t, [TOTAL_SEC - 0.7, TOTAL_SEC], [1, 0], { extrapolateLeft: 'clamp' });
  const ot = t - (TOTAL_SEC - OUTRO);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, opacity: fadeIn * fadeOut }}>
        <Grid />
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.1) translateY(6%)', transformOrigin: '50% 50%' }}>
          {idx === -1 && (
            <>
              <Label x={320} y={300} text="a small puzzle" />
              <div style={{ position: 'absolute', left: 320, top: 340, fontFamily: MONO, fontSize: 96, color: INK }}>1 / 89</div>
              <div style={{ position: 'absolute', left: 320, top: 470, fontFamily: MONO, fontSize: 30, color: DIM }}>what is hidden after the decimal point</div>
            </>
          )}
          {idx === 0 && <S1 />}
          {idx === 1 && <S2 />}
          {idx === 2 && <S3 />}
          {idx === 3 && <S4 />}
          {idx === 4 && <S5 />}
          {idx === 5 && <S6 />}
          {idx === 7 && (
            <>
              <Label x={300} y={130} text="power series" />
              <div style={{ position: 'absolute', left: 300, top: 170, fontFamily: MONO, fontSize: 54, color: INK, opacity: appear(ot, 0.2) }}>
                1/89 <span style={{ color: DIM }}>·</span> 1/9899 <span style={{ color: DIM }}>·</span> 1/998999 …
              </div>
              <div style={{ position: 'absolute', left: 300, top: 262, fontFamily: MONO, fontSize: 30, color: BLUE, opacity: appear(ot, 0.8) }}>
                斐波那契一直在那儿，只是进位把它藏了起来
              </div>
              <div style={{ position: 'absolute', left: 300, top: 350, fontFamily: MONO, fontSize: 24, color: DIM, opacity: appear(ot, 2.0) }}>
                下一个想看的：<span style={{ color: INK }}>1/243</span>（0.004115226337…）？<span style={{ color: INK }}>1/7</span> 的循环节为什么只是换了个顺序？<span style={{ color: INK }}>1/998999</span> 每项三位？
              </div>
            </>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
