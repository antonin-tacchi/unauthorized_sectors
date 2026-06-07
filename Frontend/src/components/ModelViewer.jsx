import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress, Html } from "@react-three/drei";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-white/60 text-sm">
        <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#6b5cff] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

function Model({ url }) {
  const { scene } = useGLTF(url);

  // Dispose geometry & materials on unmount to free VRAM
  useEffect(() => {
    return () => {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            Object.values(m).forEach((v) => v?.isTexture && v.dispose());
            m.dispose();
          });
        }
      });
      useGLTF.clear(url);
    };
  }, [scene, url]);

  return <primitive object={scene} />;
}

function FallbackImage({ src }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0d14]">
      {src ? (
        <img src={src} alt="3D model preview" className="max-h-full max-w-full object-contain opacity-60" />
      ) : (
        <span className="text-white/25 text-sm">3D preview unavailable</span>
      )}
    </div>
  );
}

export default function ModelViewer({ url, fallbackImage }) {
  const supported = useRef((() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  })());

  if (!supported.current) return <FallbackImage src={fallbackImage} />;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-[#0a0d14]" style={{ height: 400 }}>
      <Canvas
        frameloop="demand"           // Render only on user interaction — biggest perf win
        dpr={[1, 1.5]}               // Cap pixel ratio (no 4K rendering)
        gl={{
          antialias: false,          // Disable MSAA (heavy on GPU)
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        camera={{ position: [0, 1.5, 4], fov: 50 }}
        onError={() => {}}
      >
        {/* Cheap lighting — no HDR environment map */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow={false} />
        <directionalLight position={[-5, 2, -5]} intensity={0.4} />

        <Suspense fallback={<Loader />}>
          <Model url={url} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={1}
          maxDistance={10}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
