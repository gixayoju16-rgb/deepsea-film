import React, { useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Key = { t: number; p: [number, number, number]; l: [number, number, number] };

const KEYS: Key[] = [
  { t: 0.0, p: [0, 4.2, 42], l: [0, 2.2, 0] },
  { t: 5.2, p: [0, 3.0, 26], l: [0, 0.8, 0] },
  { t: 10.0, p: [0, -34, 15], l: [0, -46, 0] },
  { t: 14.6, p: [0, -56, 13], l: [0, -68, 0] },
  { t: 18.2, p: [5, -79, 46], l: [8, -93, 0] },
  { t: 21.4, p: [-3, -111, 48], l: [-8, -127, 0] },
  { t: 25.2, p: [0, -135, 52], l: [8, -157, -4] },
  { t: 30.2, p: [2, -144, 46], l: [10, -170, -6] },
  { t: 37.2, p: [4, -150, 36], l: [8, -176, -4] },
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

/* ---------- 渲染器设置 ---------- */
const Setup: React.FC = () => {
  const { gl, scene } = useThree();
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.18;
  scene.background = new THREE.Color('#02070d');
  return null;
};

/* ---------- 海面与天空 ---------- */
const Surface: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial color="#0a2536" roughness={0.5} metalness={0.1} />
    </mesh>
    {/* 天光带 */}
    <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[220, 220]} />
      <meshBasicMaterial color="#1d6485" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  </group>
);

/* ---------- 船 ---------- */
const Boat: React.FC = () => {
  const sail = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0, 15);
    s.lineTo(9.4, 0.5);
    s.lineTo(0, 0);
    return new THREE.ShapeGeometry(s);
  }, []);
  return (
    <group position={[0, 0.3, 0]}>
      {/* 船体 */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[13, 1.7, 3.6]} />
        <meshStandardMaterial color="#dcecf5" roughness={0.5} emissive="#6fa9c4" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[7.4, 0.7, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 1]}>
        <coneGeometry args={[1.8, 3.2, 4]} />
        <meshStandardMaterial color="#d3e6f0" roughness={0.5} />
      </mesh>
      {/* 桅杆 */}
      <mesh position={[-0.4, 8.2, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 15, 8]} />
        <meshStandardMaterial color="#d8ecf5" />
      </mesh>
      {/* 主帆 */}
      <mesh geometry={sail} position={[-0.3, 1.2, 0.05]}>
        <meshStandardMaterial color="#f4fbff" emissive="#9fd3e8" emissiveIntensity={0.22} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* 舷窗光 */}
      <pointLight position={[0, -1.0, 0]} color="#9fe3ff" intensity={70} distance={80} decay={2} />
      <pointLight position={[4, 2.2, 0]} color="#8fd4ee" intensity={20} distance={30} decay={2} />
    </group>
  );
};

/* ---------- 光柱（软贴图双面片，避免锥体看成实心筒） ---------- */
let beamTex: THREE.Texture | null = null;
const getBeamTex = () => {
  if (beamTex) return beamTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d')!;
  const img = g.createImageData(64, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 64; x++) {
      const u = x / 63;
      const v = y / 255;
      const edge = Math.sin(Math.PI * u);
      const a = Math.pow(edge, 2.0) * Math.pow(1 - v, 1.35) * 255;
      const i = (y * 64 + x) * 4;
      img.data[i] = 235;
      img.data[i + 1] = 250;
      img.data[i + 2] = 255;
      img.data[i + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  beamTex = new THREE.CanvasTexture(c);
  beamTex.needsUpdate = true;
  return beamTex;
};

const Shaft: React.FC<{ pos: [number, number, number]; h?: number; w?: number; o?: number }> = ({
  pos,
  h = 150,
  w = 22,
  o = 0.85,
}) => {
  const tex = useMemo(getBeamTex, []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        color: '#cdf3ff',
        transparent: true,
        opacity: o,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [tex, o]
  );
  return (
    <group position={[pos[0], pos[1] - h / 2, pos[2]]}>
      <mesh material={mat}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh material={mat} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
};

/* ---------- 圆点贴图 ---------- */
let dotTex: THREE.Texture | null = null;
const getDotTex = () => {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(220,245,255,0.55)');
  grd.addColorStop(1, 'rgba(200,240,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
};

/* ---------- 海雪 ---------- */
const Snow: React.FC<{ t: number; n?: number }> = ({ t, n = 2600 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 220;
      pos[i * 3 + 1] = 10 - Math.random() * 240;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [n]);
  const tex = useMemo(getDotTex, []);
  return (
    <points geometry={geo} rotation={[0, t * 0.015, 0]}>
      <pointsMaterial
        map={tex}
        color="#d9f6ff"
        size={1.1}
        sizeAttenuation
        transparent
        opacity={0.55}
        alphaTest={0.01}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/* ---------- 鱼群 ---------- */
const School: React.FC<{ t: number }> = ({ t }) => {
  const items = useMemo(
    () =>
      Array.from({ length: 80 }, () => ({
        y: -72 + (Math.random() - 0.5) * 34,
        z: (Math.random() - 0.5) * 80,
        x0: (Math.random() - 0.5) * 160,
        s: 1.2 + Math.random() * 1.6,
        sp: 2.5 + Math.random() * 3.5,
        ph: Math.random() * 6.28,
      })),
    []
  );
  return (
    <group>
      {items.map((b, i) => {
        const x = ((((b.x0 + t * b.sp) % 180) + 180) % 180) - 90;
        return (
          <mesh
            key={i}
            position={[x, b.y + Math.sin(t * 0.6 + b.ph) * 1.6, b.z]}
            scale={[b.s, b.s * 0.4, b.s * 0.24]}
          >
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial
              color="#020a0f"
              roughness={0.55}
              metalness={0.1}
              emissive="#06202b"
              emissiveIntensity={0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- 水母 ---------- */
const Jellyfish: React.FC<{ t: number }> = ({ t }) => {
  const pulse = 1 + Math.sin(t * 3.1) * 0.07;
  const tents = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  return (
    <group position={[8, -92 + Math.sin(t * 0.8) * 1.4, -2]} scale={[pulse, 1 / pulse, pulse]}>
      <mesh>
        <sphereGeometry args={[5.6, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial
          color="#0a2733"
          emissive="#12647d"
          emissiveIntensity={0.85}
          transparent
          opacity={0.92}
          roughness={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -1.4, 0]}>
        <sphereGeometry args={[4.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <meshStandardMaterial color="#08222c" emissive="#0f5c73" emissiveIntensity={0.7} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 6, -12]} color="#7fe5ff" intensity={120} distance={60} decay={2} />
      <pointLight color="#3fc3e0" intensity={16} distance={26} decay={2} />
      {tents.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 3.6, -7 + Math.sin(t * 1.6 + i) * 0.9, Math.sin(a) * 3.6]}
          rotation={[0.15, a, 0.12]}
        >
          <cylinderGeometry args={[0.07, 0.02, 14, 5]} />
          <meshStandardMaterial
            color="#8fe6ff"
            emissive="#5fd0ea"
            emissiveIntensity={1.4}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- 鮟鱇 ---------- */
const Angler: React.FC<{ t: number }> = ({ t }) => {
  const body = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const r = 0.5 + Math.sin(u * Math.PI) * 5.0;
      pts.push(new THREE.Vector2(r, (u - 0.5) * 16));
    }
    return new THREE.LatheGeometry(pts, 22);
  }, []);
  return (
    <group position={[-8, -128, -2]} rotation={[0, 0.55, 0]}>
      <mesh geometry={body} scale={[1, 1, 0.78]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial
          color="#061a22"
          roughness={0.5}
          metalness={0.2}
          emissive="#0a2c39"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* 尾鳍 */}
      <mesh position={[7, 0, 0]} scale={[1, 1.6, 0.2]}>
        <coneGeometry args={[2.2, 4.5, 4]} />
        <meshStandardMaterial color="#1b3b46" roughness={0.7} emissive="#0e2733" emissiveIntensity={0.3} />
      </mesh>
      {/* 牙 */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-4.6 + i * 1.02, 2.6 - i * 0.14, 1.3]} rotation={[0, 0, 0.22]}>
          <coneGeometry args={[0.14, 1.2, 5]} />
          <meshStandardMaterial color="#e8f7ff" emissive="#7fc4dd" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* 诱饵杆 */}
      <mesh position={[-4.2, 6.6, 0]} rotation={[0, 0, -0.55]}>
        <cylinderGeometry args={[0.09, 0.09, 7, 6]} />
        <meshStandardMaterial color="#1c3945" emissive="#0d2029" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-1.4, 9.4 + Math.sin(t * 1.4) * 0.35, 0]}>
        <sphereGeometry args={[0.55, 18, 14]} />
        <meshStandardMaterial color="#fbffff" emissive="#b8f8ff" emissiveIntensity={7} />
      </mesh>
      <pointLight position={[-1.4, 9.2, 0]} color="#b3f6ff" intensity={70} distance={45} decay={2} />
      <pointLight position={[2, 2, -16]} color="#3fd0f0" intensity={130} distance={50} decay={2} />
    </group>
  );
};

/* ---------- 红光生物 ---------- */
const RedCreature: React.FC<{ beamX: number }> = ({ beamX }) => {
  const dist = Math.abs(beamX - 10);
  const lit = clamp01(1 - dist / 13);
  return (
    <group position={[10, -158, -6]} rotation={[0, -0.4, 0]}>
      <mesh scale={[9, 4.6, 5.4]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#0a1116" roughness={0.55} metalness={0.15} emissive="#0d1b24" emissiveIntensity={0.3} />
      </mesh>
      <mesh scale={[9.06, 4.66, 5.46]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial
          color="#8e1c2c"
          emissive="#e0354c"
          emissiveIntensity={1.2}
          transparent
          opacity={0.55 * lit}
          roughness={0.45}
        />
      </mesh>
      <pointLight position={[0, 0, -14]} color="#ff4a63" intensity={60 * lit} distance={40} decay={2} />
    </group>
  );
};

/* ---------- 海底 ---------- */
const Floor: React.FC = () => {
  const rocks = useMemo(
    () =>
      Array.from({ length: 30 }, () => ({
        x: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200,
        s: 1 + Math.random() * 7,
      })),
    []
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -186, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#0b1d27" roughness={0.92} metalness={0.05} emissive="#071319" emissiveIntensity={0.4} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, -186 + r.s * 0.35, r.z]} scale={[r.s, r.s * 0.55, r.s]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#10242e" roughness={0.85} emissive="#08161d" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- 相机 ---------- */
const Rig: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  const c = camAt(t);
  camera.position.set(
    c.p[0] + Math.sin(t * 1.7) * 0.06,
    c.p[1] + Math.cos(t * 1.3) * 0.06,
    c.p[2]
  );
  camera.lookAt(c.l[0], c.l[1], c.l[2]);
  return null;
};

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const { scene } = useThree();
  useMemo(() => {
    scene.fog = new THREE.FogExp2(0x04141f, 0.026);
  }, [scene]);
  const beamX = useMemo(() => {
    const u = clamp01((t - 25.2) / 5.0);
    return -26 + u * 64;
  }, [t]);

  return (
    <>
      <Setup />
      <Rig t={t} />
      <ambientLight intensity={0.55} color="#2f6f8f" />
      <directionalLight position={[8, 50, 22]} intensity={0.9} color="#a8dff5" />
      <hemisphereLight args={['#1a5f80', '#010609', 0.7]} />

      <Surface />
      <Boat />
      <Shaft pos={[-9, 2, -26]} h={180} w={11} o={0.30} />
      <Shaft pos={[11, 2, -34]} h={160} w={9} o={0.24} />
      <Snow t={t} />
      <School t={t} />
      <Jellyfish t={t} />
      <Angler t={t} />
      <RedCreature beamX={beamX} />
      <Floor />

      {t > 24.6 && (
        <group>
          <Shaft pos={[beamX, -104, -18]} h={120} w={13} o={0.4} />
          <pointLight position={[beamX, -150, 6]} color="#cdf3ff" intensity={60} distance={50} decay={2} />
        </group>
      )}
    </>
  );
};

export const Film3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const fadeIn = smooth(frame / 12);
  const fadeOut = smooth((durationInFrames - frame) / 12);

  return (
    <AbsoluteFill style={{ background: '#02070d' }}>
      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
        <ThreeCanvas
          width={1920}
          height={1080}
          camera={{ fov: 50, near: 0.1, far: 500, position: [0, 4, 40] }}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(72% 64% at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,.45) 84%, rgba(0,0,0,.82) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
