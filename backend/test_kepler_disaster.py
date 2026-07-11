import pandas as pd
from main import parse_data, enhanced_council_predict
from pathlib import Path
import os
import sys

# Add the Council of Lords directory to path
council_path = Path('../COUNCIL_OF_LORDS_NASA_NATIVE')
sys.path.insert(0, str(council_path))

from supreme_telescope_converter import SupremeTelescopeConverter
from test_supreme_pipeline import load_council_of_lords

print('🔍 TESTING BACKEND WITH KEPLER DISASTER...')

# Initialize same as the backend startup
council_models, council_scalers = load_council_of_lords()
supreme_converter = SupremeTelescopeConverter()

print('✅ Backend initialized!')

# Load the Kepler disaster CSV file
data_file = Path('../COUNCIL_OF_LORDS_NASA_NATIVE/brutal_reality_test/kepler_disaster.csv')
print('Testing backend with Kepler disaster CSV...')

# Use parse_data function from backend
time_data, flux_data = parse_data(str(data_file))

print(f'Dataset size: {len(time_data)} points')

# Use the same processing pipeline as the backend
nasa_params = supreme_converter.convert_raw_to_nasa_catalog(
    time_data, flux_data, 'kepler_disaster.csv'
)

# Get ADVANCED DETECTION FLAGS from Supreme Converter
v_shape = getattr(supreme_converter, 'v_shape_detected', False)
instrumental = getattr(supreme_converter, 'instrumental_correlation_detected', False)

print(f'🔥 BRUTAL REALITY PROCESSING:')
print(f'   V-shape eclipse: {v_shape}')
print(f'   Instrumental correlation: {instrumental}')

# Apply the enhanced ensemble decision logic
verdict, confidence, votes, predictions, signal_analysis = enhanced_council_predict(
    council_models, council_scalers, nasa_params, v_shape, instrumental
)

print('🚨 BACKEND RESULT FOR KEPLER DISASTER:')
print(f'   Verdict: {verdict}')
print(f'   Confidence: {confidence:.3f}')
print(f'   Expected from brutal reality test: EXOPLANET 0.836')

if verdict != 'EXOPLANET' or abs(confidence - 0.836) > 0.05:
    print('🚨 CRITICAL MISMATCH DETECTED!')
else:
    print('✅ Backend matches brutal reality test!')
