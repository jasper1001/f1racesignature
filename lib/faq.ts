export interface FaqItem {
  q: string
  a: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'What is F1RaceSignature?',
    a: 'F1RaceSignature is a free F1 art generator that turns real Formula 1 lap telemetry into collectible poster art. Pick a legendary driver and race, choose a visualization, apply a cinematic theme, and export a museum-quality print of the lap.',
  },
  {
    q: 'Is the telemetry data real?',
    a: 'Yes. Racing lines and speed traces are built from real GPS car-position data sourced from official Formula 1 timing via the FastF1 dataset, then rendered on accurate circuit maps. Each poster reflects the actual path the car drove around the track.',
  },
  {
    q: 'Which drivers and races can I create posters for?',
    a: 'Twelve drivers and over twenty races. Icons including Ayrton Senna, Lewis Hamilton, Michael Schumacher, Max Verstappen, Alain Prost, Niki Lauda, Fernando Alonso, and Sebastian Vettel, plus modern stars Charles Leclerc, Lando Norris, George Russell, and Carlos Sainz — across legendary drives like Monaco 1984, Silverstone 2020, Leclerc\'s home win at Monaco 2024, Norris\' maiden win at Miami 2024, and Abu Dhabi 2021.',
  },
  {
    q: 'Can I see the live 2026 F1 season standings?',
    a: 'Yes. The 2026 Season page shows live driver standings, constructor standings, the most recent race result, and the full race calendar — pulled from official F1 timing data and updated automatically throughout the season.',
  },
  {
    q: 'What visualizations are available?',
    a: 'Four ways to render a lap as art: Racing Line (the exact GPS path through every corner), Speed Heatmap (the circuit colored blue-to-red by speed), Sector Split (the three timing sectors tinted green, yellow, and purple), and Overtake Map (battle positions marked along the circuit).',
  },
  {
    q: 'Is it free to use?',
    a: 'Yes — you can design and export a portrait poster for free with no account required. Just open the Studio, pick a driver and race, and create.',
  },
  {
    q: 'How do I download my F1 poster?',
    a: 'Open the Studio, configure your driver, race, visualization, and theme, then click Export Poster. Your artwork downloads instantly as a high-resolution PNG ready to print or share.',
  },
]
