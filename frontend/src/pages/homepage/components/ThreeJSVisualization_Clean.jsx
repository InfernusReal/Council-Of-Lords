import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeJSVisualization = ({
  currentStar,
  habitability,
  planetRadiusEarth, 
  planetPeriodDays, 
  planetMassEarth 
}) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // 🎥 CAMERA SETUP 🎥
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);

    // 🖥️ RENDERER SETUP 🖥️
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // 🎮 ORBIT CONTROLS 🎮
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // ⭐ STAR CREATION ⭐
    const createStar = () => {
      const starGroup = new THREE.Group();
      
      const starRadius = Math.max(currentStar.radiusKm / 100000, 0.8);
      const starGeometry = new THREE.SphereGeometry(starRadius, 64, 32);
      
      const starColor = new THREE.Color(currentStar.color);
      const starMaterial = new THREE.MeshBasicMaterial({
        color: starColor,
        emissive: starColor,
        emissiveIntensity: 0.8,
      });
      
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.castShadow = false;
      starGroup.add(starMesh);

      // Stellar particle effect
      const particleCount = 1000;
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleVelocities = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = starRadius + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i3 + 2] = radius * Math.cos(phi);
        
        particleVelocities[i3] = (Math.random() - 0.5) * 0.02;
        particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
        particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(particleVelocities, 3));
      
      const particleMaterial = new THREE.PointsMaterial({
        color: starColor,
        size: 0.5,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: false,
      });
      
      const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      starGroup.add(particleSystem);

      return { starGroup, particleSystem };
    };

    // 🪐 PLANET CREATION WITH MASSIVE SCALE! 🪐
    const createPlanet = () => {
      const planetGroup = new THREE.Group();
      
      // Scale the planet for visibility
      const PLANET_SCALE = 10.0;
      const planetRadius = Math.max(planetRadiusEarth * PLANET_SCALE, 2.0);
      const planetGeometry = new THREE.SphereGeometry(planetRadius, 32, 16);
      
      let planetTexture;
      if (habitability.isInHabitableZone) {
        planetTexture = new THREE.MeshPhongMaterial({
          color: 0x4a90e2,
          emissive: 0x002244,
          shininess: 100,
          specular: 0x111111,
        });
      } else if (habitability.equilibriumTemp > 373) {
        planetTexture = new THREE.MeshPhongMaterial({
          color: 0xff4500,
          emissive: 0x442200,
          shininess: 30,
        });
      } else {
        planetTexture = new THREE.MeshPhongMaterial({
          color: 0x8b4513,
          emissive: 0x221100,
          shininess: 10,
        });
      }
      
      const planetMesh = new THREE.Mesh(planetGeometry, planetTexture);
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      planetGroup.add(planetMesh);

      return { planetGroup, planetMesh };
    };

    // Create the planet pointer
    const createPlanetPointer = (planetGroup) => {
      const arrowGroup = new THREE.Group();
      
      const shaftGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
      const shaftMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.3
      });
      const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
      shaft.rotation.x = Math.PI / 2;
      arrowGroup.add(shaft);
      
      const headGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
      const headMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.z = -2.75;
      head.rotation.x = Math.PI / 2;
      arrowGroup.add(head);
      
      arrowGroup.position.copy(planetGroup.position);
      arrowGroup.position.y += 10;
      
      return arrowGroup;
    };

    // Orbital path
    const createOrbitPath = () => {
      const orbitRadius = habitability.semiMajorAxisAU * 3;
      const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.1, orbitRadius + 0.1, 128);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x4169e1,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitMesh.rotation.x = -Math.PI / 2;
      
      return { orbitMesh, orbitRadius };
    };

    // 💡 LIGHTING SETUP 💡
    const setupLighting = () => {
      const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
      scene.add(ambientLight);
      
      const starLight = new THREE.PointLight(currentStar.color, currentStar.luminosity * 3, 100);
      starLight.position.set(0, 0, 0);
      scene.add(starLight);
      
      return starLight;
    };

    // 🎬 BUILD THE SYSTEM! 🎬
    const { starGroup, particleSystem } = createStar();
    const { planetGroup, planetMesh } = createPlanet();
    const { orbitMesh, orbitRadius } = createOrbitPath();
    const planetPointer = createPlanetPointer(planetGroup);
    const starLight = setupLighting();

    planetGroup.position.set(orbitRadius, 0, 0);

    scene.add(starGroup);
    scene.add(planetGroup);
    scene.add(orbitMesh);
    scene.add(planetPointer);

    // 🚨 DEBUG CUBE 🚨
    const testGeometry = new THREE.BoxGeometry(2, 2, 2);
    const testMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      wireframe: true 
    });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(-5, 5, 5);
    scene.add(testCube);

    // 🎭 ANIMATION LOOP! 🎭
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      starGroup.rotation.y += 0.005;
      
      const positions = particleSystem.geometry.attributes.position.array;
      const velocities = particleSystem.geometry.attributes.velocity.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        const distance = Math.sqrt(
          positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2
        );
        if (distance > 10) {
          const starRadius = Math.max(currentStar.radiusKm / 100000, 0.8);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          
          positions[i] = starRadius * Math.sin(phi) * Math.cos(theta);
          positions[i + 1] = starRadius * Math.sin(phi) * Math.sin(theta);
          positions[i + 2] = starRadius * Math.cos(phi);
        }
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
      
      const orbitSpeed = (2 * Math.PI) / (planetPeriodDays * 0.1);
      planetGroup.position.x = orbitRadius * Math.cos(time * orbitSpeed);
      planetGroup.position.z = orbitRadius * Math.sin(time * orbitSpeed);
      
      planetPointer.position.copy(planetGroup.position);
      planetPointer.position.y += 10;
      planetPointer.rotation.y += 0.05;
      
      planetMesh.rotation.y += 0.02;
      
      controls.update();
      renderer.render(scene, camera);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, [habitability, currentStar, planetRadiusEarth, planetPeriodDays, planetMassEarth]);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-96 rounded-xl overflow-hidden bg-black border border-cyan-500/40"
      style={{ minHeight: '400px' }}
    />
  );
};

export default ThreeJSVisualization;
