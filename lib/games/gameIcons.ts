// ── Game icon set ───────────────────────────────────────────────────────────────
// Hand-drawn line icons for the mini-games, replacing the old emoji. Every icon is
// the inner markup of a 24×24 SVG drawn with `currentColor` strokes, so it inherits
// the game's accent colour and the stroke weight set on the wrapping <svg>
// (see components/games/GameIcon.tsx). Plain strings keep the set reusable from
// server components, client components and image routes alike. Static, trusted
// markup only — never interpolate user input into these.

export const GAME_ICONS: Record<string, string> = {
  // Scrambled circuit tiles: a 2×2 grid with a road running across the seams.
  'track-builder':
    '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
    '<path d="M12 3v18M3 12h18" stroke-opacity=".35"/>' +
    '<path d="M3 16.5h4.5a3 3 0 0 0 3-3v-3a3 3 0 0 1 3-3H21"/>',

  // Trophy.
  'championship-decider':
    '<path d="M8 4h8v5.5a4 4 0 0 1-8 0V4z"/>' +
    '<path d="M8 5.5H5.5v1A3.5 3.5 0 0 0 8.4 10M16 5.5h2.5v1A3.5 3.5 0 0 1 15.6 10"/>' +
    '<path d="M12 13.5V17M9 20h6M10 17h4"/>',

  // Stopwatch.
  'pit-stop-timer':
    '<circle cx="12" cy="13.5" r="7.5"/>' +
    '<path d="M10 2.5h4M12 2.5V6M12 13.5l3-3M18.4 7.1l1.4-1.4"/>',

  // Circuit silhouette with a start/finish line.
  'track-outline':
    '<path d="M4 17.5V9.8c0-1 .6-1.9 1.5-2.3l3.3-1.4c1-.4 2.1.2 2.3 1.3l.3 1.6c.2 1 1.2 1.6 2.2 1.3l5.5-1.8c1.3-.4 2.5.6 2.4 1.9l-.4 5.4c-.1 1-.9 1.8-1.9 1.8h-3.4c-.8 0-1.4.6-1.5 1.4l-.1.6c-.1.8-.8 1.4-1.6 1.4H5.5c-.8 0-1.5-.7-1.5-1.5z"/>' +
    '<path d="M2 14h4" stroke-opacity=".6"/>',

  // Pencil tracing a line.
  'draw-the-circuit':
    '<path d="M15.5 4l4.5 4.5L9.5 19H5v-4.5L15.5 4z"/>' +
    '<path d="M13.2 6.3l4.5 4.5"/>' +
    '<path d="M14 21c1.6 0 2.2-1.6 3.6-1.6S19.8 21 21 21" stroke-opacity=".6"/>',

  // Speed trace (telemetry).
  'name-that-lap':
    '<path d="M3 20.5h18" stroke-opacity=".35"/>' +
    '<path d="M3 15.5l3.2-7 3 5 3.3-9 3.4 11 2.6-5L21 14"/>',

  // Lap clock: a clock face closing into a lap arrow.
  'guess-the-lap-time':
    '<path d="M20 12a8 8 0 1 1-2.3-5.7"/>' +
    '<path d="M20 3.5V7h-3.5"/>' +
    '<path d="M12 8v4.2l2.8 2.3"/>',

  // Three-step podium.
  'podium-scramble':
    '<path d="M9 10h6v10.5H9zM3 14h6v6.5H3zM15 16h6v4.5h-6z"/>' +
    '<path d="M12 3.2l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',

  // Four tiles, three of them linked.
  connections:
    '<rect x="3" y="3" width="7" height="7" rx="1.6"/>' +
    '<rect x="14" y="3" width="7" height="7" rx="1.6"/>' +
    '<rect x="3" y="14" width="7" height="7" rx="1.6"/>' +
    '<rect x="14" y="14" width="7" height="7" rx="1.6" stroke-opacity=".35"/>' +
    '<path d="M10 6.5h4M6.5 10v4"/>',

  // Ranked rows of decreasing length.
  'tier-list':
    '<rect x="3" y="3.5" width="4" height="4" rx="1"/>' +
    '<rect x="3" y="10" width="4" height="4" rx="1"/>' +
    '<rect x="3" y="16.5" width="4" height="4" rx="1"/>' +
    '<path d="M10.5 5.5H21M10.5 12h7M10.5 18.5h3.5"/>',

  // Career route: milestones joined by a path.
  'career-path':
    '<circle cx="5" cy="18.5" r="2"/>' +
    '<circle cx="12" cy="11" r="2"/>' +
    '<circle cx="19" cy="5.5" r="2"/>' +
    '<path d="M6.4 17l4.2-4.5M13.6 9.8l3.8-3"/>' +
    '<path d="M3 22h18" stroke-opacity=".35"/>',

  // Higher / lower arrows.
  'higher-lower':
    '<path d="M8 20V4.5M4 8.5l4-4 4 4"/>' +
    '<path d="M16 4v15.5M12 15.5l4 4 4-4"/>',

  // Target crosshair.
  'predict-driver':
    '<circle cx="12" cy="12" r="7.5"/>' +
    '<circle cx="12" cy="12" r="3.5"/>' +
    '<path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',

  // Racing helmet, side view.
  'guess-the-driver':
    '<path d="M3.5 14.5C3.5 8.9 7.6 5 13 5c4.6 0 7.5 3.4 7.5 7.8v3.7a2.5 2.5 0 0 1-2.5 2.5H8.5a5 5 0 0 1-5-4.5z"/>' +
    '<path d="M11.5 9.5h7.9c.5.9.9 2 1 3.2H13a1.5 1.5 0 0 1-1.5-1.5V9.5z"/>' +
    '<path d="M3.8 16H12" stroke-opacity=".6"/>',

  // Race-engineer headset.
  'team-radio':
    '<path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/>' +
    '<rect x="3" y="13.5" width="4" height="6" rx="1.5"/>' +
    '<rect x="17" y="13.5" width="4" height="6" rx="1.5"/>' +
    '<path d="M19 19.5c0 1.4-1.8 2.5-4.5 2.5H13"/>',

  // Start-light gantry: light pods hanging from the beam, all lit.
  'lights-out':
    '<path d="M2 4h20M4.5 4v2.5M9.5 4v2.5M14.5 4v2.5M19.5 4v2.5"/>' +
    '<rect x="2.5" y="6.5" width="4" height="11" rx="2"/><rect x="7.5" y="6.5" width="4" height="11" rx="2"/>' +
    '<rect x="12.5" y="6.5" width="4" height="11" rx="2"/><rect x="17.5" y="6.5" width="4" height="11" rx="2"/>' +
    '<g fill="currentColor" stroke="none">' +
    '<circle cx="4.5" cy="9.9" r="1.25"/><circle cx="9.5" cy="9.9" r="1.25"/><circle cx="14.5" cy="9.9" r="1.25"/><circle cx="19.5" cy="9.9" r="1.25"/>' +
    '<circle cx="4.5" cy="14.1" r="1.25"/><circle cx="9.5" cy="14.1" r="1.25"/><circle cx="14.5" cy="14.1" r="1.25"/><circle cx="19.5" cy="14.1" r="1.25"/>' +
    '</g>',

  // Paint brush.
  'livery-designer':
    '<path d="M18.6 3.6a2.1 2.1 0 0 1 3 3L13.2 15l-3-3 8.4-8.4z"/>' +
    '<path d="M10.2 12c-2.6 0-4.2 1.6-4.2 3.8 0 1.6-.8 2.7-2.5 3.2 1 .7 2.4 1 3.7 1 3 0 5.4-2.2 5.4-5"/>',
}

// Chequered flag — used for any game without a dedicated icon.
export const FALLBACK_GAME_ICON =
  '<path d="M5 21V4"/>' +
  '<path d="M5 4.5h13.5l-2.5 4 2.5 4H5"/>'
