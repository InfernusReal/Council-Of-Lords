# NASA light-curve data sources

This guide lists authoritative sources and a Python workflow for acquiring Kepler, K2, and TESS light curves. Archive interfaces and package APIs can change; consult the linked service documentation when a command or URL is no longer current.

## Mikulski Archive for Space Telescopes

The [Mikulski Archive for Space Telescopes](https://archive.stsci.edu/) distributes Kepler, K2, and TESS products.

- [Kepler mission archive](https://archive.stsci.edu/kepler/)
- [MAST Portal](https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html)
- [TESS data access guidance](https://heasarc.gsfc.nasa.gov/docs/tess/data-access.html)

Search by a mission-specific identifier such as a Kepler Input Catalog identifier or TESS Input Catalog identifier. Select the required light-curve product, cadence, sector or quarter, and processing level. Preserve the downloaded FITS headers and quality flags.

Example identifiers used by this repository include:

| Mission | Target | Identifier |
| --- | --- | --- |
| Kepler | Kepler-452 | KIC 8311864 |
| Kepler | Kepler-22 | KIC 10593626 |
| Kepler | Kepler-186 | KIC 8120608 |
| Kepler | Kepler-442 | KIC 9632895 |
| TESS | TOI-715 | TIC 271971130 |
| TESS | TOI-700 | TIC 150428135 |
| TESS | TOI-849 | TIC 279741377 |

Verify identifiers against the current archive before downloading data.

## NASA Exoplanet Archive

The [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) provides confirmed-planet catalogs and time-series access. Use its current documentation and table definitions when joining catalog parameters to light curves.

Relevant collections include:

- [Kepler time series](https://exoplanetarchive.ipac.caltech.edu/data/KeplerTimeSeries/)
- [K2 time series](https://exoplanetarchive.ipac.caltech.edu/data/K2TimeSeries/)
- [TESS time series](https://exoplanetarchive.ipac.caltech.edu/data/TESS/)

Catalog confirmation status and parameters may be revised. Record the table name, query, and retrieval date.

## Lightkurve

[Lightkurve](https://lightkurve.github.io/lightkurve/) provides a Python interface for searching and processing Kepler and TESS light curves.

Install it in an isolated environment:

```bash
python -m pip install lightkurve
```

Example:

```python
import lightkurve as lk

search = lk.search_lightcurve('Kepler-452', mission='Kepler')
collection = search.download_all()
light_curve = collection.stitch()
light_curve.to_pandas().to_csv('kepler_452_lightcurve.csv', index=False)

search = lk.search_lightcurve('TOI-715', mission='TESS')
collection = search.download_all()
light_curve = collection.stitch()
light_curve.to_pandas().to_csv('toi_715_lightcurve.csv', index=False)
```

Stitching, normalization, flattening, outlier removal, and quality-mask choices alter the data. Record every operation and retain the original FITS products.

## Provenance checklist

For each dataset, record:

- mission, target name, and archive identifier;
- archive and product URI;
- sector, quarter, campaign, cadence, and pipeline version;
- retrieval date;
- quality mask and excluded cadences;
- normalization, detrending, stitching, and resampling steps;
- output column names and units;
- script and dependency versions.

Do not describe generated or transformed CSV data as raw observations. Raw archive products and derived tables should be stored and labeled separately.

## Expected content

Mission light-curve products generally include time, flux measurements, uncertainty estimates, and quality information. They can contain gaps, instrumental systematics, contamination, and stellar variability. These effects must be considered during candidate analysis and false-positive vetting.
