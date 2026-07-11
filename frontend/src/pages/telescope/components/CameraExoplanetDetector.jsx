import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { councilAPI } from '../../../services/api';

const CameraExoplanetDetector = () => {
  const [cameraStatus, setCameraStatus] = useState('disconnected');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [extractedCandidates, setExtractedCandidates] = useState([]);
  const [backendResults, setBackendResults] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    framesAnalyzed: 0,
    candidatesFound: 0,
    filesGenerated: 0,
    exoplanetsDetected: 0
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const analysisInterval = useRef(null);
  const abortController = useRef(null);
  const shouldBeAnalyzing = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup intervals and streams
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // STEP 1: WEBCAM ACCESS
  const requestCameraAccess = async () => {
    try {
      setCameraStatus('requesting');
      setPipelineStep(1);
      console.log('Requesting camera access');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained');
      
      // Store stream immediately
      streamRef.current = stream;
      
      // Wait a bit for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video source');
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            setCameraStatus('connected');
            setPipelineStep(2);
          };
          
          // Force set after timeout
          setTimeout(() => {
            console.log('Setting camera state to connected');
            setCameraStatus('connected');
            setPipelineStep(2);
          }, 1000);
          
        } else {
          console.error('Video reference is unavailable after timeout');
          // Force it anyway
          setCameraStatus('connected');
          setPipelineStep(2);
        }
      }, 100);
        
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraStatus('error');
      setPipelineStep(0);
    }
  };

  // STEP 2: START AI COUNCIL ANALYSIS
  const startAnalysis = () => {
    console.log('Starting analysis');
    
    // Clear any existing interval first
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
    
    shouldBeAnalyzing.current = true;
    setIsAnalyzing(true);
    setPipelineStep(3);
    setExtractedCandidates([]);
    setBackendResults([]);
    setSessionStats({
      framesAnalyzed: 0,
      candidatesFound: 0,
      filesGenerated: 0,
      exoplanetsDetected: 0
    });
    
    console.log('Running ensemble analysis');
    
    // Wait for state update before starting interval
    setTimeout(() => {
      analysisInterval.current = setInterval(() => {
        performAICouncilExtraction();
      }, 3000); // Every 3 seconds
    }, 100); // Small delay to ensure state update
  };

  // STEP 3: AI COUNCIL EXTRACTION & FILTERING
  const performAICouncilExtraction = async () => {
    console.log('Extraction state:', isAnalyzing, 'expected state:', shouldBeAnalyzing.current);
    
    // Check if analysis is active (use ref as backup)
    if (!isAnalyzing && !shouldBeAnalyzing.current) {
      console.log('Analysis is inactive; skipping extraction');
      return;
    }
    
    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas reference is unavailable');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video is not ready');
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0);
    
    console.log('Analyzing video frame');
    setPipelineStep(4);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const candidates = extractStarCandidates(imageData);
    
    if (candidates.length > 0) {
      console.log(`Ensemble analysis found ${candidates.length} candidates`);
      
      // Check if analysis is still active before processing candidates
      if (!isAnalyzing && !shouldBeAnalyzing.current) {
        console.log('Analysis stopped; skipping candidate processing');
        return;
      }
      
      // Update stats
      setSessionStats(prev => ({
        ...prev,
        framesAnalyzed: prev.framesAnalyzed + 1,
        candidatesFound: prev.candidatesFound + candidates.length
      }));
      
      // Add to candidates list
      setExtractedCandidates(prev => [...prev, ...candidates].slice(-20));
      
      // STEP 4: SEND TO BACKEND AS FILE
      await sendCandidatesToBackend(candidates);
    }
    
    setPipelineStep(3); // Back to analyzing
  };

  // AI COUNCIL: Extract Star Candidates
  const extractStarCandidates = (imageData) => {
    const { data, width, height } = imageData;
    const candidates = [];
    const brightnessThreshold = 200;
    
    // Scan for bright spots (stars)
    for (let y = 20; y < height - 20; y += 10) {
      for (let x = 20; x < width - 20; x += 10) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness > brightnessThreshold) {
          // Validate if it's a real star candidate
          if (validateStarCandidate(data, x, y, width, height)) {
            // WEBCAM ANALYSIS: Extract ideal celestial body properties
            const colorBalance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b); // Color variation
            const stability = Math.min(100, brightness / 2.55); // Brightness stability metric
            
            const timeFluxData = generateTimeFluxData(brightness, colorBalance, stability);
            
            candidates.push({
              id: `candidate_${x}_${y}_${Date.now()}`,
              position: { x, y },
              brightness,
              colorBalance,
              stability,
              timeFluxData,
              confidence: calculateConfidence(brightness),
              timestamp: new Date().toISOString()
            });
            
            if (candidates.length >= 5) break; // Limit candidates
          }
        }
      }
      if (candidates.length >= 5) break;
    }
    
    return candidates;
  };

  // Validate star candidate
  const validateStarCandidate = (data, x, y, width, height) => {
    let brightCount = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
          const index = (checkY * width + checkX) * 4;
          const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
          if (brightness > 150) brightCount++;
        }
      }
    }
    return brightCount >= 4; // At least 4 bright pixels = valid star
  };

  // Generate a difficult telescope-quality simulation
  const generateTimeFluxData = (brightness, colorBalance, stability) => {
    const dataPoints = [];
    const baseFlux = 1.0;
    
    // WEBCAM ANALYSIS → IDEAL CELESTIAL BODY PARAMETERS
    // Treat webcam data as the "perfect" celestial body properties
    const idealPlanetRadius = Math.sqrt(brightness / 255) * 2.5; // 0-2.5 Earth radii
    const idealStellarMass = 0.5 + (colorBalance / 255) * 1.5; // 0.5-2.0 solar masses
    const idealOrbitalDistance = 0.1 + (stability / 100) * 2.0; // 0.1-2.1 AU
    
    console.log(`Simulated body: planet ${idealPlanetRadius.toFixed(2)}R⊕, star ${idealStellarMass.toFixed(2)}M☉, orbit ${idealOrbitalDistance.toFixed(2)}AU`);
    
    // Model most simulated candidates as false positives
    const randomScenario = Math.random();
    let scenarioType = "";
    
    if (randomScenario < 0.15) {
      // 15% chance: REAL EXOPLANET (like real astronomy!)
      scenarioType = "REAL_EXOPLANET";
    } else if (randomScenario < 0.35) {
      // 20% chance: ECLIPSING BINARY (V-shaped, obvious false positive)
      scenarioType = "ECLIPSING_BINARY";
    } else if (randomScenario < 0.55) {
      // 20% chance: INSTRUMENTAL ARTIFACT (systematic periods)
      scenarioType = "INSTRUMENTAL";
    } else if (randomScenario < 0.75) {
      // 20% chance: STELLAR ACTIVITY (spots, flares)
      scenarioType = "STELLAR_ACTIVITY";
    } else {
      // 25% chance: PURE NOISE (no signal at all)
      scenarioType = "PURE_NOISE";
    }
    
    console.log(`Simulation scenario: ${scenarioType}`);
    
    // Generate realistic parameters based on IDEAL BODY + SCENARIO
    let period, transitDepth, transitDuration, noiseLevel;
    
    switch (scenarioType) {
      case "REAL_EXOPLANET":
        // Perfect scenario: Ideal body actually IS a real exoplanet!
        // Period based on orbital distance (Kepler's 3rd law)
        period = Math.sqrt(Math.pow(idealOrbitalDistance, 3) / idealStellarMass) * 365.25 / 100; // Convert to observational timescale
        period = Math.max(2.0, Math.min(50.0, period)); // Clamp to observable range
        
        // Transit depth = (planet radius / star radius)²
        const stellarRadius = Math.pow(idealStellarMass, 0.8); // Main sequence mass-radius relation
        transitDepth = Math.pow(idealPlanetRadius * 0.00916 / stellarRadius, 2); // Earth radii to solar radii
        transitDepth = Math.max(0.0005, Math.min(0.02, transitDepth)); // Clamp to realistic range
        
        transitDuration = period * 0.06; // 6% of period (realistic geometry)
        noiseLevel = 0.0003; // High precision space telescope
        break;
        
      case "ECLIPSING_BINARY":
        // Disaster scenario: What we detected is actually a binary star system!
        period = Math.sqrt(Math.pow(idealOrbitalDistance * 0.1, 3) / (idealStellarMass * 2)) * 365.25 / 50; // Much closer, binary
        period = Math.max(1.0, Math.min(10.0, period)); // Short binary periods
        
        // Much deeper eclipse - stellar companion, not planet
        const companionRadius = idealPlanetRadius * 20; // "Planet" is actually a small star
        transitDepth = Math.pow(companionRadius * 0.00916, 2) / Math.pow(idealStellarMass, 1.6); // Huge depth!
        transitDepth = Math.max(0.03, Math.min(0.15, transitDepth)); // Binary-scale eclipses
        
        transitDuration = period * 0.15; // Longer eclipses
        noiseLevel = 0.0008; // More noise from binary interactions
        break;
        
      case "INSTRUMENTAL":
        // Telescope malfunction: Creates fake signals at systematic periods
        const systematicPeriods = [1.0, 2.0, 13.7, 27.4]; // Known telescope systematics
        period = systematicPeriods[Math.floor(Math.random() * systematicPeriods.length)];
        
        // Fake depth influenced by "ideal" parameters
        transitDepth = 0.01 + (idealPlanetRadius / 2.5) * 0.015; // 1-2.5% fake depth
        transitDuration = period * 0.12;
        noiseLevel = 0.001; // Higher noise from instrument issues
        break;
        
      case "STELLAR_ACTIVITY":
        // Star rotation: What we see is stellar spots, not planets
        period = 10.0 + (idealStellarMass - 1.0) * 20; // Stellar rotation ~ stellar mass
        period = Math.max(8.0, Math.min(45.0, period)); // Stellar rotation range
        
        // Spot depth related to "ideal planet" size (bigger spots for bigger "planets")
        transitDepth = 0.001 + (idealPlanetRadius / 2.5) * 0.01; // 0.1-1.1% spot modulation
        transitDuration = period * 0.25; // Very broad stellar features
        noiseLevel = 0.0012; // High noise from stellar activity
        break;
        
      case "PURE_NOISE":
        // Nothing there: Just random detector noise mimicking signals
        period = 20.0 + Math.random() * 40; // Random fake period
        transitDepth = 0.0001; // Basically no real signal
        transitDuration = 0.1;
        noiseLevel = 0.002; // Pure noise dominates
        break;
    }
    
    // Generate 1200+ points over sufficient time
    const totalTime = Math.max(60, period * 6); // At least 6 periods
    const numPoints = 1400; // Lots of data
    
    console.log(`Period: ${period.toFixed(2)}d, depth: ${(transitDepth*100).toFixed(3)}%, noise: ${(noiseLevel*100).toFixed(3)}%`);
    console.log(`Parameters: R=${idealPlanetRadius.toFixed(2)}R⊕, M*=${idealStellarMass.toFixed(2)}M☉, a=${idealOrbitalDistance.toFixed(2)}AU`);
    
    for (let i = 0; i < numPoints; i++) {
      const time = (i / numPoints) * totalTime;
      let flux = baseFlux;
      
      // Add realistic stellar variability
      if (scenarioType !== "PURE_NOISE") {
        flux += 0.0008 * Math.sin(2 * Math.PI * time / (period * 3.1));
        flux += 0.0003 * Math.sin(2 * Math.PI * time / (period * 0.7));
      }
      
      // Add the main signal based on scenario
      const phaseInPeriod = (time % period) / period;
      
      if (scenarioType === "REAL_EXOPLANET") {
        // Proper planet transit with limb darkening
        const transitPhase = Math.abs(phaseInPeriod - 0.5) * 2;
        if (transitPhase < (transitDuration / period)) {
          const transitFraction = (transitPhase / (transitDuration / period));
          const limbDarkening = 1 - (1 - transitFraction) * (1 - transitFraction);
          flux -= transitDepth * limbDarkening;
        }
      } else if (scenarioType === "ECLIPSING_BINARY") {
        // V-shaped binary eclipse (obvious false positive)
        const eclipsePhase = Math.abs(phaseInPeriod - 0.5) * 2;
        if (eclipsePhase < (transitDuration / period)) {
          const eclipseFraction = (eclipsePhase / (transitDuration / period));
          flux -= transitDepth * eclipseFraction; // Linear V-shape (not planet-like!)
        }
        // Add secondary eclipse too
        const secondaryPhase = Math.abs(phaseInPeriod - 0.0) * 2;
        if (secondaryPhase < (transitDuration / period) * 0.3) {
          flux -= transitDepth * 0.1; // Secondary eclipse
        }
      } else if (scenarioType === "INSTRUMENTAL") {
        // Sharp instrumental dips
        if (Math.abs(phaseInPeriod - 0.5) < (transitDuration / period) / 2) {
          flux -= transitDepth; // Sharp, non-physical dip
        }
      } else if (scenarioType === "STELLAR_ACTIVITY") {
        // Broad, irregular stellar spots
        const activityPhase = Math.sin(2 * Math.PI * phaseInPeriod);
        if (activityPhase > 0.3) {
          flux -= transitDepth * (activityPhase - 0.3) / 0.7; // Broad, asymmetric
        }
      }
      
      // Add systematic trends (realistic instrumental effects)
      flux += 0.0001 * Math.sin(2 * Math.PI * time / 13.7); // Spitzer systematic
      flux += 0.00005 * time / totalTime; // Linear trend
      
      // Add realistic photometric noise
      flux += (Math.random() - 0.5) * noiseLevel * 2;
      
      // Add occasional outliers (cosmic rays, etc.)
      if (Math.random() < 0.001) {
        flux += (Math.random() - 0.5) * 0.01; // Rare outliers
      }
      
      dataPoints.push({
        time: time.toFixed(6),
        flux: Math.max(0.92, Math.min(1.08, flux)).toFixed(8)
      });
    }
    
    return dataPoints;
  };

  // Calculate confidence score
  const calculateConfidence = (brightness) => {
    return Math.min(1.0, (brightness - 150) / 100);
  };

  // STEP 4: SEND CANDIDATES TO BACKEND AS FILE
  const sendCandidatesToBackend = async (candidates) => {
    try {
      // Check if analysis is still active
      if (!isAnalyzing && !shouldBeAnalyzing.current) {
        console.log('Analysis stopped; skipping backend submission');
        return;
      }
      
      setPipelineStep(5);
      console.log(`Sending ${candidates.length} candidates to backend`);
      
      // Create new abort controller for this batch
      abortController.current = new AbortController();
      
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        
        // Check if analysis is still active before each candidate
        if (!isAnalyzing && !shouldBeAnalyzing.current) {
          console.log('Analysis stopped; aborting backend submission');
          return;
        }
        
        // Generate CSV file for this candidate
        let csvContent = 'time,flux\n';
        candidate.timeFluxData.forEach(point => {
          csvContent += `${point.time},${point.flux}\n`;
        });
        
        // Create file blob
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvFile = new File([csvBlob], `candidate_${candidate.id}.csv`, { type: 'text/csv' });
        
        // Send to backend using the SAME method as homepage!
        console.log(`Analyzing candidate ${i + 1}/${candidates.length}`);
        const result = await councilAPI.analyzeFile(csvFile, {
          signal: abortController.current.signal
        });
        
        console.log('Ensemble response:', result);
        console.log('Verdict:', result.verdict);
        console.log('Confidence:', result.confidence);
        console.log('Individual votes:', result.individual_votes);
        console.log('Red flags:', result.red_flags);
        console.log('Pipeline logs:', result.pipeline_logs);
        
        // Update stats
        setSessionStats(prev => ({
          ...prev,
          filesGenerated: prev.filesGenerated + 1
        }));

        // ALWAYS show backend result, regardless of verdict
        const backendResult = {
          id: `backend_${Date.now()}`,
          candidateId: candidate.id,
          timestamp: new Date().toLocaleTimeString(),
          verdict: result.verdict || 'UNKNOWN',
          confidence: result.confidence || 0,
          redFlags: result.red_flags || [],
          logs: result.pipeline_logs || [],
          backendData: result
        };
        
        // Add ALL backend results to display
        setBackendResults(prev => [...prev, backendResult].slice(-10));
        
        // Only count as exoplanet if verdict is EXOPLANET
        if (result.verdict === 'EXOPLANET') {
          setSessionStats(prev => ({
            ...prev,
            exoplanetsDetected: prev.exoplanetsDetected + 1
          }));
          console.log('Exoplanet candidate detected:', backendResult);
        } else {
          console.log('Backend analysis complete:', result.verdict, result.message);
        }
      }
      
      setPipelineStep(3); // Back to analyzing
    } catch (error) {
      // Handle abort gracefully
      if (error.name === 'AbortError') {
        console.log('Backend request aborted');
        return;
      }
      
      console.error('Backend connection failed:', error);
      
      // Add error result to display (only if not stopped)
      if (!isStopping && isAnalyzing) {
        const errorResult = {
          id: `error_${Date.now()}`,
          candidateId: candidates[0]?.id || 'unknown',
          timestamp: new Date().toLocaleTimeString(),
          verdict: 'ERROR',
          confidence: 0,
          redFlags: [],
          logs: [`Error: ${error.message}`],
          backendData: null
        };
        
        setBackendResults(prev => [...prev, errorResult].slice(-10));
        setPipelineStep(3);
      }
    }
  };

  // Stop analysis
  const stopAnalysis = () => {
    console.log('Stopping analysis');
    shouldBeAnalyzing.current = false;
    setIsAnalyzing(false);
    setPipelineStep(2);
    
    // Clear analysis interval
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
    
    // Abort any ongoing backend requests
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    
    console.log('Analysis stopped');
  };

  // Pipeline steps for display
  const pipelineSteps = [
    { id: 0, name: 'Ready', icon: '⚡', color: 'gray' },
    { id: 1, name: 'Requesting Camera', icon: '📷', color: 'blue' },
    { id: 2, name: 'Camera Connected', icon: '✅', color: 'green' },
    { id: 3, name: 'AI Council Analyzing', icon: '🏛️', color: 'purple' },
    { id: 4, name: 'Extracting Candidates', icon: '✨', color: 'yellow' },
    { id: 5, name: 'Sending to Backend', icon: '📤', color: 'orange' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* PIPELINE SHOWCASE */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">🔄 Live Exoplanet Detection Pipeline</h2>
        <div className="flex justify-between items-center bg-gray-800 rounded-lg p-4">
          {pipelineSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center p-3 rounded-lg ${
                pipelineStep >= step.id ? `bg-${step.color}-900 border-${step.color}-500 border` : 'bg-gray-700'
              }`}>
                <div className="text-2xl mb-1">{step.icon}</div>
                <div className={`text-xs text-center ${
                  pipelineStep >= step.id ? `text-${step.color}-400` : 'text-gray-400'
                }`}>
                  {step.name}
                </div>
              </div>
              {index < pipelineSteps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  pipelineStep > step.id ? 'bg-green-500' : 'bg-gray-600'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WEBCAM FEED */}
      <div className="mb-6">
        <div className="bg-black rounded-lg overflow-hidden border-2 border-gray-600 relative">
          {/* ALWAYS RENDER VIDEO ELEMENT */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-96 object-cover ${cameraStatus === 'connected' ? 'block' : 'hidden'}`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none opacity-30 ${cameraStatus === 'connected' ? 'block' : 'hidden'}`}
          />
          
          {cameraStatus === 'connected' && isAnalyzing && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              🔴 LIVE AI ANALYSIS
            </div>
          )}
          
          {cameraStatus !== 'connected' && (
            <div className="h-96 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {cameraStatus === 'disconnected' && '📷'}
                  {cameraStatus === 'requesting' && '⏳'}
                  {cameraStatus === 'error' && '❌'}
                </div>
                <div className="text-xl font-bold mb-2">
                  {cameraStatus === 'disconnected' && 'Ready for Webcam Access'}
                  {cameraStatus === 'requesting' && 'Requesting Camera Access...'}
                  {cameraStatus === 'error' && 'Camera Access Denied'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTROL BUTTONS */}
        <div className="flex justify-center space-x-4 mt-4">
          {cameraStatus === 'disconnected' && (
            <button
              onClick={requestCameraAccess}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg"
            >
              📷 Access Webcam
            </button>
          )}
          
          {cameraStatus === 'connected' && !isAnalyzing && (
            <button
              onClick={startAnalysis}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg"
            >
              🚀 Start AI Council Analysis
            </button>
          )}
          
          {isAnalyzing && (
            <button
              onClick={stopAnalysis}
              className="px-6 py-3 rounded-lg font-semibold text-lg bg-red-600 hover:bg-red-700"
            >
              🛑 Stop Analysis
            </button>
          )}
        </div>
      </div>

      {/* SESSION STATS */}
      {isAnalyzing && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{sessionStats.framesAnalyzed}</div>
            <div className="text-sm text-gray-400">Frames Analyzed</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">{sessionStats.candidatesFound}</div>
            <div className="text-sm text-gray-400">Candidates Found</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">{sessionStats.filesGenerated}</div>
            <div className="text-sm text-gray-400">Files Sent</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{sessionStats.exoplanetsDetected}</div>
            <div className="text-sm text-gray-400">Exoplanets!</div>
          </div>
        </div>
      )}

      {/* BACKEND RESULTS */}
      {backendResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">🏛️ Backend AI Council Verdicts</h3>
          <div className="space-y-2">
            {backendResults.map(result => (
              <motion.div
                key={result.id}
                className={`border rounded-lg p-4 ${
                  result.verdict === 'EXOPLANET' ? 'bg-green-900/50 border-green-500' :
                  result.verdict === 'ERROR' ? 'bg-red-900/50 border-red-500' :
                  'bg-gray-900/50 border-gray-500'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-lg">
                      {result.verdict === 'EXOPLANET' ? '🪐 EXOPLANET DETECTED' :
                       result.verdict === 'ERROR' ? '❌ BACKEND ERROR' :
                       `🤖 ${result.verdict || 'NO EXOPLANET'}`}
                    </div>
                    <div className="text-sm text-gray-400">{result.timestamp}</div>
                  </div>
                  
                  {result.error ? (
                    <div className="text-red-400 text-sm font-mono">
                      {result.error}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-300">
                        Confidence: {(result.confidence * 100).toFixed(1)}% • 
                        Candidate: {result.candidateId}
                      </div>
                      
                      {result.redFlags && result.redFlags.length > 0 && (
                        <div className="text-xs">
                          <strong>Red Flags:</strong> {result.redFlags.join(', ')}
                        </div>
                      )}
                      
                      {result.logs && result.logs.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer">Backend Logs ({result.logs.length})</summary>
                          <div className="mt-2 max-h-32 overflow-y-auto bg-black/30 p-2 rounded font-mono">
                            {result.logs.slice(-10).map((log, i) => (
                              <div key={i}>{log}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* EXTRACTED CANDIDATES */}
      {extractedCandidates.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">✨ AI Council Extracted Candidates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extractedCandidates.slice(-6).map(candidate => (
              <div key={candidate.id} className="bg-gray-800 border border-yellow-500 rounded-lg p-4">
                <div className="font-bold text-yellow-400">⭐ Star Candidate</div>
                <div className="text-sm text-gray-300 mt-2">
                  Position: ({candidate.position.x}, {candidate.position.y})<br/>
                  Brightness: {candidate.brightness.toFixed(1)}<br/>
                  Confidence: {(candidate.confidence * 100).toFixed(1)}%<br/>
                  Data Points: {candidate.timeFluxData.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraExoplanetDetector;
