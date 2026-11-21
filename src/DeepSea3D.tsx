import React, { useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ---------------- 工具 ---------------- */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Key = { t: number; p: [number, number, number]; l: [number, number, number] };

const KEYS: Key[] = [
  { t: 0.0, p: [0, 3.5, 28], l: [0, 2.0, 0] },
  { t: 5.2, p: [0, 2.2, 17], l: [0, 0.8, 0] },
  { t: 10.0, p: [0, -38, 14], l: [0, -50, 0] },
  { t: 14.6, p: [0, -60, 12], l: [0, -72, 0] },
  { t: 18.2, p: [6, -84, 14], l: [8, -92, -2] },
  { t: 21.4, p: [-6, -116, 16], l: [-8, -128, -2] },
  { t: 25.2, p: [0, -142, 18], l: [8, -158, -6] },
  { t: 30.2, p: [2, -152, 20], l: [10, -172, -6] },
  { t: 37.2, p: [4, -158, 30], l: [8, -182, -4] },
];

function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < KEYS.length - 1; k++) if (t >= KEYS[k].t) i = k;
  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const u = b.t === a.t ? 0 : smooth((t - a.t) / (b.t - a.t));
  return {
    p: [lerp(a.p[0], b.p[0], u), lerp(a.p[1], b.p[1], u), lerp(a.p[2], b.p[2], u)] as [number, number, number],
    l: [lerp(a.l[0], b.l[0], u), lerp(a.l[1], b.l[1], u), lerp(a.l[2], b.l[2], u)] as [number, number, number],
  };
}

/* ---------------- 场景零件 ---------------- */

/** 海面 + 星空 */
const Surface: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  return (
    <>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[400, 400, 1, 1]} />
        <meshStandardMaterial color="#0a2c3f" metalness={0.55} roughness={0.22} />
      </mesh>
      {/* 天空辉光 */}
      <mesh position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial color="#0b3c58" transparent opacity={0.5} />
      </mesh>
    </>
  );
};

/** 船 */
const Boat: React.FC = () => (
  <group position={[0, 0.6, 0]}>
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[9, 1.6, 3]} />
      <meshStandardMaterial color="#dceaf2" roughness={0.6} />
    </mesh>
    <mesh position={[0, 5.2, 0]} rotation={[0, 0, 0]}>
      <coneGeometry args={[2.6, 9, 3]} />
      <meshStandardMaterial color="#e8f4fa" roughness={0.7} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[2.6, 2.4, 0]}>
      <boxGeometry args={[2.6, 2.2, 2]} />
      <meshStandardMaterial color="#cfe3ef" roughness={0.6} />
    </mesh>
    <pointLight position={[0, -1.2, 0]} color="#a8e8ff" intensity={38} distance={60} decay={2} />
  </group>
);

/** 光柱（糖圆锥，加法混合） */
const Shaft: React.FC<{ pos: [number, number, number]; h?: number; r?: number; o?: number }> = ({
  pos,
  h = 120,
  r = 10,
  o = 0.10,
}) => (
  <mesh position={[pos[0], pos[1] - h / 2, pos[2]]}>
    <coneGeometry args={[r, h, 28, 1, true]} />
    <meshBasicMaterial
      color="#bdf0ff"
      transparent
      opacity={o}
      side={THREE.DoubleSide}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  </mesh>
);

/** 海雪（悬浮颗粒） */
const Snow: React.FC<{ t: number; n?: number }> = ({ t, n = 3500 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = -Math.random() * 230;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [n]);
  const ref = useRef<THREE.Points>(null);
  if (ref.current) {
    ref.current.rotation.y = t * 0.02;
    ref.current.position.y = Math.sin(t * 0.2) * 0.4;
  }
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color="#cdefff"
        size={0.42}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/** 鱼群 */
const School: React.FC<{ t: number }> = ({ t }) => {
  const items = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        y: -72 + (Math.random() - 0.5) * 26,
        z: (Math.random() - 0.5) * 70,
        x0: (Math.random() - 0.5) * 140,
        s: 1.6 + Math.random() * 2.2,
        sp: 2 + Math.random() * 3,
        ph: Math.random() * 6.28,
      })),
    []
  );
  return (
    <group>
      {items.map((b, i) => {
        const x = (((b.x0 + t * b.sp) % 180) + 180) % 180 - 90;
        return (
          <mesh key={i} position={[x, b.y + Math.sin(t * 0.6 + b.ph) * 1.4, b.z]} scale={[b.s, b.s * 0.42, b.s * 0.22]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#04121a" roughness={0.9} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
};

/** 水母 */
const Jellyfish: React.FC<{ t: number }> = ({ t }) => {
  const g = useRef<THREE.Group>(null);
  const pulse = 1 + Math.sin(t * 3.1) * 0.06;
  if (g.current) {
    g.current.position.y = -92 + Math.sin(t * 0.8) * 1.6;
    g.current.scale.setScalar(pulse);
  }
  const tents = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);
  return (
    <group ref={g} position={[8, -92, -2]}>
      <mesh>
        <sphereGeometry args={[5.4, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial
          color="#8fe8ff"
          emissive="#4fd1e8"
          emissiveIntensity={1.4}
          transparent
          opacity={0.45}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#6fe0ff" intensity={26} distance={40} decay={2} />
      {tents.map((a, i) => {
        const r = 3.4;
        return (
          <mesh key={i} position={[Math.cos(a) * r, -6 + Math.sin(t * 1.6 + i) * 0.8, Math.sin(a) * r]} rotation={[0.2, a, 0.1]}>
            <cylinderGeometry args={[0.06, 0.03, 12, 5]} />
            <meshStandardMaterial color="#9fe9ff" emissive="#5fd0ea" emissiveIntensity={0.9} transparent opacity={0.55} />
          </mesh>
        );
      })}
    </group>
  );
};

/** 鮟鱇 */
const Angler: React.FC<{ t: number }> = ({ t }) => {
  const body = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const r = 0.6 + Math.sin(u * Math.PI) * 4.6;
      pts.push(new THREE.Vector2(r, (u - 0.5) * 15));
    }
    return new THREE.LatheGeometry(pts, 20);
  }, []);
  const lureY = -128 + Math.sin(t * 1.4) * 0.7;
  return (
    <group position={[-8, -128, -2]} rotation={[0, 0.5, 0]}>
      <mesh geometry={body} scale={[1, 1, 0.75]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#0d2029" roughness={0.75} metalness={0.25} />
      </mesh>
      {/* 牙 */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-4 + i * 1.05, 2.4 - i * 0.12, 1.2]} rotation={[0, 0, 0.25]}>
          <coneGeometry args={[0.13, 1.1, 5]} />
          <meshStandardMaterial color="#cfe9f5" emissive="#4a8ba8" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* 诱饵杆 */}
      <mesh position={[-3.6, 6.2, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.08, 0.08, 6, 6]} />
        <meshStandardMaterial color="#16323f" />
      </mesh>
      <mesh position={[-1.2, lureY + 131.6, 0]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color="#eafeff" emissive="#9ff2ff" emissiveIntensity={5} />
      </mesh>
      <pointLight position={[-1.2, 4.6, 0]} color="#a8f4ff" intensity={30} distance={34} decay={2} />
    </group>
  );
};

/** 被光扫到才显出红色的生物 */
const RedCreature: React.FC<{ t: number; beamX: number }> = ({ t, beamX }) => {
  const dist = Math.abs(beamX - 10);
  const lit = clamp01(1 - dist / 14);
  return (
    <group position={[10, -158, -6]} rotation={[0, -0.4, 0]}>
      <mesh scale={[8, 4.2, 5]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color="#0a151c" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh scale={[8.05, 4.25, 5.05]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial
          color="#c8384f"
          emissive="#e0425c"
          emissiveIntensity={1.6}
          transparent
          opacity={0.92 * lit}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
};

/** 海底 */
const Floor: React.FC = () => {
  const rocks = useMemo(
    () =>
      Array.from({ length: 26 }, () => ({
        x: (Math.random() - 0.5) * 180,
        z: (Math.random() - 0.5) * 180,
        s: 1 + Math.random() * 6,
      })),
    []
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -186, 0]}>
        <planeGeometry args={[400, 400, 40, 40]} />
        <meshStandardMaterial color="#050e15" roughness={0.95} metalness={0.05} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, -186 + r.s * 0.4, r.z]} scale={[r.s, r.s * 0.6, r.s]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#08141c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/** 相机 */
const Rig: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  const c = camAt(t);
  const shake = 0.08;
  camera.position.set(
    c.p[0] + Math.sin(t * 1.7) * shake,
    c.p[1] + Math.cos(t * 1.3) * shake,
    c.p[2]
  );
  camera.lookAt(c.l[0], c.l[1], c.l[2]);
  camera.updateProjectionMatrix();
  return null;
};

/* ---------------- 场景 ---------------- */

const Scene: React.FC<{ t: number; frame: number }> = ({ t }) => {
  const { scene } = useThree();
  scene.fog = useMemo(() => new THREE.FogExp2(0x02060b, 0.011), []);
  // 光束位置：S7 扫过
  const beamX = useMemo(() => {
    const a = 25.2, b = 30.2;
    const u = clamp01((t - a) / (b - a));
    return -24 + u * 62;
  }, [t]);

  return (
    <>
      <Rig t={t} />
      <ambientLight intensity={0.22} color="#2a5f7d" />
      <directionalLight position={[6, 40, 18]} intensity={0.55} color="#8fd0ea" />
      <hemisphereLight args={['#0d3550', '#01060b', 0.5]} />

      <Surface />
      <Boat />
      <Shaft pos={[0, 0, 0]} h={130} r={11} o={0.09} />
      <Shaft pos={[0, -20, 0]} h={90} r={16} o={0.05} />
      <Snow t={t} />
      <School t={t} />
      <Jellyfish t={t} />
      <Angler t={t} />
      <RedCreature t={t} beamX={beamX} />
      <Floor />

      {/* S7 探照灯 */}
      {t > 24.6 && (
        <group>
          <Shaft pos={[beamX, -110, -20]} h={90} r={7} o={0.12} />
          <pointLight position={[beamX, -150, 6]} color="#bfefff" intensity={22} distance={40} decay={2} />
        </group>
      )}
    </>
  );
};

export const Film3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const fadeIn = smooth(frame / 14);
  const fadeOut = smooth((durationInFrames - frame) / 12);

  return (
    <AbsoluteFill style={{ background: '#02050a' }}>
      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
        <ThreeCanvas
          width={1920}
          height={1080}
          camera={{ fov: 52, near: 0.1, far: 600, position: [0, 3, 30] }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: '#02050a' }}
        >
          <Scene t={t} frame={frame} />
        </ThreeCanvas>
      </AbsoluteFill>
      {/* 暗角 + 颗粒（DOM 层，便宜） */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(70% 62% at 50% 46%, rgba(0,0,0,0) 36%, rgba(0,0,0,.55) 82%, rgba(0,0,0,.9) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
