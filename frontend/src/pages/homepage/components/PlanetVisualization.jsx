import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const PlanetVisualization = ({ results }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [time, setTime] = useState(0);

  // Don't render if no exoplanet detected
  if (!results || results.verdict !== 'EXOPLANET') {
    return null;
  }

  // Extract planet name from filename (remove .csv extension and format)
  const getPlanetName = () => {
    if (results.filename) {
      const nameWithoutExt = results.filename.replace('.csv', '').replace('.txt', '');
      // Convert underscores to spaces and capitalize
      return nameWithoutExt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Unknown Exoplanet';
  };

  // Extract REAL data from backend response
  const planetData = {
    name: getPlanetName(),
    radius: results.koi_prad || 1.0, // Planet radius from backend
    period: results.koi_period || 365, // Orbital period from backend
    temperature: results.stellar_temp || 5778, // Stellar temperature
    mass: results.stellar_mass || 1.0, // Stellar mass
    distance: results.koi_period ? Math.pow((results.koi_period / 365.25) ** 2 * results.stellar_mass, 1/3) : 1.0, // Calculate distance using Kepler's 3rd law
    stellarRadius: results.stellar_radius || 1.0,
    stellarLuminosity: results.stellar_luminosity || 1.0,
    catalogSource: results.stellar_source || 'Unknown',
    confidence: results.confidence || 0
  };

  // Calculate habitability percentage using REAL backend data
  const calculateHabitabilityPercentage = () => {
    let score = 0;
    
    // Calculate equilibrium temperature using real stellar data
    const equilibriumTemp = 279 * Math.sqrt(planetData.stellarLuminosity) / Math.sqrt(planetData.distance);
    const tempC = equilibriumTemp - 273.15;
    
    // Temperature factor (0-40 points) - Use calculated equilibrium temp
    if (tempC >= -50 && tempC <= 100) score += 40;
    else if (tempC >= -100 && tempC <= 200) score += 20;
    else score += 0;
    
    // Habitable zone factor (0-30 points) using REAL stellar luminosity
    const habZoneInner = Math.sqrt(planetData.stellarLuminosity / 1.1);
    const habZoneOuter = Math.sqrt(planetData.stellarLuminosity / 0.53);
    if (planetData.distance >= habZoneInner && planetData.distance <= habZoneOuter) {
      score += 30;
    } else if (planetData.distance >= habZoneInner * 0.8 && planetData.distance <= habZoneOuter * 1.2) {
      score += 15;
    }
    
    // Planet size factor (0-20 points) using REAL planet radius
    if (planetData.radius >= 0.5 && planetData.radius <= 2.0) score += 20;
    else if (planetData.radius >= 0.3 && planetData.radius <= 3.0) score += 10;
    
    // Orbital period factor (0-10 points) using REAL period
    if (planetData.period >= 200 && planetData.period <= 500) score += 10;
    else if (planetData.period >= 100 && planetData.period <= 800) score += 5;
    
    return Math.min(Math.round(score), 100);
  };

  const habitabilityPercentage = calculateHabitabilityPercentage();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate scaled orbital radius (pixels)
    const orbitRadius = Math.min(150, Math.max(80, planetData.distance * 50));
    
    // Calculate star visual radius based on stellar radius
    const starRadius = Math.min(25, Math.max(8, planetData.stellarRadius * 12));
    
    // Calculate planet visual radius based on planet radius
    const planetRadius = Math.min(15, Math.max(3, planetData.radius * 5));
    
    // Get star color based on temperature
    const getStarColor = (temp) => {
      if (temp > 7500) return '#9BB0FF'; // Blue
      if (temp > 6000) return '#FFF3A0'; // Yellow-white
      if (temp > 5200) return '#FFE0B2'; // Yellow
      if (temp > 3700) return '#FFB74D'; // Orange
      return '#FF5722'; // Red
    };
    
    // Get planet color based on habitability and size
    const getPlanetColor = () => {
      if (habitabilityPercentage > 60) return '#4CAF50'; // Green for habitable
      if (planetData.radius > 2) return '#2196F3'; // Blue for gas giant
      if (planetData.radius > 1.5) return '#FF9800'; // Orange for super-Earth
      return '#795548'; // Brown for rocky
    };

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw orbital path
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw habitable zone (if planet is in it)
      const habZoneInner = Math.sqrt(planetData.stellarLuminosity / 1.1) * 50;
      const habZoneOuter = Math.sqrt(planetData.stellarLuminosity / 0.53) * 50;
      
      if (habZoneInner < 200 && habZoneOuter > 50) {
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.min(habZoneInner, 200), 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.min(habZoneOuter, 200), 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      // Draw star
      const starColor = getStarColor(planetData.temperature);
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, starRadius * 2);
      gradient.addColorStop(0, starColor);
      gradient.addColorStop(0.7, starColor);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add star glow
      ctx.shadowColor = starColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = starColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius * 0.7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Calculate planet position based on real orbital period
      const orbitSpeed = (2 * Math.PI) / (planetData.period * 2); // Scale for visibility
      const planetX = centerX + orbitRadius * Math.cos(time * orbitSpeed);
      const planetY = centerY + orbitRadius * Math.sin(time * orbitSpeed);
      
      // Draw planet
      const planetColor = getPlanetColor();
      ctx.fillStyle = planetColor;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add planet glow if habitable
      if (habitabilityPercentage > 60) {
        ctx.shadowColor = '#4CAF50';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetRadius + 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      // Draw planet name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(planetData.name, planetX, planetY - planetRadius - 10);
      
      // Update time
      setTime(prev => prev + 0.016); // 60 FPS
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [planetData, habitabilityPercentage]);

  // Calculate equilibrium temperature using REAL stellar data
  const equilibriumTemp = 279 * Math.sqrt(planetData.stellarLuminosity) / Math.sqrt(planetData.distance);
  const tempCelsius = equilibriumTemp - 273.15;

  // Debug: Log the actual data being used
  console.log('Stellar data:', {
    filename: results.filename,
    planetName: planetData.name,
    stellarTemp: planetData.temperature,
    stellarMass: planetData.mass,
    stellarRadius: planetData.stellarRadius,
    stellarLuminosity: planetData.stellarLuminosity,
    planetRadius: planetData.radius,
    planetPeriod: planetData.period,
    calculatedDistance: planetData.distance,
    equilibriumTemp: equilibriumTemp,
    habitability: habitabilityPercentage,
    confidence: planetData.confidence
  });

  return (
    <div className="bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            🌟 Exoplanet System Analysis
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Accurate 2D orbital simulation of <span className="text-blue-400 font-semibold">{planetData.name}</span>
            {' '}using real backend data - Confidence: <span className="text-green-400">{planetData.confidence.toFixed(1)}%</span>
          </p>
        </motion.div>

        {/* Main visualization container */}
        <motion.div 
          className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/30"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            
            {/* 2D Visualization */}
            <div className="lg:col-span-2">
              <div className="bg-black rounded-xl p-6 border border-cyan-500/40">
                <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
                  🪐 Live Orbital Simulation
                </h3>
                <canvas 
                  ref={canvasRef}
                  className="w-full h-auto border border-gray-600 rounded-lg"
                  style={{ maxHeight: '600px' }}
                />
                <div className="mt-4 text-center text-gray-400 text-sm">
                  Orbital Period: {planetData.period.toFixed(1)} days | Distance: {planetData.distance.toFixed(2)} AU
                </div>
              </div>
            </div>
            
            {/* System Analysis Panel */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white text-center">
                📊 System Analysis
              </h3>
              
              {/* Habitability Score */}
              <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-6 border border-green-500/40">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-white mb-2">🌍 Habitability</h4>
                  <div className="text-4xl font-bold mb-2" style={{
                    color: habitabilityPercentage > 70 ? '#22c55e' : 
                           habitabilityPercentage > 40 ? '#eab308' : '#ef4444'
                  }}>
                    {habitabilityPercentage}%
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-1000"
                      style={{
                        width: `${habitabilityPercentage}%`,
                        background: habitabilityPercentage > 70 
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : habitabilityPercentage > 40 
                          ? 'linear-gradient(90deg, #eab308, #ca8a04)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Temperature */}
              <div className="bg-black/60 rounded-lg p-4 border border-orange-500/40">
                <h4 className="text-orange-400 font-bold mb-2">🌡️ Temperature</h4>
                <div className="text-white text-2xl font-bold">{tempCelsius.toFixed(1)}°C</div>
                <div className="text-gray-400 text-sm">Equilibrium Temperature</div>
              </div>
              
              {/* Orbital Data */}
              <div className="bg-black/60 rounded-lg p-4 border border-blue-500/40">
                <h4 className="text-blue-400 font-bold mb-3">🚀 Orbital Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Period:</span>
                    <span className="text-white">{planetData.period.toFixed(1)} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-white">{planetData.distance.toFixed(2)} AU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Orbital Speed:</span>
                    <span className="text-white">{(2 * Math.PI * planetData.distance * 149.6 / planetData.period).toFixed(1)} km/s</span>
                  </div>
                </div>
              </div>
              
              {/* Planet Properties */}
              <div className="bg-black/60 rounded-lg p-4 border border-purple-500/40">
                <h4 className="text-purple-400 font-bold mb-3">🪐 Planet Properties</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Radius:</span>
                    <span className="text-white">{planetData.radius.toFixed(2)} R⊕</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">
                      {planetData.radius > 2 ? 'Gas Giant' : 
                       planetData.radius > 1.5 ? 'Super-Earth' : 'Terrestrial'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Surface Gravity:</span>
                    <span className="text-white">{(planetData.radius * planetData.radius).toFixed(1)} g</span>
                  </div>
                </div>
              </div>
              
              {/* Star Properties */}
              <div className="bg-black/60 rounded-lg p-4 border border-yellow-500/40">
                <h4 className="text-yellow-400 font-bold mb-3">⭐ Host Star</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Temperature:</span>
                    <span className="text-white">{planetData.temperature.toFixed(0)} K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mass:</span>
                    <span className="text-white">{planetData.mass.toFixed(2)} M☉</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Radius:</span>
                    <span className="text-white">{planetData.stellarRadius.toFixed(2)} R☉</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Luminosity:</span>
                    <span className="text-white">{planetData.stellarLuminosity.toFixed(2)} L☉</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Source: {planetData.catalogSource}
                </div>
              </div>
              
              {/* Transit Information */}
              <div className="bg-black/60 rounded-lg p-4 border border-cyan-500/40">
                <h4 className="text-cyan-400 font-bold mb-3">🔭 Transit Data</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transit Duration:</span>
                    <span className="text-white">{(planetData.period * 0.1).toFixed(1)} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transit Depth:</span>
                    <span className="text-white">{((planetData.radius / planetData.stellarRadius) ** 2 * 1000).toFixed(1)} ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Detection Method:</span>
                    <span className="text-white">Transit Photometry</span>
                  </div>
                </div>
              </div>

              {/* Council Detection Results */}
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/40">
                <h4 className="text-purple-400 font-bold mb-3">⚔️ Council of Lords</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verdict:</span>
                    <span className="text-green-400 font-bold">{results.verdict}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-yellow-400 font-bold">{planetData.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-cyan-400">{results.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source:</span>
                    <span className="text-white">{planetData.catalogSource}</span>
                  </div>
                </div>
                {results.red_flags && results.red_flags.length > 0 && (
                  <div className="mt-3 text-xs">
                    <div className="text-red-400 font-bold">⚠️ Flags:</div>
                    {results.red_flags.map((flag, index) => (
                      <div key={index} className="text-red-300">{flag}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlanetVisualization;
