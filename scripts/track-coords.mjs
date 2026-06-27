// Approx circuit centres (lat, lon) + optional lapLength override (m) for circuits
// whose circuits.json lapLength is 0. Used to fetch OSM geometry.
//
// `roads: true` marks street circuits that have no usable highway=raceway loop —
// fetch the public road network instead (highway=primary|secondary|tertiary|
// residential|unclassified|trunk|living_street around the centre); the reference-
// guided builder then selects the circuit roads via the racing line. Monaco is built
// this way. The same query unlocks baku / las_vegas / marina_bay / australia.
export const COORDS = {
  monaco:        { lat: 43.7384, lon: 7.4246, roads: true },
  silverstone:   { lat: 52.0733, lon: -1.0142 },
  spa:           { lat: 50.4372, lon: 5.9714 },
  bahrain:       { lat: 26.0325, lon: 50.5106 },
  abu_dhabi:     { lat: 24.4672, lon: 54.6031 },
  suzuka:        { lat: 34.8431, lon: 136.5419 },
  interlagos:    { lat: -23.7036, lon: -46.6997 },
  monza:         { lat: 45.6156, lon: 9.2811 },
  hungaroring:   { lat: 47.5789, lon: 19.2486 },
  miami:         { lat: 25.9581, lon: -80.2389, lapLength: 5412 },
  marina_bay:    { lat: 1.2914, lon: 103.8640, roads: true, lapLength: 4940 },
  baku:          { lat: 40.3654, lon: 49.8420, roads: true, lapLength: 6003 },
  barcelona:     { lat: 41.5700, lon: 2.2611, lapLength: 4657 },
  red_bull_ring: { lat: 47.2197, lon: 14.7647 },
  sochi:         { lat: 43.4057, lon: 39.9578 },
  sepang:        { lat: 2.7603, lon: 101.7382 },
  las_vegas:     { lat: 36.1147, lon: -115.1728, roads: true },
  jeddah:        { lat: 21.6319, lon: 39.1044 },
  canada:        { lat: 45.5000, lon: -73.5228 },
  zandvoort:     { lat: 52.3888, lon: 4.5409 },
  cota:          { lat: 30.1328, lon: -97.6411 },
  mexico:        { lat: 19.4042, lon: -99.0907 },
  imola:         { lat: 44.3439, lon: 11.7167 },
  australia:     { lat: -37.8497, lon: 144.9680, roads: true, lapLength: 5278 },
}
