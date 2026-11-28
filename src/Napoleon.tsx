import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import MAP from './map1815.json';
import { Grain, Vignette, ease, rnd } from './look';

export const TOTAL = 6300; // 210s @30fps

const C = {
  sea: '#2a0a08',
  sea2: '#160406',
  land: '#0d0607',
  landEdge: '#3a1512',
  emp: '#9c1a13',
  empEdge: '#ff6f4d',
  ally: '#1c2a35',
  allyEdge: '#41627d',
  gold: '#d8a54a',
  text: '#f3e4d2',
  dim: '#9a8577',
  pol: '#b8873a',
};

type Ring = { g: string; n: string; d: string; a: number; c: number[] };
const RINGS = MAP as unknown as Ring[];

// 屏幕坐标参考（viewBox 1750x1000）：Waterloo 472,395 / Paris 409,467 / Berlin 749,327
// Vienna 725,492 / Warsaw 983,338 / London 333,365 / Milan 636,578

const CITY = [
  { n: '巴黎', x: 409, y: 467, t: 0 },
  { n: '滑铁卢', x: 472, y: 395, t: 0 },
  { n: '柏林', x: 749, y: 327, t: 3 },
  { n: '维也纳', x: 725, y: 492, t: 4 },
  { n: '华沙', x: 983, y: 338, t: 7 },
  { n: '伦敦', x: 333, y: 365, t: 8 },
  { n: '莫斯科', x: 1450, y: 240, t: 4 },
];

type Beat = {
  s: number; // 起始秒
  e: number;
  ch: string; // 章节字
  en: string;
  date: string;
  title: string;
  sub: string;
  cam: { k: number; x: number; y: number };
  panel?: [string, string][];
  arrows?: { d: string; kind?: 'red' | 'gold' | 'ally' }[];
  seal?: boolean;
};

const B: Beat[] = [
  {
    s: 0, e: 12, ch: '序', en: 'WATERLOO · 1815', date: '1815 · 06 · 18',
    title: '滑铁卢 · 雨停了',
    sub: '法兰西 72,000 ／ 反法联军 118,000',
    cam: { k: 1.62, x: 470, y: 396 },
    panel: [['法军', '72,000'], ['联军', '118,000'], ['火炮', '246 / 402']],
  },
  {
    s: 12, e: 30, ch: '壹', en: 'THE ONE ORDER THAT CHANGED', date: '1815 · 06 · 18  17:30',
    title: '格鲁希的三万三千人',
    sub: '历史上，他们被派去追普鲁士人 —— 这一回，传令兵先到。',
    cam: { k: 1.36, x: 560, y: 372 },
    panel: [['格鲁希', '33,000'], ['距战场', '12 km'], ['布吕歇尔', '48,000']],
    arrows: [{ d: 'M455 405 Q 545 382 632 344', kind: 'gold' }],
  },
  {
    s: 30, e: 48, ch: '贰', en: 'THE GUARD ADVANCES', date: '1815 · 06 · 18  19:30',
    title: '近卫军先动了',
    sub: '布吕歇尔还在 12 公里外。这一次没有侧翼。',
    cam: { k: 1.78, x: 490, y: 392 },
    panel: [['近卫军', '8,000'], ['联军中线', '11,000'], ['距离', '600 m']],
    arrows: [
      { d: 'M448 412 Q 476 396 508 380' },
      { d: 'M440 432 Q 470 414 500 398' },
    ],
  },
  {
    s: 48, e: 66, ch: '叁', en: 'THE LINE BREAKS', date: '1815 · 06 · 19',
    title: '威灵顿的战线断了',
    sub: '联军退回布鲁塞尔，荷兰与比利时落进法国手里。',
    cam: { k: 1.48, x: 452, y: 400 },
    panel: [['联军伤亡', '27,000'], ['被俘', '9,000'], ['占领', '布鲁塞尔']],
    arrows: [{ d: 'M474 392 Q 464 376 452 360', kind: 'gold' }],
    seal: true,
  },
  {
    s: 66, e: 84, ch: '肆', en: 'THE SECOND COALITION', date: '1815 · 08',
    title: '第二次反法同盟',
    sub: '俄奥 60 万，从东边压过来。',
    cam: { k: 1.18, x: 980, y: 350 },
    panel: [['俄奥联军', '600,000'], ['法国可用', '280,000'], ['战线', '1,900 km']],
    arrows: [
      { d: 'M1400 292 Q 1120 316 866 352', kind: 'ally' },
      { d: 'M1330 390 Q 1090 396 880 402', kind: 'ally' },
    ],
  },
  {
    s: 84, e: 102, ch: '伍', en: 'ACROSS THE RHINE', date: '1815 · 10',
    title: '过莱茵河',
    sub: '普鲁士的莱茵省先垮了 —— 那是它最富的一块。',
    cam: { k: 1.22, x: 630, y: 412 },
    panel: [['法军东进', '190,000'], ['莱茵省', '已失守'], ['普鲁士', '退向易北河']],
    arrows: [
      { d: 'M432 462 Q 520 424 616 400' },
      { d: 'M470 434 Q 556 404 654 382' },
    ],
  },
  {
    s: 102, e: 120, ch: '陆', en: 'VIENNA DISSOLVES', date: '1816 · 01',
    title: '维也纳会议散场',
    sub: '萨克森、巴伐利亚倒向巴黎。德意志邦联裂成两半。',
    cam: { k: 1.2, x: 742, y: 440 },
    panel: [['邦联成员', '39 → 11'], ['倒戈', '4 国'], ['莱茵邦联', '重建']],
    arrows: [
      { d: 'M700 356 Q 716 380 730 400', kind: 'gold' },
      { d: 'M790 372 Q 772 392 754 408', kind: 'gold' },
    ],
  },
  {
    s: 120, e: 138, ch: '柒', en: 'POLAND RESTORED', date: '1816 · 03',
    title: '波兰王国复国',
    sub: '俄国退到布格河以东。一百年前被切走的地方，又回来了。',
    cam: { k: 1.24, x: 950, y: 340 },
    panel: [['波兰王国', '127,000 km²'], ['俄军后撤', '380 km'], ['华沙', '归位']],
  },
  {
    s: 138, e: 156, ch: '捌', en: 'THE WAR AT SEA', date: '1816 · 05',
    title: '海上是另一场战争',
    sub: '英国能封锁海岸，封锁不了大陆。',
    cam: { k: 1.26, x: 360, y: 350 },
    panel: [['英国舰队', '封锁中'], ['法国港口', '7 / 9 通'], ['商船损失', '−38%']],
    arrows: [{ d: 'M330 302 Q 386 330 428 358', kind: 'ally' }],
  },
  {
    s: 156, e: 174, ch: '玖', en: 'THE NEW MAP', date: '1816 · 12',
    title: '欧洲的新地图',
    sub: '从大西洋到维斯瓦河。',
    cam: { k: 1.14, x: 720, y: 420 },
    panel: [['帝国疆域', '1,240,000 km²'], ['人口', '61,000,000'], ['附庸', '9 国']],
    seal: true,
  },
  {
    s: 174, e: 192, ch: '终', en: 'TALLY', date: '推演结算',
    title: '如果那天他赢了',
    sub: '滑铁卢之后，欧洲再也没有打过一场全洲的仗 —— 这一次，会有。',
    cam: { k: 1.16, x: 700, y: 420 },
    panel: [['推演阵亡', '1,860,000'], ['流离', '6,400,000'], ['帝国年岁', '1815 – 1829']],
  },
  {
    s: 192, e: 210, ch: '终', en: 'FICTION', date: '架空历史推演',
    title: '',
    sub: '',
    cam: { k: 1.14, x: 700, y: 420 },
  },
];

// 势力点亮时刻（秒）
const ON: Record<string, number> = { FR: 0, LOW: 48, RHINE: 84, SAX: 102, BAV: 102, IT: 120 };

const groupOn = (r: Ring) => {
  if (r.g === 'DE') {
    if (r.n === 'Saxony') return ON.SAX;
    if (r.n === 'Bavaria') return ON.BAV;
    return Infinity;
  }
  return ON[r.g] ?? Infinity;
};

const MapLayer: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const beats = B;
  const cur = beats.findIndex((b) => t >= b.s && t < b.e);
  const bi = cur < 0 ? beats.length - 1 : cur;
  const b = beats[bi];

  // 相机：每个 beat 一条曲线，进入时 4 帧落位
  const camK = interpolate(f, [(b.s + 0.4) * 30, (b.s + 2.6) * 30], [bi === 0 ? b.cam.k * 1.05 : b.cam.k * 0.97, b.cam.k], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = Math.sin(f / 90) * 6;

  return (
    <AbsoluteFill style={{ background: C.sea }}>
      {/* 海面：径向渐变 + 经纬网 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 46% 40%, ${C.sea} 0%, ${C.sea2} 68%, #0b0203 100%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: 'absolute' }}>
        {Array.from({ length: 19 }, (_, i) => (
          <line key={'v' + i} x1={i * 112} y1={0} x2={i * 112} y2={1080} stroke="#ffffff" strokeOpacity={0.022} strokeWidth={1} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={'h' + i} x1={0} y1={i * 112} x2={1920} y2={i * 108} stroke="#ffffff" strokeOpacity={0.022} strokeWidth={1} />
        ))}
      </svg>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{
          position: 'absolute',
          transform: `translate(${960 + drift}px, ${540}px) scale(${(camK * 1920) / 1750}) translate(${-b.cam.x}px, ${-((b.cam.y * 1080) / 1000)}px)`,
          transformOrigin: '0 0',
        }}
      >
        <g>
          {RINGS.map((r, i) => {
            const on = groupOn(r);
            const lit = on === Infinity ? 0 : ease(t, on, on + 1.6);
            const isEmp = ['FR', 'LOW', 'RHINE', 'IT'].includes(r.g) || r.g === 'DE';
            const base = isEmp ? C.land : r.g === 'RU' || r.g === 'AT' || r.g === 'PR' || r.g === 'GB' || r.g === 'ES' || r.g === 'PT' || r.g === 'SE' || r.g === 'DK' ? C.ally : C.land;
            const fill = isEmp ? (lit > 0.01 ? C.emp : C.land) : base;
            return (
              <path
                key={i}
                d={r.d}
                fill={fill}
                fillOpacity={isEmp && lit > 0.01 ? 0.55 + 0.35 * lit : 0.9}
                stroke={isEmp && lit > 0.01 ? C.empEdge : r.g === 'RU' || r.g === 'AT' || r.g === 'PR' ? C.allyEdge : C.landEdge}
                strokeOpacity={isEmp && lit > 0.01 ? 0.55 : 0.5}
                strokeWidth={isEmp && lit > 0.01 ? 1.6 : 0.9}
              />
            );
          })}
          {/* 波兰复国（架空手绘） */}
          {t >= 118 && (
            <g style={{ opacity: ease(t, 118, 122) }}>
              <path
                d="M892 288 L1078 272 L1090 386 L1010 404 L906 418 Z"
                fill={C.pol}
                fillOpacity={0.22}
                stroke={C.gold}
                strokeWidth={2}
                strokeDasharray="9 7"
              />
              <text x={986} y={352} fill={C.gold} fontSize={20} textAnchor="middle" letterSpacing={2}>
                波兰王国
              </text>
            </g>
          )}
          {CITY.map((c, i) => (
            <g key={c.n} opacity={ease(t, c.t, c.t + 1.2)}>
              <circle cx={c.x} cy={c.y} r={3.2} fill="#fff" fillOpacity={0.85} />
              <circle cx={c.x} cy={c.y} r={8} fill="none" stroke="#fff" strokeOpacity={0.22} />
              <text x={c.x + 12} y={c.y + 5} fill={C.dim} fontSize={15} letterSpacing={1}>
                {c.n}
              </text>
            </g>
          ))}
          <ArrowLayer t={t} f={f} beat={b} />
        </g>
      </svg>

      <Vignette strength={0.42} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

const ArrowLayer: React.FC<{ t: number; f: number; beat: Beat }> = ({ t, f, beat }) => {
  const el = (beat.s + 1.2) * 30;
  const p = ease(f, el, el + 34);
  if (!beat.arrows) return null;
  const color = (k?: string) => (k === 'gold' ? C.gold : k === 'ally' ? '#5f9fd0' : C.empEdge);
  const fade = interpolate(f, [(beat.e - 1.2) * 30, beat.e * 30], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <g opacity={fade}>
      {beat.arrows.map((a, i) => (
        <g key={i}>
          <path d={a.d} fill="none" stroke={color(a.kind)} strokeOpacity={0.18} strokeWidth={11} strokeLinecap="round" />
          <path
            d={a.d}
            fill="none"
            stroke={color(a.kind)}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 - 1000 * Math.max(0, Math.min(1, p - i * 0.12) / 0.88)}
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,110,70,.55))' }}
          />
        </g>
      ))}
    </g>
  );
};

const Stamp: React.FC<{ beat: Beat; f: number }> = ({ beat, f }) => {
  const a = ease(f, (beat.s + 0.2) * 30, (beat.s + 0.9) * 30);
  return (
    <div style={{ position: 'absolute', left: 96, top: 84, opacity: a, transform: `translateY(${(1 - a) * 10}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 34, height: 3, background: C.gold }} />
        <div style={{ fontFamily: '"Noto Sans CJK SC", sans-serif', fontSize: 17, letterSpacing: 5, color: C.gold, opacity: 0.9 }}>
          {beat.en}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: 12 }}>
        <div style={{ fontFamily: '"Noto Serif CJK SC", serif', fontSize: 62, lineHeight: 1, color: C.text }}>{beat.ch}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 30, letterSpacing: 3, color: C.text, opacity: 0.82, paddingBottom: 6 }}>
          {beat.date}
        </div>
      </div>
    </div>
  );
};

const Panel: React.FC<{ beat: Beat; f: number }> = ({ beat, f }) => {
  const a = ease(f, (beat.s + 0.9) * 30, (beat.s + 1.6) * 30);
  if (!beat.panel) return null;
  return (
    <div style={{ position: 'absolute', right: 92, top: 128, width: 300, opacity: a }}>
      <div style={{ fontFamily: '"Noto Sans CJK SC"', fontSize: 14, letterSpacing: 4, color: C.gold, opacity: 0.85, marginBottom: 16 }}>
        推演数据 · TALLY
      </div>
      {beat.panel.map(([k, v], i) => (
        <div
          key={k}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: '11px 0',
            borderBottom: `1px solid rgba(216,165,74,${0.16})`,
            opacity: ease(f, (beat.s + 1.1 + i * 0.22) * 30, (beat.s + 1.7 + i * 0.22) * 30),
          }}
        >
          <span style={{ fontFamily: '"Noto Sans CJK SC"', fontSize: 17, color: C.dim }}>{k}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 25, color: C.text, letterSpacing: 1 }}>{v}</span>
        </div>
      ))}
    </div>
  );
};

const TitleCard: React.FC<{ beat: Beat; f: number }> = ({ beat, f }) => {
  if (!beat.title) return null;
  const inA = ease(f, (beat.s + 0.5) * 30, (beat.s + 1.4) * 30);
  const outA = interpolate(f, [(beat.e - 1.6) * 30, (beat.e - 0.6) * 30], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const a = Math.min(inA, outA);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center', opacity: a }}>
      <div
        style={{
          minWidth: 640,
          maxWidth: 1100,
          padding: '26px 54px',
          background: 'rgba(6,2,3,0.74)',
          borderTop: `1px solid rgba(216,165,74,0.55)`,
          borderBottom: `1px solid rgba(216,165,74,0.55)`,
          textAlign: 'center',
          transform: `translateY(${(1 - inA) * 14}px)`,
        }}
      >
        <div style={{ fontFamily: '"Noto Serif CJK SC", serif', fontSize: 54, color: C.text, letterSpacing: 3 }}>{beat.title}</div>
        <div style={{ fontFamily: '"Noto Sans CJK SC"', fontSize: 21, color: C.dim, marginTop: 14, lineHeight: 1.6 }}>{beat.sub}</div>
      </div>
    </div>
  );
};

const EndCards: React.FC<{ t: number }> = ({ t }) => {
  const A = (
    <AbsoluteFill
      style={{
        opacity: Math.min(ease(t, 192.4, 193.6), interpolate(t, [198.6, 199.4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,1,2,0.82)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: '"Noto Serif CJK SC", serif', fontSize: 46, color: C.text, letterSpacing: 8 }}>本片为架空历史推演</div>
        <div style={{ fontFamily: '"Noto Sans CJK SC"', fontSize: 22, color: C.dim, marginTop: 22, letterSpacing: 2 }}>
          情节、地图与数据均为虚构，与真实历史无关
        </div>
      </div>
    </AbsoluteFill>
  );
  const Bq = (
    <AbsoluteFill
      style={{
        opacity: Math.min(ease(t, 199.8, 201), interpolate(t, [205.2, 206.4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: '"Noto Serif CJK SC", serif', fontSize: 34, color: C.dim, letterSpacing: 4, marginBottom: 26 }}>
          历史不给答案，只给一次机会
        </div>
        <div style={{ fontFamily: '"Noto Serif CJK SC", serif', fontSize: 64, color: C.gold, letterSpacing: 6 }}>再往前推一步</div>
      </div>
    </AbsoluteFill>
  );
  return (
    <>
      {A}
      {Bq}
    </>
  );
};

export const Napoleon: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const beats = B;
  let bi = beats.findIndex((b) => t >= b.s && t < b.e);
  if (bi < 0) bi = beats.length - 1;
  const beat = beats[bi];
  const fadeIn = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(f, [TOTAL - 16, TOTAL - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#050203', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: fadeIn * fadeOut }}>
        <MapLayer t={t} f={f} />
        <Stamp beat={beat} f={f} />
        <Panel beat={beat} f={f} />
        <TitleCard beat={beat} f={f} />
        {t >= 192 && <EndCards t={t} />}
        {/* 片头大标题 */}
        {t < 4.2 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: Math.min(ease(t, 0.2, 1.2), interpolate(t, [3.0, 4.2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })),
              background: 'rgba(5,1,2,0.72)',
            }}
          >
            <div style={{ fontFamily: '"Noto Sans CJK SC"', fontSize: 20, letterSpacing: 10, color: C.gold }}>架空历史推演 · ALTERNATE 1815</div>
            <div style={{ fontFamily: '"Noto Serif CJK SC", serif', fontSize: 96, color: C.text, letterSpacing: 10, marginTop: 26 }}>
              假如拿破仑赢了滑铁卢
            </div>
            <div style={{ width: 260, height: 2, background: C.gold, opacity: 0.6, marginTop: 34 }} />
          </div>
        )}
        <Vignette strength={0.3} />
      </div>
    </AbsoluteFill>
  );
};
