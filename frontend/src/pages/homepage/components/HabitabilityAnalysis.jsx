import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Stellar catalog badge definitions
const getCatalogBadge = (source) => {
  const badges = {
    'TIC': { color: 'bg-purple-100 text-purple-800', text: '🛰️ TIC', title: 'TESS Input Catalog' },
    'Gaia': { color: 'bg-blue-100 text-blue-800', text: '🌌 Gaia DR3', title: 'Gaia Data Release 3' },
    'KIC': { color: 'bg-green-100 text-green-800', text: '🔭 KIC', title: 'Kepler Input Catalog' },
    'solar_default': { color: 'bg-yellow-100 text-yellow-800', text: '☀️ Solar', title: 'Solar Default Values' },
    'unknown': { color: 'bg-gray-100 text-gray-800', text: '❓ Unknown', title: 'Unknown Source' }
  };
  
  const badge = badges[source] || badges['unknown'];
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      title={badge.title}
    >
      {badge.text}
    </span>
  );
};

const getCatalogDescription = (source) => {
  const descriptions = {
    'TIC': '🛰️ **TESS Input Catalog**: High-precision stellar parameters from the TESS space telescope mission. Professional-grade data for exoplanet host stars.',
    'Gaia': '🌌 **Gaia Data Release 3**: Ultra-precise stellar parameters from ESA\'s Gaia space observatory. Provides accurate distances, temperatures, and stellar properties.',
    'KIC': '🔭 **Kepler Input Catalog**: Stellar parameters from the original Kepler space telescope mission. Proven data source for thousands of exoplanet discoveries.',
    'solar_default': '☀️ **Solar Default Values**: Standard solar parameters used when catalog data is unavailable. Still provides accurate physics calculations.',
    'unknown': '❓ **Unknown Source**: Stellar parameters from an unknown or mixed source. Physics calculations remain valid.'
  };
  
  return descriptions[source] || descriptions['unknown'];
};

const getCatalogSourceName = (source) => {
  const names = {
    'TIC': 'TESS Input Catalog',
    'Gaia': 'Gaia DR3',
    'KIC': 'Kepler Input Catalog',
    'solar_default': 'Solar defaults',
    'unknown': 'Unknown source'
  };
  
  return names[source] || names['unknown'];
};

const HabitabilityAnalysis = ({ results }) => {
  const [calculations, setCalculations] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [animationTime, setAnimationTime] = useState(0);

  useEffect(() => {
    if (!results) return;

    // Extract backend fields with fallbacks
    console.log('Full backend response:', results);
    console.log('Backend response keys:', Object.keys(results));
    
    // DEBUG: Print ALL KEYS AND VALUES
    console.log('Backend response fields:');
    Object.keys(results).forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}: ${results[key]} (type: ${typeof results[key]})`);
    });
    
    // DEBUG: Print the EXACT STRUCTURE
    console.log('Backend response structure:');
    console.log('   results.stellar_mass exists?', 'stellar_mass' in results);
    console.log('   results.stellar_temperature exists?', 'stellar_temperature' in results);
    console.log('   results.catalog_source exists?', 'catalog_source' in results);
    
    // Print ALL KEYS that start with 'stellar' or 'catalog'
    Object.keys(results).forEach(key => {
      if (key.includes('stellar') || key.includes('catalog')) {
        console.log(`Stellar or catalog field: ${key} = ${results[key]}`);
      }
    });
    
    // Check specifically for stellar data
    console.log('Stellar data received');
    console.log('   stellar_mass:', results.stellar_mass, typeof results.stellar_mass);
    console.log('   stellar_radius:', results.stellar_radius, typeof results.stellar_radius);  
    console.log('   stellar_temperature:', results.stellar_temperature, typeof results.stellar_temperature);
    console.log('   stellar_luminosity:', results.stellar_luminosity, typeof results.stellar_luminosity);
    console.log('   stellar_distance:', results.stellar_distance, typeof results.stellar_distance);
    console.log('   catalog_source:', results.catalog_source, typeof results.catalog_source);
    
    // STELLAR PARAMETERS - Direct from backend with correct field names
    const stellarMass = results.stellar_mass ?? 1.0;           // Solar masses
    const stellarRadius = results.stellar_radius ?? 1.0;       // Solar radii  
    const stellarTemp = results.stellar_temperature ?? 5778;   // Kelvin (CORRECT FIELD NAME!)
    const stellarLuminosity = results.stellar_luminosity ?? 1.0; // Solar luminosities
    const stellarDistance = results.stellar_distance ?? 100.0;   // parsecs
    const stellarSource = results.catalog_source ?? 'unknown';   // TIC/Gaia/KIC/solar_default (CORRECT FIELD NAME!)

    // PLANET PARAMETERS - Direct from backend (lines 401-402 in main.py) with null safety
    const planetPeriod = results.koi_period ?? 365;            // Days (nasa_params[0])
    const planetRadius = results.koi_prad ?? 1.0;              // Earth radii (nasa_params[1])

    console.log('Stellar catalog data received from backend');
    console.log(`   Source: ${stellarSource}`);
    console.log(`   Mass: ${stellarMass} M☉`);
    console.log(`   Radius: ${stellarRadius} R☉`);
    console.log(`   Temperature: ${stellarTemp} K`);
    console.log(`   Luminosity: ${stellarLuminosity} L☉`);
    console.log(`   Distance: ${stellarDistance} pc`);
    
    console.log('Planet data received from backend:');
    console.log(`   Period: ${planetPeriod} days`);
    console.log(`   Radius: ${planetRadius} R⊕`);

    // 🪐 GAS GIANT DETECTION - From signal_analysis (lines 246-260 in main.py) with safety
    const gasGiantDetected = results.signal_analysis?.gas_giant_detected ?? false;
    const gasGiantConfidence = results.signal_analysis?.gas_giant_confidence ?? 0.0;
    const gasGiantType = results.signal_analysis?.gas_giant_type ?? '';
    const gasGiantJupiterRadii = results.signal_analysis?.gas_giant_jupiter_radii ?? 0.0;

    // Calculate derived values from the supplied stellar parameters
    
    // Ensure all values are valid numbers before calculations
    const safeNum = (value, fallback) => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? fallback : num;
    };
    
    const validStellarMass = safeNum(stellarMass, 1.0);
    const validStellarLuminosity = safeNum(stellarLuminosity, 1.0);
    const validPlanetPeriod = safeNum(planetPeriod, 365);
    const validPlanetRadius = safeNum(planetRadius, 1.0);
    
    // 1. KEPLER'S THIRD LAW: Calculate semi-major axis
    // a³ = (GM/4π²) * P²
    const G = 6.67430e-11; // m³ kg⁻¹ s⁻¹
    const M_sun = 1.989e30; // kg
    const AU = 1.496e11; // meters
    
    const stellarMassKg = validStellarMass * M_sun;
    const periodSeconds = validPlanetPeriod * 24 * 3600;
    
    const semiMajorAxisMeters = Math.pow(
      (G * stellarMassKg * Math.pow(periodSeconds, 2)) / (4 * Math.pow(Math.PI, 2)),
      1/3
    );
    const semiMajorAxisAU = semiMajorAxisMeters / AU;
    
    // 2. STEFAN-BOLTZMANN LAW: Calculate equilibrium temperature
    // T_eq = [(L_star / 16πσa²)]^(1/4) * (1-A)^(1/4)
    const sigma_sb = 5.670374419e-8; // W m⁻² K⁻⁴
    const L_sun = 3.828e26; // watts
    const albedo = 0.3; // assumed Bond albedo
    
    const stellarLuminosityWatts = validStellarLuminosity * L_sun;
    const fluxAtPlanet = stellarLuminosityWatts / (4 * Math.PI * Math.pow(semiMajorAxisMeters, 2));
    const equilibriumTemp = Math.pow(
      (fluxAtPlanet * (1 - albedo)) / (4 * sigma_sb),
      1/4
    );
    
    // 3. HABITABLE ZONE CALCULATION
    // Inner edge: sqrt(L_star / 1.1) AU
    // Outer edge: sqrt(L_star / 0.53) AU
    const habitableZoneInner = Math.sqrt(validStellarLuminosity / 1.1);
    const habitableZoneOuter = Math.sqrt(validStellarLuminosity / 0.53);
    
    // 4. HABITABILITY ASSESSMENT
    const inHabitableZone = semiMajorAxisAU >= habitableZoneInner && semiMajorAxisAU <= habitableZoneOuter;
    const isRockySize = validPlanetRadius <= 2.0; // Earth-like to super-Earth
    const temperatureRange = equilibriumTemp >= 200 && equilibriumTemp <= 320; // Liquid water range
    
    // 5. ESI (Earth Similarity Index) calculation
    const radiusESI = 1 - Math.abs((validPlanetRadius - 1.0) / (validPlanetRadius + 1.0));
    const tempESI = 1 - Math.abs((equilibriumTemp - 288) / (equilibriumTemp + 288));
    const fluxESI = 1 - Math.abs((fluxAtPlanet/1361 - 1.0) / (fluxAtPlanet/1361 + 1.0));
    const ESI = Math.pow(radiusESI * tempESI * fluxESI, 1/3);

    // 6. HABITABILITY CLASSIFICATION
    let habitabilityClass = "Unknown";
    let habitabilityColor = "bg-gray-100 text-gray-800";
    let habitabilityDescription = "";
    
    if (gasGiantDetected) {
      habitabilityClass = "Gas Giant";
      habitabilityColor = "bg-purple-100 text-purple-800";
      habitabilityDescription = `${gasGiantType} - Not habitable for surface life, but may have habitable moons.`;
    } else if (inHabitableZone && isRockySize && temperatureRange) {
      habitabilityClass = "Potentially Habitable";
      habitabilityColor = "bg-green-100 text-green-800";
      habitabilityDescription = "Located in the habitable zone with Earth-like characteristics.";
    } else if (inHabitableZone && isRockySize) {
      habitabilityClass = "Habitable Zone";
      habitabilityColor = "bg-blue-100 text-blue-800";
      habitabilityDescription = "In the habitable zone but may have extreme temperatures.";
    } else if (isRockySize) {
      habitabilityClass = "Rocky Planet";
      habitabilityColor = "bg-orange-100 text-orange-800";
      habitabilityDescription = "Rocky composition but outside the habitable zone.";
    } else {
      habitabilityClass = "Large Planet";
      habitabilityColor = "bg-red-100 text-red-800";
      habitabilityDescription = "Too large for surface habitability.";
    }

    setCalculations({
      // Original stellar parameters
      stellarMass,
      stellarRadius,
      stellarTemp,
      stellarLuminosity,
      stellarDistance,
      stellarSource,
      
      // Planet parameters
      planetPeriod,
      planetRadius,
      
      // Calculated values
      semiMajorAxisAU,
      equilibriumTemp,
      habitableZoneInner,
      habitableZoneOuter,
      ESI,
      
      // Classifications
      inHabitableZone,
      isRockySize,
      temperatureRange,
      habitabilityClass,
      habitabilityColor,
      habitabilityDescription,
      
      // Gas giant data
      gasGiantDetected,
      gasGiantConfidence,
      gasGiantType,
      gasGiantJupiterRadii
    });

  }, [results]);

  // Update the two-dimensional visualization animation
  useEffect(() => {
    if (!calculations || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add stars background
      ctx.fillStyle = 'white';
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 53) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Scale factors - FORCE VISUAL HIERARCHY! ⭐ > 🪐
      // Step 1: Make star a MINIMUM reasonable size (always dominant)
      const starRadiusPixels = Math.max(calculations.stellarRadius * 15, 30); // Bigger minimum star
      
      // Step 2: Calculate orbit but FORCE it to be outside star + buffer
      const baseOrbitRadius = Math.min(calculations.semiMajorAxisAU * 200, 180);
      const minSafeOrbit = starRadiusPixels + 40; // Star radius + BIG buffer
      const orbitRadiusPixels = Math.max(baseOrbitRadius, minSafeOrbit);
      
      // Step 3: Keep planet small relative to star (max 1/3 of star size)
      const maxPlanetSize = starRadiusPixels / 3;
      const basePlanetSize = Math.max(calculations.planetRadius * 4, 4);
      const planetRadiusPixels = Math.min(basePlanetSize, maxPlanetSize);
      
      // Star color based on temperature
      const getStarColor = () => {
        const temp = calculations.stellarTemp;
        if (temp > 7500) return '#9BB0FF'; // Blue
        if (temp > 6000) return '#FFF3A0'; // Yellow
        if (temp > 5200) return '#FFD180'; // Orange
        if (temp > 3700) return '#FFB74D'; // Red-orange
        return '#FF5722'; // Red
      };
      
      // Planet color based on habitability
      const getPlanetColor = () => {
        if (calculations.gasGiantDetected) return '#2196F3'; // Blue for gas giant
        if (calculations.inHabitableZone) return '#4CAF50'; // Green for habitable
        if (calculations.planetRadius > 2) return '#9C27B0'; // Purple for super-Earth
        return '#795548'; // Brown for rocky
      };
      
      // Draw habitable zone
      const hzInner = calculations.habitableZoneInner * 60;
      const hzOuter = calculations.habitableZoneOuter * 60;
      
      ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, hzOuter, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, hzInner, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw orbit path
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadiusPixels, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw star
      const starGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, starRadiusPixels * 2);
      starGlow.addColorStop(0, getStarColor());
      starGlow.addColorStop(0.7, getStarColor() + '80');
      starGlow.addColorStop(1, 'transparent');
      
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadiusPixels * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = getStarColor();
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadiusPixels, 0, Math.PI * 2);
      ctx.fill();
      
      // Calculate planet position - SLOWER, MORE CHILL ORBIT! 🐌
      const orbitalSpeed = 0.005; // Much slower for relaxed viewing
      const angle = animationTime * orbitalSpeed;
      const planetX = centerX + Math.cos(angle) * orbitRadiusPixels;
      const planetY = centerY + Math.sin(angle) * orbitRadiusPixels;
      
      // Draw planet glow
      const planetGlow = ctx.createRadialGradient(planetX, planetY, 0, planetX, planetY, planetRadiusPixels * 3);
      planetGlow.addColorStop(0, getPlanetColor());
      planetGlow.addColorStop(0.5, getPlanetColor() + '40');
      planetGlow.addColorStop(1, 'transparent');
      
      ctx.fillStyle = planetGlow;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadiusPixels * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw planet
      ctx.fillStyle = getPlanetColor();
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadiusPixels, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw planet trail
      ctx.strokeStyle = getPlanetColor() + '60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 1; i <= 20; i++) {
        const trailAngle = angle - (i * 0.1);
        const trailX = centerX + Math.cos(trailAngle) * orbitRadiusPixels;
        const trailY = centerY + Math.sin(trailAngle) * orbitRadiusPixels;
        if (i === 1) ctx.moveTo(trailX, trailY);
        else ctx.lineTo(trailX, trailY);
      }
      ctx.stroke();
      
      // Update animation time - SMOOTH INCREMENT!
      setAnimationTime(prev => prev + 1);
      
      // Debug logging (remove later)
      if (animationTime % 60 === 0) {
        console.log(`Planet position: (${Math.round(planetX)}, ${Math.round(planetY)}), angle: ${Math.round(angle * 180 / Math.PI)}°`);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [calculations, animationTime]);

  if (!calculations) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stellar Catalog Information */}
      <motion.div 
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            🌟 Stellar Catalog Data
          </h3>
          {getCatalogBadge(calculations.stellarSource)}
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {getCatalogDescription(calculations.stellarSource)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Stellar Mass</div>
            <div className="text-2xl font-bold text-blue-900">
              {calculations.stellarMass.toFixed(2)} M☉
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Stellar Radius</div>
            <div className="text-2xl font-bold text-yellow-900">
              {calculations.stellarRadius.toFixed(2)} R☉
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Temperature</div>
            <div className="text-2xl font-bold text-red-900">
              {calculations.stellarTemp.toFixed(0)} K
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Luminosity</div>
            <div className="text-2xl font-bold text-green-900">
              {calculations.stellarLuminosity.toFixed(2)} L☉
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Distance</div>
            <div className="text-2xl font-bold text-purple-900">
              {calculations.stellarDistance.toFixed(1)} pc
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 font-medium">Data Source</div>
            <div className="text-sm font-bold text-gray-900">
              {getCatalogSourceName(calculations.stellarSource)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Planet Characteristics */}
      <motion.div 
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🪐 Planet Characteristics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Orbital Period</div>
            <div className="text-2xl font-bold text-blue-900">
              {calculations.planetPeriod.toFixed(2)} days
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Planet Radius</div>
            <div className="text-2xl font-bold text-green-900">
              {calculations.planetRadius.toFixed(2)} R⊕
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Semi-Major Axis</div>
            <div className="text-2xl font-bold text-yellow-900">
              {calculations.semiMajorAxisAU.toFixed(3)} AU
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Equilibrium Temperature</div>
            <div className="text-2xl font-bold text-red-900">
              {calculations.equilibriumTemp.toFixed(0)} K
            </div>
          </div>
        </div>

        {/* Gas Giant Detection */}
        {calculations.gasGiantDetected && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-purple-900">Gas Giant Detected</h4>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                {(calculations.gasGiantConfidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
            <p className="text-purple-800 font-medium">{calculations.gasGiantType}</p>
            <p className="text-sm text-purple-700 mt-1">
              Size: {calculations.gasGiantJupiterRadii.toFixed(1)} Jupiter radii
            </p>
          </div>
        )}

        {/* Habitability Classification */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-900">Habitability Assessment</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${calculations.habitabilityColor}`}>
              {calculations.habitabilityClass}
            </span>
          </div>
          <p className="text-gray-700">{calculations.habitabilityDescription}</p>
        </div>

        {/* ESI Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Earth Similarity Index (ESI)</span>
            <span className="text-lg font-bold text-gray-900">{calculations.ESI.toFixed(3)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(calculations.ESI * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </motion.div>

      {/* Habitable Zone Visualization */}
      <motion.div 
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🌍 Habitable Zone Analysis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Inner Edge</div>
            <div className="text-xl font-bold text-blue-900">
              {calculations.habitableZoneInner.toFixed(3)} AU
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Planet Position</div>
            <div className="text-xl font-bold text-green-900">
              {calculations.semiMajorAxisAU.toFixed(3)} AU
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Outer Edge</div>
            <div className="text-xl font-bold text-red-900">
              {calculations.habitableZoneOuter.toFixed(3)} AU
            </div>
          </div>
        </div>

        {/* Visual representation */}
        <div className="relative h-16 bg-gradient-to-r from-red-500 via-green-400 to-blue-500 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            <div 
              className="absolute w-2 h-8 bg-white border-2 border-gray-800 rounded"
              style={{ 
                left: `${Math.min(Math.max((calculations.semiMajorAxisAU / Math.max(calculations.habitableZoneOuter * 1.5, 2)) * 100, 2), 98)}%`,
                transform: 'translateX(-50%)'
              }}
              title="Planet Position"
            >
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20"></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Too Hot</span>
          <span className="font-medium text-green-700">Habitable Zone</span>
          <span>Too Cold</span>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className={`p-3 rounded-lg ${calculations.inHabitableZone ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className={`text-sm font-medium ${calculations.inHabitableZone ? 'text-green-800' : 'text-red-800'}`}>
              Habitable Zone
            </div>
            <div className={`text-xs ${calculations.inHabitableZone ? 'text-green-600' : 'text-red-600'}`}>
              {calculations.inHabitableZone ? '✅ In zone' : '❌ Outside zone'}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${calculations.isRockySize ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <div className={`text-sm font-medium ${calculations.isRockySize ? 'text-green-800' : 'text-orange-800'}`}>
              Planet Size
            </div>
            <div className={`text-xs ${calculations.isRockySize ? 'text-green-600' : 'text-orange-600'}`}>
              {calculations.isRockySize ? '✅ Rocky size' : '⚠️ Large planet'}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${calculations.temperatureRange ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className={`text-sm font-medium ${calculations.temperatureRange ? 'text-green-800' : 'text-red-800'}`}>
              Temperature
            </div>
            <div className={`text-xs ${calculations.temperatureRange ? 'text-green-600' : 'text-red-600'}`}>
              {calculations.temperatureRange ? '✅ Suitable' : '❌ Extreme'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🚀 EPIC 2D ORBITAL VISUALIZATION! 🚀 */}
      <motion.div 
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🌌 Orbital System Visualization
        </h3>
        
        <div className="relative">
          <canvas 
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full border border-gray-200 rounded-lg bg-gradient-to-b from-black to-gray-900"
          />
          
          {/* Real-time data overlay */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div>⭐ <span className="text-yellow-300">{calculations.stellarSource.toUpperCase()}</span></div>
              <div>🌡️ <span className="text-red-300">{calculations.stellarTemp.toFixed(0)} K</span></div>
              <div>🌍 <span className="text-blue-300">{calculations.planetRadius.toFixed(2)} R⊕</span></div>
              <div>⏱️ <span className="text-green-300">{calculations.planetPeriod.toFixed(1)} days</span></div>
              <div>📏 <span className="text-purple-300">{calculations.semiMajorAxisAU.toFixed(3)} AU</span></div>
              <div>🔥 <span className="text-orange-300">{calculations.equilibriumTemp.toFixed(0)} K</span></div>
            </div>
          </div>
          
          {/* Habitability indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
            <div className={`font-bold ${calculations.inHabitableZone ? 'text-green-300' : 'text-red-300'}`}>
              {calculations.habitabilityClass}
            </div>
            <div className="text-xs text-gray-300">ESI: {calculations.ESI.toFixed(3)}</div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Real-time orbital simulation using actual stellar catalog data from <strong>{getCatalogSourceName(calculations.stellarSource)}</strong></p>
        </div>
      </motion.div>
    </div>
  );
};

export default HabitabilityAnalysis;
