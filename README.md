# Council of Lords

Council of Lords is an experimental exoplanet-candidate analysis project. It combines five TensorFlow classifiers with a preprocessing and feature-extraction pipeline, a FastAPI service, and a React interface for uploading light-curve data and reviewing the ensemble result.

The repository includes trained model artifacts, scalers, sample Kepler- and TESS-related datasets, synthetic stress-test datasets, training scripts, and exploratory evaluation scripts.

## Project status

This is a research prototype, not a validated scientific instrument. A positive classification is a candidate assessment and does not confirm an exoplanet. Confirmation requires independent observations, established vetting procedures, and expert review.

Accuracy figures produced by the included scripts apply only to their specific fixtures and evaluation logic. They should not be generalized to mission-scale performance without a reproducible, independently reviewed benchmark.

## Architecture

The system has four main layers:

1. `SupremeTelescopeConverter` reads a time/flux series, cleans the observations, estimates signal characteristics, and produces the feature vector expected by the models.
2. Five specialist models produce individual probabilities: Celestial Oracle, Atmospheric Warrior, Backyard Genius, Chaos Master, and Cosmic Conductor.
3. `enhanced_council_predict` combines model probabilities with signal checks, specialist weights, and false-positive indicators.
4. The FastAPI backend returns the verdict, confidence, votes, flags, extracted parameters, catalog context, and captured pipeline output to the React frontend.

The repository uses thematic names for historical model components. Those names do not indicate separate astronomical methods or external authorities.

## Repository layout

```text
backend/                              FastAPI service and analysis integration
frontend/                             React and Vite interface
COUNCIL_OF_LORDS_NASA_NATIVE/        Models, scalers, training and evaluation scripts
  KeplerNTessDatasets/                Light-curve datasets and acquisition guidance
  real_telescope_data/                Example telescope-style inputs
brutal_reality_test/                  Adversarial and false-positive fixtures
clean_ultimate_test/                  Baseline fixtures
instructions-for-use.md               Operational instructions
```

The repository currently tracks generated caches, installed frontend dependencies, compiled Python files, model binaries, and datasets. These files increase checkout size and should be reviewed before packaging or redistributing the project.

## Requirements

- Python 3 with the scientific and API packages imported by `backend` and the training scripts
- Node.js and npm for the frontend
- Sufficient memory to load the TensorFlow models

The current `backend/requirements.txt` contains duplicated and conflicting version entries. Review and correct that manifest for the target Python environment before relying on it for reproducible installation. This documentation cleanup intentionally does not alter dependency or application code.

## Run the backend

From the repository root:

```bash
cd backend
python main.py
```

The service listens on `http://localhost:8000` when started through the module's default entry point. Model loading occurs during FastAPI startup.

Available endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service metadata |
| `GET` | `/health` | Model and converter readiness |
| `POST` | `/analyze` | Upload and analyze a light-curve file |
| WebSocket | `/telescope/ws` | Telescope-page communication |

Check readiness before submitting data:

```bash
curl http://localhost:8000/health
```

## Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the application on `http://localhost:5173` and proxies `/api` requests to `http://localhost:8000`.

Create a production bundle with:

```bash
npm run build
```

## Analyze a file

The upload endpoint accepts a multipart field named `file`:

```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@path/to/lightcurve.csv"
```

The parser first attempts to read CSV data and selects the first two numeric columns as time and flux. Review `backend/main.py` and the converter before using another format or column convention.

The response includes:

- `status`, `verdict`, and `confidence`;
- individual model votes and weights;
- red flags and signal-analysis details;
- period, radius, transit, and catalog-derived fields;
- pipeline messages and processing time.

Treat returned flags and confidence values as diagnostic output from this implementation, not calibrated scientific probabilities.

## Models and training

Training scripts live in `COUNCIL_OF_LORDS_NASA_NATIVE`. Each script defines its own architecture, loss behavior, data preparation, and artifact naming. The committed `.h5` and `.pkl` files are loaded by the backend through the native pipeline modules.

Before retraining:

1. Record the Python, TensorFlow, NumPy, pandas, and scikit-learn versions.
2. Keep training and evaluation targets separate.
3. Preserve source provenance and preprocessing parameters.
4. Report class balance and metrics beyond accuracy.
5. Save random seeds and generated dataset parameters.
6. Evaluate on observations not used to tune thresholds or rules.

## Datasets

The repository contains several categories of inputs:

- Kepler- and TESS-related CSV files under `KeplerNTessDatasets`;
- generated catalog and telescope-style datasets;
- baseline fixtures under `clean_ultimate_test`;
- difficult false-positive and low-signal fixtures under `brutal_reality_test` and related directories.

Dataset filenames and folder names describe their intended scenario. They are not evidence of provenance by themselves. Verify each dataset against its source record and document any transformation from FITS or archive products to CSV.

See [NASA data sources](./COUNCIL_OF_LORDS_NASA_NATIVE/KeplerNTessDatasets/NASA_RAW_DATA_SOURCES.md) for acquisition options.

## Evaluation guidance

A credible evaluation should publish:

- the exact dataset identifiers and retrieval dates;
- preprocessing and exclusion rules;
- train, validation, and test partitions;
- confusion matrices, precision, recall, F1, and calibration metrics;
- uncertainty intervals and per-target results;
- comparisons with appropriate baselines;
- failure analysis for eclipsing binaries, stellar variability, instrumental systematics, and blended sources.

Several scripts in this repository generate or reuse scenario-specific fixtures. Results from those scripts are useful for regression testing, but they are not substitutes for blinded external validation.

## Security and operational notes

- The upload endpoint writes incoming files to a temporary directory. Apply file-size, content-type, resource, and request-rate limits before exposing it publicly.
- CORS is configured for local development origins.
- The application does not provide production authentication or authorization.
- Model loading and analysis can consume substantial CPU and memory.
- Avoid exposing detailed exception and pipeline output to untrusted clients.
- Review tracked binary and third-party files before distribution.

## Development checks

Validate Python syntax without importing the ML stack:

```bash
python -c "import ast,pathlib; [ast.parse(p.read_text(encoding='utf-8-sig')) for p in pathlib.Path('backend').rglob('*.py')]"
```

Validate the frontend:

```bash
cd frontend
npm run build
```

Some files are exploratory scripts rather than automated tests. A full continuous-integration suite is not currently defined at the repository root.

## Responsible use

Do not represent a model verdict as an astronomical discovery or confirmed planet. Retain the original observations, verify coordinates and target identifiers, inspect the light curve, evaluate known false-positive mechanisms, and use established follow-up procedures.

## Contributing

Keep changes focused and document the data, assumptions, and validation behind scientific behavior changes. Avoid performance claims that cannot be reproduced from committed scripts and datasets. Do not commit environments, caches, secrets, or newly generated large artifacts.

## License and citation

No repository-level license or formal citation file is currently included. Confirm usage rights for the source code, model artifacts, and datasets before reuse or redistribution. When using mission data, cite the applicable archive, mission, and data product according to their published guidance.
