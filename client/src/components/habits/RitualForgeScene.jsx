import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

/**
 * Procedural Three.js consistency core for the Ritual Forge.
 * Creates an original, lightweight 3D celestial energy crystal and orbiting rings.
 * Zero external assets, textures, or copied meshes.
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
    camera.position.set(0, 0, 8.5);

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

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.4);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3.0, 18);
    cyanLight.position.set(3, 4, 4);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0xa855f7, 2.5, 18);
    violetLight.position.set(-4, -3, 3);
    scene.add(violetLight);

    // 3. Central Faceted Crystal (Icosahedron with dual visual layers)
    const crystalGeo = new THREE.IcosahedronGeometry(1.5, 0);

    // Inner faceted crystal
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x6d28d9,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0x4c1d95,
      emissiveIntensity: hasActiveStreaks ? 0.9 : 0.6,
      flatShading: true,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    scene.add(crystalMesh);

    // Outer cybernetic wireframe halo
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const wireframeMesh = new THREE.Mesh(crystalGeo, wireframeMat);
    wireframeMesh.scale.set(1.08, 1.08, 1.08);
    scene.add(wireframeMesh);

    // 4. Orbiting Celestial Torus Rings
    const ring1Geo = new THREE.TorusGeometry(2.4, 0.02, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.75,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 3;
    ring1Mesh.rotation.y = Math.PI / 8;
    scene.add(ring1Mesh);

    const ring2Geo = new THREE.TorusGeometry(3.1, 0.015, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.6,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.x = -Math.PI / 4;
    ring2Mesh.rotation.y = -Math.PI / 6;
    scene.add(ring2Mesh);

    // 5. Stardust & Ember Particles
    const particleCount = 35;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.0 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: hasActiveStreaks ? 0xf59e0b : 0x22d3ee,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Animation Loop with Tab Visibility Guard
    let clock = new THREE.Clock();

    const renderLoop = () => {
      if (!isMounted) return;

      if (!document.hidden) {
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Rotate crystal slowly
        crystalMesh.rotation.y += delta * 0.35;
        crystalMesh.rotation.x += delta * 0.15;
        wireframeMesh.rotation.y = crystalMesh.rotation.y;
        wireframeMesh.rotation.x = crystalMesh.rotation.x;

        // Counter-rotate celestial rings
        ring1Mesh.rotation.z += delta * 0.45;
        ring2Mesh.rotation.z -= delta * 0.3;

        // Subtle floating bob
        const bob = Math.sin(elapsedTime * 1.5) * 0.08;
        crystalMesh.position.y = bob;
        wireframeMesh.position.y = bob;

        // Rotate particles
        particles.rotation.y += delta * 0.1;

        renderer.render(scene, camera);
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !renderer) return;
      const newWidth = container.clientWidth || 400;
      const newHeight = container.clientHeight || 400;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Cleanup & Disposal
    return () => {
      isMounted = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js objects
      crystalGeo.dispose();
      crystalMat.dispose();
      wireframeMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

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
