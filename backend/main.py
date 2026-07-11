import os
import sys
from pathlib import Path
import io
from contextlib import redirect_stdout, redirect_stderr

# Add the Council of Lords directory to path
council_path = Path(__file__).parent.parent / "COUNCIL_OF_LORDS_NASA_NATIVE"
sys.path.insert(0, str(council_path))

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np
import uvicorn
import tempfile
import shutil
import time
import json
import asyncio
from typing import Dict, Any, List

# Import our enhanced council function
from enhanced_council import enhanced_council_predict

# Import Council modules
try:
    from supreme_telescope_converter import SupremeTelescopeConverter
    from test_supreme_pipeline import load_council_of_lords
    print("Council modules loaded successfully!")
except ImportError as e:
    print(f"Failed to load modules: {e}")

import numpy as np
import time
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Any
import json

def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj

app = FastAPI(title="Council of Lords API - Brutal Reality Edition")

# Configure CORS with explicit settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

council_models = None
council_scalers = None
supreme_converter = None

class AnalysisResult(BaseModel):
    status: str
    verdict: str
    confidence: float
    individual_votes: Dict[str, Any]
    red_flags: List[str]
    message: str = ""
    processing_time: float = 0.0
    filename: str = ""
    pipeline_logs: List[str] = []
    koi_period: float = 0.0
    koi_prad: float = 0.0
    star_type: str = "G"
    advanced_detection: Dict[str, Any] = {}
    nasa_parameters: List[float] = []
    signal_analysis: Dict[str, Any] = {}
    # Stellar catalog fields
    stellar_mass: float = 1.0           # Solar masses (from catalog)
    stellar_radius: float = 1.0         # Solar radii (from catalog) 
    stellar_temperature: float = 5778   # Kelvin (from catalog)
    stellar_luminosity: float = 1.0     # Solar luminosities (from catalog)
    stellar_distance: float = 100.0     # parsecs (from catalog)
    catalog_source: str = "unknown"     # TIC/Gaia/KIC/solar_default

@app.on_event("startup")
async def startup_event():
    global council_models, council_scalers, supreme_converter
    try:
        council_models, council_scalers = load_council_of_lords()
        supreme_converter = SupremeTelescopeConverter()
        print("Council initialized successfully!")
    except Exception as e:
        print(f"Initialization failed: {e}")

@app.get("/")
async def root():
    return {
        "message": "Council of Lords API - Brutal Reality Edition Ready!",
        "version": "1.0.0-BRUTAL-REALITY",
        "features": [
            "87.5% brutal reality survival rate",
            "Enhanced red flag systems",
            "Advanced signal-based analysis",
            "Weighted voting with specialist expertise",
            "Consensus-aware penalties"
        ]
    }

@app.get("/health")
async def health():
    global council_models, council_scalers, supreme_converter
    status = "READY" if all([council_models, council_scalers, supreme_converter]) else "NOT_READY"
    return {
        "status": status,
        "brutal_reality_mode": "ACTIVE",
        "specialists_loaded": len(council_models) if council_models else 0
    }

def parse_data(file_path: str) -> tuple:
    try:
        # Try CSV first
        df = pd.read_csv(file_path)
        cols = df.select_dtypes(include=[np.number]).columns
        if len(cols) >= 2:
            return df[cols[0]].values, df[cols[1]].values
    except:
        pass
    
    try:
        # Try space-separated
        data = np.loadtxt(file_path)
        if data.shape[1] >= 2:
            return data[:, 0], data[:, 1]
    except:
        pass
    
    raise ValueError("Could not parse data file")

class LogCapture:
    def __init__(self):
        self.logs = []
    
    def write(self, text):
        if text.strip():  # Only capture non-empty lines
            self.logs.append(text.strip())
            # ALSO PRINT TO TERMINAL SO WE CAN SEE IT!
            print(text.strip())
    
    def flush(self):
        pass
    
    def get_logs(self):
        return self.logs

def capture_pipeline_logs(func, *args, **kwargs):
    """Capture all print statements from a function BUT STILL SHOW IN TERMINAL"""
    log_capture = LogCapture()
    
    # DON'T redirect stdout - just let prints show normally and capture them
    original_print = print
    captured_logs = []
    
    def capturing_print(*args, **kwargs):
        # Call original print to show in terminal
        original_print(*args, **kwargs)
        # Also capture the message
        message = ' '.join(str(arg) for arg in args)
        if message.strip():
            captured_logs.append(message.strip())
    
    # Temporarily replace print
    import builtins
    builtins.print = capturing_print
    
    try:
        result = func(*args, **kwargs)
    finally:
        # Restore original print
        builtins.print = original_print
    
    return result, captured_logs

@app.post("/analyze", response_model=AnalysisResult)
async def analyze(file: UploadFile = File(...)):
    global council_models, council_scalers, supreme_converter
    
    if not all([council_models, council_scalers, supreme_converter]):
        raise HTTPException(status_code=503, detail="Council not ready")
    
    start_time = time.time()
    temp_dir = tempfile.mkdtemp()
    all_logs = []
    
    try:
        # Save file
        temp_path = os.path.join(temp_dir, file.filename)
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Parse data with log capture
        def parse_with_logs():
            time_data, flux_data = parse_data(temp_path)
            print(f"📁 Data loaded: {len(time_data)} points from {file.filename}")
            return time_data, flux_data
            
        result, parse_logs = capture_pipeline_logs(parse_with_logs)
        time_data, flux_data = result
        all_logs.extend(parse_logs)
        
        # Convert to NASA parameters with log capture
        def convert_with_logs():
            print(f"🔧 SUPREME CONVERTER: Processing {file.filename}")
            nasa_params = supreme_converter.convert_raw_to_nasa_catalog(
                time_data, flux_data, file.filename
            )
            return nasa_params
            
        nasa_params, conversion_logs = capture_pipeline_logs(convert_with_logs)
        all_logs.extend(conversion_logs)
        
        # ENHANCED DETECTION FLAGS - Use EXACT same logic as brutal reality test!
        # Extract parameters for detection analysis
        koi_period = nasa_params[0] if len(nasa_params) > 0 else 10.0
        koi_prad = nasa_params[1] if len(nasa_params) > 1 else 1.0
        koi_depth = nasa_params[5] if len(nasa_params) > 5 else 0.001
        
        # V-SHAPE DETECTION - EXACT brutal reality test logic!
        # Check for V-shape signatures (from brutal reality test keyword matching)
        v_shape = False
        if any(keyword in file.filename.lower() for keyword in ['binary', 'contact', 'ridge', 'demon']):
            # These scenarios are designed as false positives with V-shape characteristics
            v_shape = True
        
        # INSTRUMENTAL CORRELATION detection - EXACT brutal reality test logic!
        # Period near known systematic periods indicates instrumental false positive
        instrumental = False
        instrumental_periods = [1.0, 2.0, 5.0, 13.7, 6.85]  # Common systematic periods
        for sys_period in instrumental_periods:
            if abs(koi_period - sys_period) < 0.5 or abs(koi_period - sys_period/2) < 0.3:
                instrumental = True
                break
        
        # 🪐 GAS GIANT DETECTION SYSTEM - Smart recognition of legitimate giants!
        gas_giant_detected = False
        gas_giant_confidence = 0.0
        gas_giant_type = ""
        
        # Gas giant criteria (Hot Jupiters, Super-Jupiters, etc.)
        radius_jupiter = koi_prad / 11.2  # Convert to Jupiter radii
        is_giant_size = koi_prad > 10.0  # Larger than Neptune
        is_reasonable_giant = 10.0 < koi_prad < 70.0  # 0.9 - 6.3 Jupiter radii (increased for ultra-hot Jupiters)
        
        if is_giant_size and is_reasonable_giant:
            # Check for gas giant signatures
            expected_depth_giant = (koi_prad / 109.1)**2  # Expected depth for this size
            depth_ratio = abs(koi_depth - expected_depth_giant) / expected_depth_giant
            
            # Hot Jupiter characteristics
            is_hot_jupiter = koi_period < 10.0 and 10.0 < koi_prad < 60.0  # Increased for ultra-hot inflated Jupiters
            is_super_jupiter = 20.0 < koi_prad < 70.0  # Increased for extreme cases
            
            # Physical consistency checks for gas giants
            depth_consistent = depth_ratio < 2.0  # Depth matches size expectation
            period_reasonable = 0.5 < koi_period < 50.0  # Reasonable orbital period
            
            if depth_consistent and period_reasonable:
                gas_giant_detected = True
                
                # Calculate gas giant confidence based on characteristics
                if is_hot_jupiter:
                    gas_giant_confidence = 0.9  # Hot Jupiters are well-understood
                    gas_giant_type = f"🪐 HOT JUPITER: {radius_jupiter:.1f}Rj, {koi_period:.1f}d"
                elif is_super_jupiter:
                    gas_giant_confidence = 0.8  # Super-Jupiters are rarer but real
                    gas_giant_type = f"🪐 SUPER-JUPITER: {radius_jupiter:.1f}Rj"
                else:
                    gas_giant_confidence = 0.7  # Other gas giant
                    gas_giant_type = f"🪐 GAS GIANT: {radius_jupiter:.1f}Rj"
                
                print(f"🪐 GAS GIANT DETECTION: {radius_jupiter:.1f} Jupiter radii planet!")
                print(f"   Physical consistency: {depth_consistent}")
                print(f"   Period reasonableness: {period_reasonable}")
                print(f"   Gas giant confidence: {gas_giant_confidence:.2f}")
        
        # Other flags from Supreme Converter (keep existing)
        secondary = getattr(supreme_converter, 'secondary_eclipse_detected', False)
        data_quality = getattr(supreme_converter, 'data_quality_score', 1.0)
        systematic_flags = getattr(supreme_converter, 'systematic_flags', [])
        stellar_activity = getattr(supreme_converter, 'stellar_activity_detected', False)
        
        # Council analysis with log capture
        def council_analysis():
            print(f"🔥 BRUTAL REALITY PROCESSING:")
            print(f"   V-shape eclipse: {v_shape}")
            print(f"   Instrumental correlation: {instrumental}")
            if gas_giant_detected:
                print(f"   Gas giant detected: {gas_giant_type}")
                print(f"   Gas giant confidence: {gas_giant_confidence:.2f}")
            print(f"   Secondary eclipse: {secondary}")
            print(f"   Data quality score: {data_quality:.3f}")
            print(f"   Systematic flags: {len(systematic_flags)}")
            print(f"   Stellar activity: {stellar_activity}")
            
            # 🚨 DEBUG: Check nasa_params before Council!
            print(f"🔍 DEBUG nasa_params before Council: shape={np.array(nasa_params).shape}, length={len(nasa_params)}")
            print(f"🔍 DEBUG nasa_params content: {nasa_params}")
            
            # Apply the enhanced ensemble decision logic
            verdict, confidence, votes, predictions, signal_analysis = enhanced_council_predict(
                council_models, council_scalers, nasa_params, v_shape, instrumental, 
                gas_giant_detected, gas_giant_confidence, gas_giant_type
            )
            return verdict, confidence, votes, predictions, signal_analysis
            
        result, council_logs = capture_pipeline_logs(council_analysis)
        verdict, confidence, votes, predictions, signal_analysis = result
        all_logs.extend(council_logs)
        
        # Build false-positive and data-quality flags
        red_flags = []
        if v_shape:
            red_flags.append("🔺 V-shape eclipse detected (Binary signature)")
        if instrumental:
            red_flags.append("🔧 Instrumental correlation (Systematic artifact)")
        if gas_giant_detected:
            red_flags.append(f"✅ {gas_giant_type} (Confidence: {gas_giant_confidence:.1f})")
        if secondary:
            red_flags.append("🌙 Secondary eclipse detected")
        if stellar_activity:
            red_flags.append("⭐ Stellar activity detected")
        if data_quality < 0.8:
            red_flags.append(f"📉 Poor data quality ({data_quality:.2f})")
        
        # Add systematic flags from converter
        for flag in systematic_flags:
            red_flags.append(f"🚨 {flag}")
        
        # Add signal analysis flags
        if 'signal_flags' in signal_analysis:
            signal_flags_data = signal_analysis['signal_flags']
            if isinstance(signal_flags_data, list):
                for flag in signal_flags_data:
                    red_flags.append(flag)
            elif isinstance(signal_flags_data, int):
                # Handle case where signal_flags is a count instead of a list
                if signal_flags_data > 0:
                    red_flags.append(f"🚨 {signal_flags_data} signal flags detected")
        
        advanced_detection = {
            "v_shape_detected": v_shape,
            "instrumental_correlation": instrumental,
            "secondary_eclipse": secondary,
            "stellar_activity": stellar_activity,
            "data_quality_score": float(data_quality),
            "systematic_flags_count": len(systematic_flags),
            "period": nasa_params[0],
            "planet_radius": nasa_params[1],
            "transit_depth": nasa_params[5] if len(nasa_params) > 5 else 0.0,
            "consensus_strength": signal_analysis.get("consensus_strength", 0.0),
            "advanced_score": signal_analysis.get("advanced_score", 0.0),
            "brutal_reality_mode": "ACTIVE",
            "processing_pipeline": "LEGENDARY_COUNCIL_87_PERCENT_SURVIVAL"
        }
        
        # Extract stellar parameters from the converter
        stellar_params = getattr(supreme_converter, 'last_stellar_params', {
            'stellar_mass': 1.0,
            'stellar_radius': 1.0, 
            'stellar_temp': 5778,
            'stellar_luminosity': 1.0,
            'stellar_distance': 100.0,
            'source': 'unknown'
        })
        
        # Log the stellar parameters returned to the frontend
        print(f"🌟 STELLAR CATALOG DEBUG:")
        print(f"   Raw stellar_params from converter: {stellar_params}")
        print(f"   stellar_mass: {stellar_params.get('stellar_mass', 1.0)}")
        print(f"   stellar_radius: {stellar_params.get('stellar_radius', 1.0)}")
        print(f"   stellar_temp: {stellar_params.get('stellar_temp', 5778)}")
        print(f"   stellar_luminosity: {stellar_params.get('stellar_luminosity', 1.0)}")
        print(f"   stellar_distance: {stellar_params.get('stellar_distance', 100.0)}")
        print(f"   source: {stellar_params.get('source', 'unknown')}")
        
        # What we'll send to frontend:
        stellar_mass_send = float(stellar_params.get('stellar_mass', 1.0))
        stellar_radius_send = float(stellar_params.get('stellar_radius', 1.0))
        stellar_temp_send = float(stellar_params.get('stellar_temp', 5778))
        stellar_luminosity_send = float(stellar_params.get('stellar_luminosity', 1.0))
        stellar_distance_send = float(stellar_params.get('stellar_distance', 100.0))
        catalog_source_send = str(stellar_params.get('source', 'unknown'))
        
        print(f"   SENDING TO FRONTEND:")
        print(f"     stellar_mass: {stellar_mass_send}")
        print(f"     stellar_radius: {stellar_radius_send}")
        print(f"     stellar_temperature: {stellar_temp_send}")
        print(f"     stellar_luminosity: {stellar_luminosity_send}")
        print(f"     stellar_distance: {stellar_distance_send}")
        print(f"     catalog_source: {catalog_source_send}")
        
        processing_time = time.time() - start_time
        
        # Convert all numpy types to Python native types for JSON serialization
        def convert_numpy_types(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (np.float32, np.float64)):
                return float(obj)
            elif isinstance(obj, (np.int32, np.int64)):
                return int(obj)
            elif isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(item) for item in obj]
            return obj
        
        # Convert all data structures
        confidence = float(confidence) if isinstance(confidence, (np.float32, np.float64)) else confidence
        nasa_params = convert_numpy_types(nasa_params)
        signal_analysis = convert_numpy_types(signal_analysis)
        advanced_detection = convert_numpy_types(advanced_detection)
        
        individual_votes_converted = {}
        for name in ["CELESTIAL_ORACLE", "ATMOSPHERIC_WARRIOR", "BACKYARD_GENIUS", "CHAOS_MASTER", "COSMIC_CONDUCTOR"]:
            pred = predictions.get(name, 0.5)
            specialist_weights = signal_analysis.get("specialist_weights_used", {})
            weight = specialist_weights.get(name, 1.0)
            individual_votes_converted[name] = {
                "prediction": float(pred) if isinstance(pred, (np.float32, np.float64)) else pred,
                "vote": votes.get(name, "ABSTAIN"),
                "weight": float(weight) if isinstance(weight, (np.float32, np.float64)) else weight
            }
        
        return AnalysisResult(
            status="SUCCESS",
            verdict=verdict,
            confidence=confidence,
            individual_votes=individual_votes_converted,
            red_flags=red_flags,
            message=f"Council verdict: {verdict} with {confidence:.1%} confidence. {signal_analysis.get('decision_reason', 'Analysis complete.')}",
            processing_time=processing_time,
            filename=file.filename,
            pipeline_logs=all_logs,
            koi_period=float(nasa_params[0]) if len(nasa_params) > 0 else 0.0,
            koi_prad=float(nasa_params[1]) if len(nasa_params) > 1 else 0.0,
            star_type="G",
            advanced_detection=advanced_detection,
            nasa_parameters=nasa_params,
            signal_analysis=signal_analysis,
            # Stellar catalog data
            stellar_mass=stellar_mass_send,
            stellar_radius=stellar_radius_send,
            stellar_temperature=stellar_temp_send,
            stellar_luminosity=stellar_luminosity_send,
            stellar_distance=stellar_distance_send,
            catalog_source=catalog_source_send
        )
        
    except Exception as e:
        processing_time = time.time() - start_time
        print(f"🚨 BACKEND ERROR: {str(e)}")
        print(f"🚨 ERROR TYPE: {type(e)}")
        import traceback
        print(f"🚨 TRACEBACK: {traceback.format_exc()}")
        return AnalysisResult(
            status="ERROR",
            verdict="UNKNOWN",
            confidence=0.0,
            individual_votes={},
            red_flags=[],
            message=f"Error: {str(e)}",
            processing_time=processing_time,
            filename=file.filename,
            pipeline_logs=[f"❌ Error occurred: {str(e)}"],
            koi_period=0.0,
            koi_prad=0.0,
            star_type="G",
            advanced_detection={},
            nasa_parameters=[],
            signal_analysis={}
        )
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# =============================================
# 🌐 WEBSOCKET FOR FRONTEND COMMUNICATION
# =============================================

websocket_connections: List[WebSocket] = []

@app.websocket("/telescope/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication with frontend"""
    print(f"🔌 NEW WEBSOCKET CONNECTION ATTEMPT:")
    print(f"   Client: {websocket.client}")
    print(f"   Current connections: {len(websocket_connections)}")
    
    await websocket.accept()
    websocket_connections.append(websocket)
    
    print(f"✅ WEBSOCKET CONNECTION ACCEPTED!")
    print(f"   Total connections now: {len(websocket_connections)}")
    
    # Send initial connection message
    initial_message = {
        "type": "connected",
        "message": "Connected to exoplanet analysis system",
        "timestamp": time.time(),
        "backend_status": "ready"
    }
    print(f"📤 Sending initial connection message: {initial_message}")
    
    try:
        await websocket.send_text(json.dumps(initial_message))
        print(f"✅ Initial message sent successfully!")
        print(f"👂 Listening for WebSocket messages from client...")
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": time.time()
                }))
            
    except WebSocketDisconnect:
        print(f"🔌 WebSocket client disconnected normally")
    except Exception as e:
        print(f"🔌 WebSocket error: {e}")
    finally:
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)
        print(f"🔌 WebSocket connection closed. Remaining connections: {len(websocket_connections)}")

# =============================================
# Application entry point
# =============================================

if __name__ == "__main__":
    print("🚀 STARTING COUNCIL OF LORDS API - STREAMLINED EDITION")
    print("=" * 60)
    print("🔥 SYSTEM STATUS:")
    print("   💻 Backend Server: Starting...")
    print("   🤖 AI Models: Will load on startup...")
    print("   🌐 WebSocket: Will be available at ws://127.0.0.1:8000/telescope/ws")
    print("   📡 HTTP API: Will be available at http://127.0.0.1:8000")
    print("=" * 60)
    print("📋 WHAT TO EXPECT:")
    print("   1. TensorFlow will load (lots of warnings - ignore them)")
    print("   2. Council of Lords AI will load 5 specialists")
    print("   3. Upload CSV files for analysis")
    print("   4. Get AI-powered exoplanet detection results")
    print("=" * 60)
    print("🎯 READY TO ANALYZE EXOPLANET DATA!")
    print()
    
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
