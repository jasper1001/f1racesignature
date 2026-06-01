# F1RaceSignature — Data Scripts

## fetch_telemetry.py

Fetches **real F1 telemetry** using the official FastF1 library and generates:

- `public/data/telemetry/<race_id>.json` — actual car GPS positions per sample
- `public/data/circuits.json` — circuit SVG paths regenerated from the same FastF1 
  coordinate system so the racing line aligns perfectly with the track outline

### What FastF1 provides

For each lap FastF1 gives you ~1 sample per 10 metres:

| Column     | Description                              |
|------------|------------------------------------------|
| `X`, `Y`   | Car position in metres (official F1 feed)|
| `Speed`    | Speed km/h                               |
| `Throttle` | 0–100 %                                  |
| `Brake`    | boolean / 0–1                            |
| `Distance` | Distance into the lap in metres          |

### Setup

```bash
pip install -r scripts/requirements.txt
```

FastF1 downloads session data on first run and caches it in `scripts/cache/`.
Typical session cache size: ~5–20 MB.

### Run

```bash
python scripts/fetch_telemetry.py
```

The script will:
1. Load each race session (downloading if not cached)
2. Pick the driver's fastest lap
3. Down-sample to ~120 GPS points
4. Normalise coordinates to match the SVG poster space
5. Write JSON files and update `circuits.json`

### Notes

- Races before **2018** are not available in FastF1 (no live timing data was recorded).
  For those (Senna 1984, Schumacher 1995 etc.) the script uses a **modern race at the
  same circuit** to generate the circuit outline, then applies the real lap time and
  championship points from the historic race as metadata.
- Run `npm run dev` after the script finishes to hot-reload the new data.
