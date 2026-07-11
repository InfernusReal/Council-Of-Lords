import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeJSVisualization = ({ 
  habitability, 
  currentStar, 
  planetRadiusEarth, 
  planetPeriodDays, 
  realStellarData 
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure black space
    sceneRef.current = scene;

    // 🎥 CAMERA SETUP - DIRECTOR'S VIEW! 🎥
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0); // Look at the star!

    // 🖥️ RENDERER SETUP - THE MAGIC HAPPENS HERE! 🖥️
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

    // 🎮 ORBIT CONTROLS - LET THE USER EXPLORE! 🎮
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // ⭐ STAR CREATION - THE HEART OF THE SYSTEM! ⭐
    const createStar = () => {
      const starGroup = new THREE.Group();
      
      // Main star sphere
      const starRadius = Math.max(currentStar.radiusKm / 100000, 0.8);
      const starGeometry = new THREE.SphereGeometry(starRadius, 64, 32);
      
      // Dynamic star material based on temperature
      const starColor = new THREE.Color(currentStar.color);
      const starMaterial = new THREE.MeshBasicMaterial({
        color: starColor,
        emissive: starColor,
        emissiveIntensity: 0.8,
      });
      
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.castShadow = false; // Stars don't cast shadows, they ARE the light
      starGroup.add(starMesh);

      // Stellar corona effect
      const coronaGeometry = new THREE.SphereGeometry(starRadius * 1.5, 32, 16);
      const coronaMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 starColor;
          uniform float time;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            float noise = sin(vPosition.x * 10.0 + time) * sin(vPosition.y * 10.0 + time) * 0.1;
            intensity += noise;
            gl_FragColor = vec4(starColor, intensity * 0.6);
          }
        `,
        uniforms: {
          starColor: { value: starColor },
          time: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
      });
      
      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      starGroup.add(coronaMesh);

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
        
        // Random velocities for solar wind effect
        particleVelocities[i3] = (Math.random() - 0.5) * 0.02;
        particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
        particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(particleVelocities, 3));
      
      const particleMaterial = new THREE.PointsMaterial({
        color: starColor,
        size: 0.5, // MUCH BIGGER particles! 🌟
        transparent: true,
        opacity: 0.9, // More opaque!
        blending: THREE.AdditiveBlending,
        sizeAttenuation: false, // Don't shrink with distance!
      });
      
      const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      starGroup.add(particleSystem);

      return { starGroup, particleSystem };
    };

    // 🪐 PLANET CREATION - THE WORLD WE'RE STUDYING! 🪐
    const createPlanet = () => {
      const planetGroup = new THREE.Group();
      
      // Scale the planet for visibility
      const PLANET_SCALE = 8.0; // MASSIVE SCALE BOOST!
      const planetRadius = Math.max(planetRadiusEarth * PLANET_SCALE, 2.0); // NEVER smaller than 2 units!
      const planetGeometry = new THREE.SphereGeometry(planetRadius, 32, 16);
      
      // Planet material based on habitability
      let planetTexture;
      if (habitability.isInHabitableZone) {
        // Earth-like with continents and oceans - BRIGHT AND VISIBLE! 🌍
        planetTexture = new THREE.MeshPhongMaterial({
          color: 0x4a90e2,
          emissive: 0x002244, // Brighter emissive glow!
          shininess: 100,
          specular: 0x111111,
        });
      } else if (habitability.equilibriumTemp > 373) {
        // Hot, Venus-like appearance
        planetTexture = new THREE.MeshPhongMaterial({
          color: 0xff4500,
          emissive: 0x442200, // Bright orange glow!
          shininess: 30,
        });
      } else {
        // Cold, Mars-like - RUSTY RED! ❄️
        planetTexture = new THREE.MeshPhongMaterial({
          color: 0x8b4513,
          emissive: 0x221100, // Subtle warm glow!
          shininess: 10,
        });
      }
      
      const planetMesh = new THREE.Mesh(planetGeometry, planetTexture);
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      planetGroup.add(planetMesh);

      // 🌫️ ATMOSPHERE - IF HABITABLE! 🌫️
      if (habitability.isInHabitableZone || planetRadiusEarth > 1.5) {
        const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.1, 32, 16);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
          color: habitability.isInHabitableZone ? 0x87ceeb : 0xffa500,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide,
        });
        
        const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planetGroup.add(atmosphereMesh);
      }

      return { planetGroup, planetMesh };
    };

    // Habitable-zone visualization
    const createHabitableZone = () => {
      const hzGroup = new THREE.Group();
      
      // Inner HZ boundary
      const innerHZGeometry = new THREE.RingGeometry(
        habitability.innerHZ * 5, 
        habitability.innerHZ * 5 + 0.1, 
        64
      );
      const innerHZMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const innerHZMesh = new THREE.Mesh(innerHZGeometry, innerHZMaterial);
      innerHZMesh.rotation.x = -Math.PI / 2;
      hzGroup.add(innerHZMesh);
      
      // Outer HZ boundary
      const outerHZGeometry = new THREE.RingGeometry(
        habitability.outerHZ * 5, 
        habitability.outerHZ * 5 + 0.1, 
        64
      );
      const outerHZMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aa00,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      const outerHZMesh = new THREE.Mesh(outerHZGeometry, outerHZMaterial);
      outerHZMesh.rotation.x = -Math.PI / 2;
      hzGroup.add(outerHZMesh);
      
      return hzGroup;
    };

    // Orbital-path visualization
    const createOrbitPath = () => {
      const orbitRadius = habitability.semiMajorAxisAU * 3; // Closer orbit for visibility!
      const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.05, orbitRadius + 0.05, 128);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x4169e1,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitMesh.rotation.x = -Math.PI / 2;
      
      return orbitMesh;
    };

    // 💡 LIGHTING SETUP - REALISTIC STELLAR ILLUMINATION! 💡
    const setupLighting = () => {
      // Ambient light (cosmic background radiation) - BRIGHTER FOR VISIBILITY! 💡
      const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Much brighter!
      scene.add(ambientLight);
      
      // Point light from the star
      const starLight = new THREE.PointLight(currentStar.color, currentStar.luminosity * 2, 100);
      starLight.position.set(0, 0, 0);
      starLight.castShadow = true;
      starLight.shadow.mapSize.width = 2048;
      starLight.shadow.mapSize.height = 2048;
      starLight.shadow.camera.near = 0.1;
      starLight.shadow.camera.far = 100;
      scene.add(starLight);
      
      return starLight;
    };

    // 🎬 BUILD THE ENTIRE SYSTEM! 🎬
    const { starGroup, particleSystem } = createStar();
    const { planetGroup, planetMesh } = createPlanet();
    const hzGroup = createHabitableZone();
    const orbitPath = createOrbitPath();
    const starLight = setupLighting();

    // Position planet at orbital distance - CLOSER FOR VISIBILITY! 🪐
    const orbitRadius = habitability.semiMajorAxisAU * 3; // Same as orbit path!
    planetGroup.position.set(orbitRadius, 0, 0);

    // Create the planet pointer
    // Add everything to scene
    scene.add(starGroup);
    scene.add(planetGroup);
    scene.add(hzGroup);
    scene.add(orbitPath);

    // 🎭 ANIMATION LOOP - THE COSMIC DANCE! 🎭
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      // Rotate the star
      starGroup.rotation.y += 0.005;
      
      // Animate solar wind particles
      const positions = particleSystem.geometry.attributes.position.array;
      const velocities = particleSystem.geometry.attributes.velocity.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        // Reset particles that go too far
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
      
      // Orbital motion - realistic period scaling
      const orbitSpeed = (2 * Math.PI) / (planetPeriodDays * 0.1); // Scale for visual appeal
      planetGroup.position.x = orbitRadius * Math.cos(time * orbitSpeed);
      planetGroup.position.z = orbitRadius * Math.sin(time * orbitSpeed);
      
      // Planet rotation
      planetMesh.rotation.y += 0.02;
      
      // Update controls
      controls.update();
      
      // Render the scene
      renderer.render(scene, camera);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Release Three.js resources when the effect is disposed
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of geometries and materials
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
  }, [habitability, currentStar, planetRadiusEarth, planetPeriodDays, realStellarData]); // ✅ FIXED DEPENDENCIES!

  return (
    <div 
      ref={mountRef} 
      className="w-full h-96 rounded-xl overflow-hidden bg-black border border-cyan-500/40"
      style={{ minHeight: '400px' }}
    />
  );
}; // ✅ MAIN COMPONENT FUNCTION PROPERLY CLOSED!

export default ThreeJSVisualization;
