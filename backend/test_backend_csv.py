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

print('Initializing backend components...')

# Initialize same as the backend startup
council_models, council_scalers = load_council_of_lords()
supreme_converter = SupremeTelescopeConverter()

print('✅ Backend initialized!')

# Load the correct TESS nightmare CSV file
data_file = Path('../COUNCIL_OF_LORDS_NASA_NATIVE/brutal_reality_test/tess_nightmare.csv')
print('Testing backend with correct CSV...')

# Use parse_data function from backend
time_data, flux_data = parse_data(str(data_file))

print(f'Dataset size: {len(time_data)} points')

# Use the same processing pipeline as the backend
nasa_params = supreme_converter.convert_raw_to_nasa_catalog(
    time_data, flux_data, 'tess_nightmare.csv'
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

print('BACKEND RESULT:')
print(f'Verdict: {verdict}')
print(f'Confidence: {confidence:.3f}')
