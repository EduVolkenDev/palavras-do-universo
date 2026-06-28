"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

type SceneQuality = "high" | "balanced" | "reduced";

type UniverseCanvasProps = {
  active: boolean;
  quality: SceneQuality;
  onReady: () => void;
};

type PortalSceneProps = {
  quality: SceneQuality;
  progress: React.MutableRefObject<number>;
};

function createPortalGeometry(quality: SceneQuality) {
  const radialSegments = quality === "high" ? 40 : quality === "balanced" ? 28 : 18;
  const tubularSegments =
    quality === "high" ? 128 : quality === "balanced" ? 88 : 56;
  const geometry = new THREE.TorusGeometry(
    1.34,
    quality === "reduced" ? 0.16 : 0.19,
    radialSegments,
    tubularSegments
  );
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    normal.fromBufferAttribute(geometry.attributes.normal, index);
    const angle = Math.atan2(vertex.y, vertex.x);
    const displacement =
      Math.sin(angle * 3.0 + 0.7) * 0.025 +
      Math.sin(angle * 7.0 - 0.4) * 0.012;

    vertex.addScaledVector(normal, displacement);
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function PortalScene({ quality, progress }: PortalSceneProps) {
  const group = useRef<THREE.Group>(null);
  const portal = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>(
    null
  );
  const innerRim =
    useRef<THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>>(null);
  const membrane =
    useRef<THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial>>(null);
  const portalLight = useRef<THREE.PointLight>(null);
  const ambLight = useRef<THREE.AmbientLight>(null);
  const dirLight = useRef<THREE.DirectionalLight>(null);
  const geometry = useMemo(() => createPortalGeometry(quality), [quality]);
  const { pointer, size } = useThree();

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!group.current || !portal.current || !innerRim.current || !membrane.current) {
      return;
    }

    const chapterProgress = THREE.MathUtils.smoothstep(progress.current, 0, 1);
    const rest = state.clock.elapsedTime;
    const targetScale = THREE.MathUtils.lerp(0.48, 0.86, chapterProgress);
    const pointerStrength =
      quality === "high" ? 0.65 : quality === "balanced" ? 0.38 : 0;
    const targetRotationX =
      pointer.y * 0.055 * pointerStrength + Math.sin(rest * 0.74) * 0.015;
    const targetRotationY =
      pointer.x * 0.075 * pointerStrength + Math.cos(rest * 0.58) * 0.018;

    group.current.scale.setScalar(
      THREE.MathUtils.damp(group.current.scale.x, targetScale, 2.8, delta)
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      targetRotationX,
      2.3,
      delta
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetRotationY,
      2.3,
      delta
    );
    group.current.rotation.z =
      Math.sin(rest * 0.47) * 0.013 +
      Math.sin(rest * 0.83) * 0.007 -
      chapterProgress * 0.028;
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      THREE.MathUtils.lerp(-0.12, 1.6, chapterProgress),
      2.4,
      delta
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      size.width <= 768 ? 0.82 : 0,
      2.4,
      delta
    );

    portal.current.material.emissiveIntensity = THREE.MathUtils.damp(
      portal.current.material.emissiveIntensity,
      THREE.MathUtils.lerp(0.16, 0.52, chapterProgress),
      2.2,
      delta
    );
    innerRim.current.material.emissiveIntensity = THREE.MathUtils.damp(
      innerRim.current.material.emissiveIntensity,
      THREE.MathUtils.lerp(0.28, 0.74, chapterProgress),
      2.2,
      delta
    );
    membrane.current.material.opacity = THREE.MathUtils.damp(
      membrane.current.material.opacity,
      THREE.MathUtils.lerp(0.82, 0.48, chapterProgress),
      2.2,
      delta
    );

    if (portalLight.current) {
      portalLight.current.color.setRGB(
        THREE.MathUtils.lerp(0.44, 0.66, chapterProgress),
        THREE.MathUtils.lerp(0.47, 0.49, chapterProgress),
        0.78
      );
      portalLight.current.intensity = THREE.MathUtils.damp(
        portalLight.current.intensity,
        THREE.MathUtils.lerp(0.85, 2.55, chapterProgress),
        2,
        delta
      );
    }

    if (ambLight.current) {
      ambLight.current.intensity = THREE.MathUtils.damp(
        ambLight.current.intensity,
        THREE.MathUtils.lerp(0.20, 0.42, chapterProgress),
        1.8,
        delta
      );
    }

    if (dirLight.current) {
      dirLight.current.intensity = THREE.MathUtils.damp(
        dirLight.current.intensity,
        THREE.MathUtils.lerp(0.72, 1.25, chapterProgress),
        1.8,
        delta
      );
    }

  });

  return (
    <>
      <ambientLight ref={ambLight} color="#77709b" intensity={0.20} />
      <directionalLight
        ref={dirLight}
        color="#f4d58d"
        intensity={0.72}
        position={[-2.8, 3.2, 4]}
      />
      <pointLight
        ref={portalLight}
        color="#707ac7"
        intensity={0.85}
        distance={7}
        decay={2}
        position={[0, 0, 1.1]}
      />

      <group ref={group} scale={0.64} rotation={[0.02, -0.08, 0]}>
        <mesh ref={membrane} position={[0, 0, -0.34]}>
          <circleGeometry args={[1.22, quality === "reduced" ? 48 : 96]} />
          <meshStandardMaterial
            color="#07060d"
            emissive="#171329"
            emissiveIntensity={0.38}
            metalness={0.15}
            opacity={0.74}
            roughness={0.82}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>

        <mesh ref={portal} geometry={geometry}>
          <meshStandardMaterial
            color="#211d36"
            emissive="#4a456e"
            emissiveIntensity={0.32}
            metalness={0.86}
            roughness={0.22}
          />
        </mesh>

        <mesh ref={innerRim} rotation={[0, 0, 0.025]} scale={0.89}>
          <torusGeometry
            args={[
              1.34,
              quality === "reduced" ? 0.026 : 0.034,
              quality === "high" ? 20 : 12,
              quality === "high" ? 128 : 72,
            ]}
          />
          <meshStandardMaterial
            color="#d7c79d"
            emissive="#8d82bd"
            emissiveIntensity={0.48}
            metalness={0.78}
            roughness={0.24}
          />
        </mesh>

        {[0, 1, 2, 3].map((level) => {
          const scale = 1 - level * 0.115;
          return (
            <mesh
              key={level}
              position={[0, 0, -0.18 - level * 0.16]}
              rotation={[0, 0, level * 0.075]}
              scale={scale}
            >
              <ringGeometry
                args={[
                  1.18,
                  1.205,
                  quality === "reduced" ? 48 : 96,
                ]}
              />
              <meshBasicMaterial
                color={level % 2 === 0 ? "#8d82bd" : "#c9a84c"}
                opacity={0.19 - level * 0.025}
                side={THREE.DoubleSide}
                transparent
              />
            </mesh>
          );
        })}

        <mesh
          position={[0.02, 0.02, -0.05]}
          rotation={[0, 0, -0.68]}
          scale={[1.06, 1.02, 1]}
        >
          <torusGeometry
            args={[
              1.52,
              quality === "reduced" ? 0.026 : 0.038,
              quality === "high" ? 18 : 12,
              quality === "high" ? 112 : 72,
              Math.PI * 1.32,
            ]}
          />
          <meshStandardMaterial
            color="#6f668d"
            emissive="#342e57"
            emissiveIntensity={0.42}
            metalness={0.82}
            roughness={0.28}
          />
        </mesh>

        <mesh
          position={[-0.04, 0.02, 0.08]}
          rotation={[0.04, 0.06, 1.78]}
          scale={[1.02, 0.98, 1]}
        >
          <torusGeometry
            args={[
              1.43,
              quality === "reduced" ? 0.018 : 0.026,
              quality === "high" ? 16 : 10,
              quality === "high" ? 96 : 64,
              Math.PI * 0.72,
            ]}
          />
          <meshStandardMaterial
            color="#c8b88d"
            emissive="#7f6e3d"
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        <mesh position={[0, 0, -0.48]} rotation={[0, 0, Math.PI / 7]}>
          <ringGeometry args={[1.53, 1.57, quality === "reduced" ? 64 : 128]} />
          <meshBasicMaterial
            color="#b8b0d4"
            opacity={0.12}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      </group>
    </>
  );
}

export function UniverseCanvas({
  active,
  quality,
  onReady,
}: UniverseCanvasProps) {
  const progress = useRef(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: "#topo",
      start: "top top",
      end: "900px top",
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <Canvas
      camera={{ fov: 38, near: 0.1, far: 30, position: [0, 0, 5.4] }}
      dpr={quality === "high" ? [1, 1.5] : 1}
      frameloop={active ? "always" : "demand"}
      gl={{
        alpha: true,
        antialias: quality !== "reduced",
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady();
      }}
    >
      <PortalScene quality={quality} progress={progress} />
    </Canvas>
  );
}
