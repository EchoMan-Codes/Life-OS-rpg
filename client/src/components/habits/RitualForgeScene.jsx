import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

/**
 * Procedural Three.js consistency core for the Ritual Forge.
 *
 * Implements the Background Direction:
 * - Dark obsidian environment
 * - Original abstract guardian-like silhouette and faceted energy core
 * - Violet / cyan portal lighting
 * - Blue smoke-like procedural trails
 * - Slow ember fragments and floating crystal shards
 * - Subtle cinematic looping movement behind the hero frame
 * - Low-contrast, lightweight, 100% original procedural geometry
 */
export default function RitualForgeScene({ hasActiveStreaks = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animFrameId = null;
    let isMounted = true;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 9.2);

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
    } catch {
      return; // WebGL initialization failed; fallback handled by parent
    }

    // 2. Portal & Ambient Lighting (Cyan & Violet dual portal atmosphere)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.6);
    scene.add(ambientLight);

    const cyanPortalLight = new THREE.PointLight(0x06b6d4, 3.8, 20);
    cyanPortalLight.position.set(3.5, 3.0, 3.5);
    scene.add(cyanPortalLight);

    const violetPortalLight = new THREE.PointLight(0xa855f7, 3.2, 20);
    violetPortalLight.position.set(-3.8, -2.5, 3.0);
    scene.add(violetPortalLight);

    const topRimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    topRimLight.position.set(0, 5, -2);
    scene.add(topRimLight);

    // Group for the entire Guardian Core assembly
    const guardianGroup = new THREE.Group();
    scene.add(guardianGroup);

    // 3. Abstract Guardian Monolith Silhouette (Faceted Obsidian Pylon)
    const monolithGeo = new THREE.ConeGeometry(1.5, 3.8, 6);
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.35,
      metalness: 0.9,
      emissive: 0x1e1b4b,
      emissiveIntensity: 0.4,
      flatShading: true,
    });
    const monolithMesh = new THREE.Mesh(monolithGeo, monolithMat);
    monolithMesh.position.y = -1.2;
    guardianGroup.add(monolithMesh);

    // Monolith cybernetic wireframe edges
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const monolithWire = new THREE.Mesh(monolithGeo, wireframeMat);
    monolithWire.position.y = -1.2;
    monolithWire.scale.set(1.02, 1.02, 1.02);
    guardianGroup.add(monolithWire);

    // 4. Central Faceted Crystal Heart Core (Hovering above the Monolith)
    const heartGeo = new THREE.OctahedronGeometry(1.1, 0);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.2,
      metalness: 0.85,
      emissive: hasActiveStreaks ? 0xd97706 : 0x6d28d9,
      emissiveIntensity: hasActiveStreaks ? 1.0 : 0.7,
      flatShading: true,
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.y = 1.3;
    guardianGroup.add(heartMesh);

    // Outer crystalline wireframe halo
    const heartWireMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const heartWire = new THREE.Mesh(heartGeo, heartWireMat);
    heartWire.position.y = 1.3;
    heartWire.scale.set(1.15, 1.15, 1.15);
    guardianGroup.add(heartWire);

    // 5. Floating Shards (4 satellite faceted fragments)
    const shardsGroup = new THREE.Group();
    guardianGroup.add(shardsGroup);

    const shardGeo = new THREE.TetrahedronGeometry(0.28, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      flatShading: true,
    });

    const shardMeshes = [];
    const shardAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    shardAngles.forEach((angle, idx) => {
      const mesh = new THREE.Mesh(shardGeo, shardMat);
      mesh.position.set(
        Math.cos(angle) * 2.2,
        0.8 + (idx % 2 === 0 ? 0.4 : -0.4),
        Math.sin(angle) * 2.2
      );
      shardsGroup.add(mesh);
      shardMeshes.push(mesh);
    });

    // 6. Orbiting Celestial Arcane Rings
    const ring1Geo = new THREE.TorusGeometry(2.5, 0.02, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 3;
    ring1Mesh.position.y = 1.0;
    guardianGroup.add(ring1Mesh);

    const ring2Geo = new THREE.TorusGeometry(3.0, 0.015, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.5,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.x = -Math.PI / 4;
    ring2Mesh.position.y = 1.0;
    guardianGroup.add(ring2Mesh);

    // 7. Blue Smoke-Like Procedural Trails & Floating Embers
    const smokeCount = 50;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    const smokeVelocities = [];

    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3;
      smokePos[i3] = (Math.random() - 0.5) * 3.5;
      smokePos[i3 + 1] = (Math.random() - 0.5) * 5.0;
      smokePos[i3 + 2] = (Math.random() - 0.5) * 3.0;

      smokeVelocities.push({
        y: 0.3 + Math.random() * 0.4,
        swaySpeed: 1.0 + Math.random() * 1.5,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: hasActiveStreaks ? 0xf59e0b : 0x38bdf8,
      size: 0.09,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    scene.add(smokeParticles);

    // 8. Animation Loop with Tab Visibility Guard
    let clock = new THREE.Clock();

    const renderLoop = () => {
      if (!isMounted) return;

      if (!document.hidden) {
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Rotate Guardian assembly slowly
        guardianGroup.rotation.y += delta * 0.22;

        // Rotate Heart Core independently
        heartMesh.rotation.y += delta * 0.45;
        heartMesh.rotation.z += delta * 0.2;
        heartWire.rotation.y = heartMesh.rotation.y;
        heartWire.rotation.z = heartMesh.rotation.z;

        // Gentle levitation bob
        const bob = Math.sin(elapsedTime * 1.4) * 0.12;
        heartMesh.position.y = 1.3 + bob;
        heartWire.position.y = 1.3 + bob;

        // Orbit satellite shards
        shardsGroup.rotation.y -= delta * 0.35;
        shardMeshes.forEach((shard, idx) => {
          shard.rotation.x += delta * 0.8;
          shard.rotation.y += delta * 0.6;
          shard.position.y = 0.8 + Math.sin(elapsedTime * 2.0 + idx) * 0.15;
        });

        // Counter-rotate celestial rings
        ring1Mesh.rotation.z += delta * 0.35;
        ring2Mesh.rotation.z -= delta * 0.25;

        // Animate Smoke Trails drifting upward
        const posAttr = smokeGeo.attributes.position;
        const array = posAttr.array;
        for (let i = 0; i < smokeCount; i++) {
          const i3 = i * 3;
          const vel = smokeVelocities[i];

          array[i3 + 1] += vel.y * delta; // Rise
          array[i3] += Math.sin(elapsedTime * vel.swaySpeed + vel.swayOffset) * 0.006; // Sway

          // Loop back to bottom if past top
          if (array[i3 + 1] > 3.5) {
            array[i3 + 1] = -2.5;
            array[i3] = (Math.random() - 0.5) * 3.0;
          }
        }
        posAttr.needsUpdate = true;

        renderer.render(scene, camera);
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer) return;
      const newWidth = container.clientWidth || 400;
      const newHeight = container.clientHeight || 400;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 10. Cleanup & Full Resource Disposal
    return () => {
      isMounted = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);

      // Dispose Geometries
      monolithGeo.dispose();
      heartGeo.dispose();
      shardGeo.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      smokeGeo.dispose();

      // Dispose Materials
      monolithMat.dispose();
      wireframeMat.dispose();
      heartMat.dispose();
      heartWireMat.dispose();
      shardMat.dispose();
      ring1Mat.dispose();
      ring2Mat.dispose();
      smokeMat.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [hasActiveStreaks]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    />
  );
}

RitualForgeScene.propTypes = {
  hasActiveStreaks: PropTypes.bool,
};

