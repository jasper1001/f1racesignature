"""
fetch-driver-telemetry.py  [raceId ...]
==========================================================================
Replaces GENERATED (shared, 130-pt template) telemetry with REAL per-driver
GPS from FastF1, so head-to-head shows each driver's actual racing line.

For each target race: load the session, take that driver's fastest lap, align
its GPS to the existing circuits.json `path` frame (Procrustes: scale/rotate/
reflect + cyclic-offset on resampled loops) so the line sits on the track
ribbon, and write telemetry JSON in the existing schema. championshipPoints and
other non-telemetry metadata are preserved from the current file.

No arg = process all 27 modern (2018+) generated races. An arg limits to those.
"""
import os, json, math, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
import fastf1
fastf1.Cache.enable_cache("scripts/cache/fastf1")

ROOT = "."
TEL = os.path.join(ROOT, "public", "data", "telemetry")
circuits = json.load(open(os.path.join(ROOT, "public", "data", "circuits.json")))
races = {r["id"]: r for r in json.load(open(os.path.join(ROOT, "public", "data", "races.json")))}

CIRC_GP = {
    "silverstone": "British Grand Prix", "hungaroring": "Hungarian Grand Prix",
    "red_bull_ring": "Austrian Grand Prix", "sochi": "Russian Grand Prix",
    "las_vegas": "Las Vegas Grand Prix", "jeddah": "Saudi Arabian Grand Prix",
    "zandvoort": "Dutch Grand Prix", "cota": "United States Grand Prix",
    "mexico": "Mexico City Grand Prix", "imola": "Emilia Romagna Grand Prix",
    "australia": "Australian Grand Prix", "abu_dhabi": "Abu Dhabi Grand Prix",
    "miami": "Miami Grand Prix", "marina_bay": "Singapore Grand Prix",
    "baku": "Azerbaijan Grand Prix", "barcelona": "Spanish Grand Prix",
    "canada": "Canadian Grand Prix",
}
DRV_TLA = {
    "hamilton": "HAM", "sainz": "SAI", "verstappen": "VER", "leclerc": "LEC",
    "russell": "RUS", "norris": "NOR", "perez": "PER", "bearman": "BEA",
    "raikkonen": "RAI", "hulkenberg": "HUL", "ricciardo": "RIC", "ocon": "OCO",
    "alonso": "ALO", "gasly": "GAS", "bottas": "BOT", "vettel": "VET",
    "stroll": "STR", "albon": "ALB", "piastri": "PIA", "tsunoda": "TSU",
}

# Any modern (2018+) race whose telemetry isn't already real FastF1 GPS — i.e. still
# a shared generated template (whatever its point count), and on a fetchable GP.
def needs_fetch(r):
    if not r.get("telemetryFile") or r["year"] < 2018: return False
    if r["circuit"] not in CIRC_GP or r["driverId"] not in DRV_TLA: return False
    d = json.load(open(os.path.join(TEL, r["telemetryFile"] + ".json")))
    return d.get("source") != "fastf1"
TARGETS = [r for r in races.values() if needs_fetch(r)]

# ── geometry: align a GPS loop (metres) to circuits.json path (500x420) ──────────
def path_points(d):
    n = list(map(float, __import__("re").findall(r"-?\d+\.?\d*", d)))
    return np.array(list(zip(n[0::2], n[1::2])))

def resample(pts, count):
    seg = np.sqrt(((np.diff(pts, axis=0)) ** 2).sum(1))
    cum = np.concatenate([[0], np.cumsum(seg)])
    total = cum[-1]
    out = []
    for i in range(count):
        t = (i / count) * total
        j = np.searchsorted(cum, t) - 1
        j = max(0, min(j, len(pts) - 2))
        f = (t - cum[j]) / (seg[j] if seg[j] else 1)
        out.append(pts[j] + (pts[j + 1] - pts[j]) * f)
    return np.array(out)

def _sim(src, dst):
    """Least-squares 2D similarity (rotation+scale+translation, no reflection)
    mapping src->dst. Returns (2x2 A, 2 t) with dst ~= A@src.T + t."""
    sc, dc = src.mean(0), dst.mean(0)
    s, d = src - sc, dst - dc
    sz, dz = s[:, 0] + 1j * s[:, 1], d[:, 0] + 1j * d[:, 1]
    lam = np.vdot(sz, dz) / np.vdot(sz, sz)
    A = np.array([[lam.real, -lam.imag], [lam.imag, lam.real]])
    return A, dc - A @ sc

def align(gps, path, N=300):
    """Similarity transform (scale/rot/reflection + ICP refine) mapping gps->path
    frame. Returns a function applying the transform to raw gps points."""
    A = resample(np.vstack([path, path[0]]), N)        # target (500x420)
    B = resample(np.vstack([gps, gps[0]]), N)          # source (metres)
    Ac, Bc = A.mean(0), B.mean(0)
    As = np.sqrt(((A - Ac) ** 2).sum(1).mean())
    Bs = np.sqrt(((B - Bc) ** 2).sum(1).mean())
    a = (A - Ac) / As
    az = a[:, 0] + 1j * a[:, 1]
    # Coarse: pick reflection + cyclic offset + rotation/scale that best matches.
    best = None
    for refl in (1, -1):
        bb = (B - Bc) / Bs; bb = bb.copy(); bb[:, 1] *= refl
        bz0 = bb[:, 0] + 1j * bb[:, 1]
        for off in range(N):
            bz = np.roll(bz0, -off)
            lam = np.vdot(bz, az) / np.vdot(bz, bz)
            r = (np.abs(az - lam * bz) ** 2).sum()
            if best is None or r < best[0]: best = (r, refl, lam)
    _, refl, lam = best
    # Express coarse as an affine on the (optionally reflected) raw frame.
    def reflect(p):
        if refl < 0: p = p.copy(); p[:, 1] = 2 * Bc[1] - p[:, 1]
        return p
    Atot = (As / Bs) * np.array([[lam.real, -lam.imag], [lam.imag, lam.real]])
    ttot = Ac - Atot @ Bc
    # ICP refine against the target loop (fixes small systematic rotation/offset).
    Bref = reflect(B)
    cur = (Atot @ Bref.T).T + ttot
    for _ in range(15):
        # nearest target point for each current point
        d2 = ((cur[:, None, :] - A[None, :, :]) ** 2).sum(2)
        nn = A[d2.argmin(1)]
        dA, dt = _sim(cur, nn)
        cur = (dA @ cur.T).T + dt
        Atot = dA @ Atot; ttot = dA @ ttot + dt
    def fwd(pts):
        return (Atot @ reflect(pts.astype(float)).T).T + ttot
    return fwd

def lap_seconds(td):
    return td.total_seconds() if td is not None and not isinstance(td, float) else None

def fmt_lap(sec):
    return f"{int(sec // 60)}:{sec % 60:06.3f}"

# ── main ─────────────────────────────────────────────────────────────────────────
only = set(sys.argv[1:])
# Explicit IDs are always (re)processed; with no args, only the un-fetched ones.
targets = [races[i] for i in only if i in races] if only else TARGETS
print(f"processing {len(targets)} race(s)")
for r in targets:
    rid, cid, drv = r["id"], r["circuit"], r["driverId"]
    try:
        # Prefer the qualifying fastest lap (cleanest line); fall back to the race
        # for drivers who set no representative Q lap (e.g. grid-penalty runs).
        lap = None
        for sess in ("Q", "R"):
            s = fastf1.get_session(r["year"], CIRC_GP[cid], sess)
            s.load(telemetry=True, laps=True, weather=False)
            cand = s.laps.pick_drivers(DRV_TLA[drv]).pick_fastest()
            if cand is not None and cand.get("LapTime") is not None:
                lap = cand; break
        if lap is None:
            raise RuntimeError("no usable lap in Q or R")
        tel = lap.get_telemetry().dropna(subset=["X", "Y"]).reset_index(drop=True)
        gps = tel[["X", "Y"]].to_numpy(float)
        # Align to the real OSM track centreline (tracks/<id>.json) when available —
        # it's the true track shape, so the racing line sits on the ribbon. circuits.
        # json `path` is a fallback but can be a distorted representation.
        tf = os.path.join(ROOT, "public", "data", "tracks", cid + ".json")
        target = json.load(open(tf))["centerlinePath"] if os.path.exists(tf) else circuits[cid]["path"]
        fwd = align(gps, path_points(target))
        xy = fwd(gps)
        nx = xy[:, 0] / 500.0
        ny = xy[:, 1] / 420.0

        dist = tel["Distance"].to_numpy(float); dist = (dist - dist[0]); dist = dist / dist[-1]
        spd = tel["Speed"].to_numpy(float)
        thr = tel["Throttle"].to_numpy(float)
        brk = tel["Brake"].to_numpy(float)  # bool-ish
        s1 = circuits[cid].get("sector1End", 0.333); s2 = circuits[cid].get("sector2End", 0.667)
        sectors = [1 if d < s1 else 2 if d < s2 else 3 for d in dist]

        # downsample to ~140 points (keep file size sane, match existing density)
        idx = np.linspace(0, len(nx) - 1, 140).round().astype(int)
        pts = [dict(x=round(float(nx[i]), 4), y=round(float(ny[i]), 4),
                    speed=int(spd[i]), sector=int(sectors[i]),
                    throttle=int(round(float(thr[i]))), brake=int(bool(brk[i])),
                    distance=round(float(dist[i]), 4)) for i in idx]

        lt = lap_seconds(lap["LapTime"])
        st = [lap_seconds(lap[k]) for k in ("Sector1Time", "Sector2Time", "Sector3Time")]
        old = json.load(open(os.path.join(TEL, r["telemetryFile"] + ".json")))
        out = dict(old)  # preserve championshipPoints / benchmarkLapTime etc.
        out["driverId"] = drv; out["raceId"] = rid
        if lt: out["lapTime"] = fmt_lap(lt)
        if all(st): out["sectors"] = {"s1Time": round(st[0], 3), "s2Time": round(st[1], 3), "s3Time": round(st[2], 3)}
        out["topSpeed"] = int(spd.max()); out["averageSpeed"] = int(spd.mean())
        out["source"] = "fastf1"; out["points"] = pts
        json.dump(out, open(os.path.join(TEL, r["telemetryFile"] + ".json"), "w"))
        print(f"  OK {rid}: {len(pts)} real pts, lap {out.get('lapTime')}")
    except Exception as e:
        print(f"  FAIL {rid}: {type(e).__name__}: {e}")
