export interface ArticleSection {
  heading?: string
  paragraphs: string[]
}

export interface Article {
  slug: string
  title: string
  description: string
  date: string
  readMinutes: number
  category: string
  intro: string
  sections: ArticleSection[]
}

export const ARTICLES: Article[] = [
  {
    slug: '10-greatest-f1-laps',
    title: 'The 10 Greatest Formula 1 Laps of All Time',
    description: 'From Senna\'s supernatural Monaco 1984 qualifying lap to Verstappen\'s championship decider at Abu Dhabi 2021 — the single laps that defined Formula 1 history.',
    date: '2025-11-01',
    readMinutes: 8,
    category: 'F1 History',
    intro: 'In a sport defined by fractions of seconds, certain laps rise above mere competition to become something else entirely — moments of genius, courage, or controlled fury that freeze time. These are the ten laps that every Formula 1 fan carries in their memory.',
    sections: [
      {
        heading: '10. Alain Prost — Monza 1985',
        paragraphs: [
          'The Italian Grand Prix of 1985 is rarely mentioned alongside the great dramatic drives of Formula 1, and that is precisely why it belongs on this list. Prost did not attack Monza — he solved it. While rivals chased maximum speed through the chicanes, The Professor calculated exactly the tyre management and fuel load required to win without ever exceeding the margin his car allowed.',
          'His fastest lap, a 1:28.283, told only part of the story. The real achievement was delivering it at precisely the right moment — not too early to compromise tyres, not too late to matter. It was chess played at 300 kilometres per hour. The win sealed Prost\'s first world championship and announced to the paddock that clinical intelligence was as deadly as raw pace.',
        ],
      },
      {
        heading: '9. Michael Schumacher — Spa 1995 (Race Lap)',
        paragraphs: [
          'Rain at Spa transforms the Circuit de Spa-Francorchamps from a breathtaking challenge into a survival exercise for most drivers. For Michael Schumacher in 1995, it was a canvas. As conditions oscillated between torrential downpours and damp patches, Schumacher threaded his Ferrari through Eau Rouge, Raidillon, and Pouhon at speeds that had his rivals visibly lifting.',
          'The gap he built that afternoon was not the product of a better car — Benetton and Williams were both competitive. It was entirely him, reacting to grip levels millisecond by millisecond in a way that appeared almost prescient. That Schumacher himself later called it one of the best performances of his career speaks volumes about how rare even he considered the display.',
        ],
      },
      {
        heading: '8. George Russell — São Paulo 2022 (Qualifying)',
        paragraphs: [
          'When George Russell took pole position at Interlagos in 2022, it was the moment that confirmed what every close observer of Formula 1 already suspected: that Mercedes had promoted a future world champion. The Autodromo José Carlos Pace\'s street-circuit character punishes the smallest error, yet Russell\'s lap was a sustained statement of authority — every sector a personal best, every corner committed to with the certainty of a driver who knew exactly where his car\'s limit was.',
          'The pole lap was the springboard for his maiden Grand Prix victory later that weekend, but it was the qualifying lap itself that resonated most. It had the feel of a driver announcing himself to history.',
        ],
      },
      {
        heading: '7. Charles Leclerc — Monza 2019 (Qualifying)',
        paragraphs: [
          'Leclerc\'s pole lap at the 2019 Italian Grand Prix carries a particular electricity because of what it represented. Ferrari had not won at Monza in nine years. The tifosi had almost given up believing. Then Leclerc threaded a 1:19.307 through the chicanes and the Parabolica — a lap so fast it stood as the outright circuit record for years afterward.',
          'What made it extraordinary was the slipstream management. Qualifying at Monza is as much about timing your lap to take a tow from a teammate or rival as it is about outright pace, and Leclerc orchestrated the entire session from the cockpit with a composure that felt ageless. He was 21 years old.',
        ],
      },
      {
        heading: '6. Lando Norris — Miami 2024 (Race Lap)',
        paragraphs: [
          'For 110 Formula 1 starts, Lando Norris had been the man who was always fastest at some point during a weekend but always denied at the finish. Then came Miami 2024. Norris did not just win his maiden Grand Prix — he dominated it from the moment he overtook Max Verstappen\'s Red Bull with a move that signalled McLaren\'s resurgence had arrived in full.',
          'His fastest race lap of 1:27.594 was set when the result was already assured, the product of a driver finally able to express himself without the anxiety of a maiden win hanging over him. The sheer pace of the McLaren MCL38 that afternoon suggested that the ground had shifted fundamentally in Formula 1, and Norris was the one standing on top of it.',
        ],
      },
      {
        heading: '5. Fernando Alonso — Monaco 2006 (Qualifying)',
        paragraphs: [
          'The Circuit de Monaco in 2006 witnessed a qualifying lap that carried the weight of history. Alonso in a Renault had been the dominant force of the 2005 season, and his Monaco pole lap that year demonstrated why: precise, unhurried, and yet devastatingly fast. Through the Tunnel, the chicane, and the approach to the Swimming Pool section, every apex was struck with the geometry of a mathematician and the feel of an artist.',
          'Alonso\'s affinity for Monaco runs deeper than any single lap — he has spoken of understanding the circuit\'s rhythm at the level of instinct. His 2006 effort at 1:15.985 captured that understanding on a single lap that reminded everyone watching that he had inherited the throne from Schumacher for very good reason.',
        ],
      },
      {
        heading: '4. Max Verstappen — Abu Dhabi 2021 (Race Lap)',
        paragraphs: [
          'The 2021 Abu Dhabi Grand Prix is inseparable from controversy — the final safety car deployment, the decisions made by race control, the championship decided on a single last lap. But stripped of everything else, Verstappen\'s actual lap around the Yas Marina Circuit to take the lead and hold it was a crystalline display of racecraft under the most extreme pressure imaginable.',
          'His 1:26.103 during the race was quick, but more than the number, it was the quality of his steering inputs and throttle management exiting every corner while protecting his tyres that stood out. He had been running fresh soft tyres against Hamilton\'s aged hards — a tyre delta of roughly 40 laps. He had to make them work immediately. He did.',
        ],
      },
      {
        heading: '3. Lewis Hamilton — Hungary 2020 (Qualifying)',
        paragraphs: [
          'Hamilton\'s pole lap at the 2020 Hungarian Grand Prix might be the cleanest single lap he ever produced at his peak. The Hungaroring is a circuit with no natural rhythm — tight, bumpy, relentlessly technical — and yet Hamilton\'s lap felt like a perfectly edited piece of music. Every gear change at the correct moment, every trail-braking entry judged to the millimetre, every mid-corner correction so small as to be invisible.',
          'The gap he built to his teammate Valtteri Bottas in qualifying — nearly a second — was the most stark illustration of the performance differential between Hamilton and every other driver during Mercedes\' dominant years. His 1:13.447 set a lap record that stood for seasons.',
        ],
      },
      {
        heading: '2. Michael Schumacher — Monaco 1994 (Qualifying)',
        paragraphs: [
          'The qualifying lap Michael Schumacher produced at Monaco in 1994 remains the most technically spectacular single lap ever set at the Circuit de Monaco. His Benetton-Ford was not the fastest car on the grid that weekend — Damon Hill\'s Williams and Ayrton Senna\'s McLaren were both theoretically quicker. Yet Schumacher proceeded to extract something from his car that physics could barely explain.',
          'Observers watching the data in real time could not account for the speed through Portier, through the Tunnel exit, through the Piscine. He was using track surface that others were treating as unsafe. It was the lap that truly announced Schumacher as something different — not just very fast, but operating in a different dimensional understanding of what a car could do.',
        ],
      },
      {
        heading: '1. Ayrton Senna — Monaco 1984 (Qualifying)',
        paragraphs: [
          'There is no debate. Ayrton Senna\'s qualifying lap at the 1984 Monaco Grand Prix is the greatest single lap in the history of Formula 1. He was driving a Toleman — a car that by any objective measure should not have been at the front of the Monaco grid. And yet Senna produced a 1:22.110 that left Alain Prost, Niki Lauda, and the entire establishment of Formula 1 struggling to find words.',
          'What makes the lap genuinely supernatural is what the data shows: Senna was not making small compromises in slow corners to find time elsewhere. He was simply faster everywhere. The Toleman\'s engine was not exceptional. Its aerodynamics were not leading-edge. The variable was entirely the human being behind the wheel — a 24-year-old from São Paulo who appeared to be in a trance, guided by something deeper than calculation.',
          'Decades later, Senna\'s own teammates and rivals still speak of that lap with a reverence that they reserve for nothing else. In a sport that runs on data, it stands as the single moment the data could not explain.',
        ],
      },
    ],
  },

  {
    slug: 'how-to-read-f1-telemetry',
    title: 'How to Read F1 Telemetry Data: A Complete Guide',
    description: 'GPS racing lines, speed traces, throttle and brake inputs, sector times — a beginner\'s guide to understanding the data that defines Formula 1.',
    date: '2025-11-08',
    readMinutes: 7,
    category: 'F1 Technology',
    intro: 'Every Formula 1 car generates hundreds of channels of data every second it is on track. Speed, throttle position, brake pressure, steering angle, gear selection, tyre temperature, fuel load — all of it captured, transmitted, and analysed in real time by hundreds of engineers. But the data that most clearly reveals a driver\'s genius is also the most visual: the GPS telemetry that maps exactly where on the track the car travelled, and how fast.',
    sections: [
      {
        heading: 'What Is F1 Telemetry?',
        paragraphs: [
          'Telemetry in Formula 1 refers to the continuous stream of data transmitted wirelessly from the car to the pit wall during every session. Modern F1 cars carry over 200 sensors measuring everything from wheel speed to aerodynamic load on individual wing elements. The data is processed in real time, giving engineers a complete picture of the car\'s behaviour at every point on the circuit.',
          'For fans and analysts, the most accessible part of this data is the GPS-derived car position combined with key performance metrics like speed, throttle, and brake. This is what we use to generate the racing line art on F1RaceSignature — real car paths, real speed data, rendered visually.',
        ],
      },
      {
        heading: 'Reading a Speed Trace',
        paragraphs: [
          'A speed trace plots a car\'s velocity against its position around the circuit lap. It looks like a mountain range: sharp peaks at the end of each straight where top speed is reached, followed by rapid drops as the driver brakes for the corner, then a gradual climb back up through the corner exit as they apply throttle.',
          'Comparing two drivers\' speed traces on the same lap reveals differences in technique immediately. A driver who brakes later will show the speed drop occurring further around the track. A driver who carries more mid-corner speed will show a shallower valley at the bottom of the trace. When Lewis Hamilton and Nico Rosberg were teammates at Mercedes, their speed traces through the same corners often looked identical — yet Hamilton\'s would be set half a tenth earlier in the braking zone, and half a tenth earlier in the throttle application. Those small differences, repeated across 60 corners per lap, added up to the championship gap between them.',
        ],
      },
      {
        heading: 'Throttle and Brake Inputs',
        paragraphs: [
          'Throttle and brake traces, plotted as percentages from 0 to 100, reveal a driver\'s style in ways that speed alone cannot. Smooth drivers like Alain Prost and Lewis Hamilton show gradual, progressive throttle applications — the line creeps upward steadily as they unwind the steering wheel. More aggressive drivers show sharper, more abrupt changes: full throttle applied much earlier in the corner, accepted at the cost of more tyre stress.',
          'Brake traces are equally revealing. Elite drivers brake with enormous initial force — the peak brake pressure at a heavy braking zone like the Bus Stop chicane at Spa can exceed 4G — before gradually releasing pressure through the corner entry in a technique called "trail braking." This keeps the car balanced and on the limit while reducing speed. The smoothness and precision of trail braking separates very good drivers from great ones.',
        ],
      },
      {
        heading: 'The GPS Racing Line',
        paragraphs: [
          'The GPS position data is what most clearly shows a driver\'s approach to a circuit. The classic racing line — outside, inside, outside through a corner — is visible as a sweep from the edge of the track to the apex and back again. But the real story is in the details: exactly where on the kerb a driver places their wheels, whether they use the full width of the track on exit, how early they commit to the apex.',
          'On slow, tight corners, differences in the racing line between drivers can be surprisingly large — tenths of a second available purely from finding a slightly better geometric line. At high-speed corners like Maggotts-Becketts at Silverstone or Eau Rouge at Spa, the lines converge because the physics allow much less variation. Everyone has to take essentially the same line, so the differences come from confidence and commitment rather than geometry.',
        ],
      },
      {
        heading: 'Sector Times and What They Reveal',
        paragraphs: [
          'Every Formula 1 circuit is divided into three sectors, each ended by a timing line on the track. Sector times let you diagnose precisely where one driver is gaining or losing time to another. A driver who is quick in Sector 1 but slow in Sector 3 is typically strong in high-speed corners but losing time in the slow, technical final section — often a car setup issue rather than a driver issue.',
          'The colour-coded sector time displays you see on television broadcasts — green for personal best, purple for outright best — are a simplified version of what engineers see with full granularity. They can identify whether a driver gained or lost a tenth in a single corner, identify the exact moment a braking point was moved, and trace exactly how tyre degradation affects lap time across a stint.',
        ],
      },
      {
        heading: 'How Teams Use Telemetry to Win',
        paragraphs: [
          'During a race, telemetry is the primary tool for pit wall engineers to manage strategy. Tyre degradation rates — how quickly the lap times slow as a set of tyres wears — are calculated from the speed data and used to predict the optimal pit stop window. Fuel consumption rates are tracked to the millilitre. Brake temperatures determine whether a driver can push harder or needs to manage more carefully.',
          'Driver coaching is another application. Engineers can see in the data exactly where a driver is losing time and communicate this over the radio — "you\'re losing a tenth at Turn 3, try a later brake point." In qualifying, the gap to the theoretical perfect lap can be calculated in real time, letting drivers know which corners to prioritise for their next attempt.',
        ],
      },
    ],
  },

  {
    slug: 'senna-schumacher-hamilton-greatest',
    title: 'Senna, Schumacher, Hamilton: Who Is the Greatest Formula 1 Driver?',
    description: 'Three drivers. Twenty-one world championships between them. A debate with no final answer — but plenty of evidence to examine.',
    date: '2025-11-15',
    readMinutes: 9,
    category: 'F1 History',
    intro: 'Formula 1 has produced many exceptional drivers across its seventy-year history, but three names define the argument about greatness more than any others: Ayrton Senna, Michael Schumacher, and Lewis Hamilton. Between them they hold twenty-one world championships, dozens of records, and the allegiance of multiple generations of fans. But who, when the argument is stripped to its essentials, was the greatest?',
    sections: [
      {
        heading: 'The Case for Ayrton Senna',
        paragraphs: [
          'Ayrton Senna\'s case for the greatest driver in Formula 1 history rests not on statistics — he won three championships, fewer than Schumacher or Hamilton — but on the quality of individual performances that have never been equalled. His qualifying laps in Monaco across the 1980s exist in a category of their own: supernatural extractions of speed from machinery that should not have been capable of it.',
          'Senna also drove in an era of genuine danger. Formula 1 in the late 1980s and early 1990s killed drivers regularly. The physical and psychological demands were different in kind from the sport today — no seamless-shift gearboxes, no traction control, no power steering. The physical effort of driving a 1988 McLaren MP4/4 for a full race distance was exhausting in a way that modern F1 cars, for all their other demands, are not.',
          'His partnership with McLaren Honda produced one of the most dominant single-season performances in Formula 1 history: 15 wins from 16 races in 1988, with the car that did not win coming home second. Senna himself won eight of those races. His title in 1991 — completed by crossing the line in São Paulo unable to lift his arms after driving the final laps with one gear — is the most willed championship victory in the sport\'s history.',
        ],
      },
      {
        heading: 'The Case for Michael Schumacher',
        paragraphs: [
          'Michael Schumacher won seven world championships. That number alone makes the argument for him, but the manner of those championships deepens the case further. Five of his titles came in succession between 2000 and 2004, a period in which he, Ferrari, Ross Brawn, and Jean Todt constructed the most ruthlessly efficient Formula 1 operation ever assembled. In 2004, Schumacher won 13 races from the first 14 of the season.',
          'But Schumacher\'s claim to greatness is not simply a function of wins and titles. It is the range of his ability. He was exceptional in the wet — his performance at Spa in 1995 under impossible conditions is one of the most technically accomplished drives in history. He was exceptional in technical circuits requiring mechanical sensitivity — the Hungaroring, the Nürburgring Nordschleife. He drove with an encyclopedic understanding of the car that allowed him to shape its development through feedback that was unusually precise and useful to his engineers.',
          'His physical preparation was also revolutionary for its time. Schumacher treated his fitness and his preparation as seriously as any professional athlete in any sport, and the paddock followed his lead. The modern Formula 1 driver\'s lifestyle of physical training and nutrition discipline is substantially his legacy.',
        ],
      },
      {
        heading: 'The Case for Lewis Hamilton',
        paragraphs: [
          'Lewis Hamilton holds the records: the most race wins in Formula 1 history, the most pole positions, the most podiums. He has won seven world championships, equalling Schumacher\'s record, and his 2020 season — 11 wins from 17 races in a shortened campaign — was arguably the most dominant individual performance in the modern era. His wet-weather ability at Silverstone, his management of a tyre puncture while leading on the final lap of the 2020 British Grand Prix, the sheer consistency across nearly two decades of top-level competition — the statistical case is overwhelming.',
          'Hamilton\'s longevity is itself a kind of argument. He was competitive enough to take pole position in 2023, a full sixteen years after his debut season. The ability to sustain elite performance through that arc of time — across different technical regulations, different teammates, different team cultures — requires not just talent but continuous adaptation, the willingness to rebuild oneself as a driver and as a competitor.',
          'His move to Ferrari in 2026 added a new chapter to a career that might already have been the greatest in the sport. That he continues to compete at the front with a new team and new machinery at the age when most drivers have long since retired speaks to a competitive hunger that has not diminished with time.',
        ],
      },
      {
        heading: 'The Verdict',
        paragraphs: [
          'Any honest verdict admits that the question may not be answerable, because the three drivers existed in different eras, with different cars, against different competition, under different rules, and within different structures of team support. Comparing Senna\'s 1988 McLaren Honda to Hamilton\'s 2020 Mercedes is not a straightforward exercise.',
          'What can be said is this: Senna produced performances that no data fully explains, that transcend what the machinery should have allowed. Schumacher rebuilt the methodology of Formula 1 and dominated it for half a decade in a way the sport has rarely seen. Hamilton sustained excellence across a career of unusual length and breadth, amassing a record that may never be surpassed.',
          'The wisest position is that Formula 1 has been fortunate enough to have three drivers who, in their respective peaks, were operating at a level unreachable by anyone around them. The debate about who was greatest is what keeps the sport\'s history alive between races — which may be its true value.',
        ],
      },
    ],
  },

  {
    slug: 'f1-racing-lines-explained',
    title: 'The Science of F1 Racing Lines: Why Every Meter of Track Matters',
    description: 'The geometric racing line, late apex vs early apex, how tyre width changes everything — everything you need to understand how Formula 1 drivers find the fastest path around a circuit.',
    date: '2025-11-22',
    readMinutes: 6,
    category: 'F1 Technology',
    intro: 'A Formula 1 car travelling at 300 kilometres per hour through a corner has access to only a finite amount of grip. Distributed correctly across the length of the corner, that grip produces the fastest possible exit speed. Distributed incorrectly — too much used for braking, too little available for acceleration — and tenths of a second disappear on every lap. The racing line is the geometry that solves this problem.',
    sections: [
      {
        heading: 'What Is a Racing Line?',
        paragraphs: [
          'The racing line is the path through a corner — and through a sequence of corners — that allows a car to maintain the highest possible average speed. It is not, in most cases, the shortest path. The shortest path through a corner is a tight arc hugging the inside of the track. The fastest path is typically much wider, using the full width of the track to straighten the arc of the corner and therefore reduce the cornering force required for any given speed.',
          'By using more of the available track width — entering from the outside, touching the inside apex of the corner, and exiting wide again — a driver effectively increases the radius of the corner they are travelling through. A larger radius requires less lateral force to maintain at a given speed, which means more of the tyre\'s grip budget is available for acceleration rather than being consumed by cornering.',
        ],
      },
      {
        heading: 'The Geometric vs the Late Apex',
        paragraphs: [
          'The geometric racing line takes the apex at the mathematical centre of the corner. It produces the largest possible radius and is theoretically the fastest approach on a single, isolated corner. But Formula 1 circuits are not composed of isolated corners — they are sequences, and the exit of one corner feeds directly into the entry of the next.',
          'This is why experienced drivers and engineers distinguish between the geometric apex and the "late apex." By deliberately taking the apex later in a corner — deeper into the corner, closer to the exit — a driver can straighten the exit more aggressively. This trades a slightly slower entry for a much faster exit, and because the following straight is where the car accelerates most effectively, gaining exit speed is nearly always more valuable than optimising mid-corner speed.',
        ],
      },
      {
        heading: 'Why Tyre Compounds Change Everything',
        paragraphs: [
          'The available grip changes throughout a Formula 1 race as the tyres degrade. A driver on fresh soft tyres has significantly more cornering grip than a driver on 30-lap-old medium compounds. This changes the optimal racing line in subtle but measurable ways. On fresh rubber, a driver can afford to attack the apex more aggressively and carry more mid-corner speed. On worn tyres, the priority shifts to stability: a more conservative line that puts less lateral stress on the tyre\'s outer shoulder.',
          'Tyre management — the art of driving quickly while preserving the rubber — is one of the most underappreciated skills in Formula 1. Drivers who can modulate their style to minimise tyre stress without losing significant lap time extend their pit stop windows and gain strategic flexibility. Sergio Pérez built his entire reputation on this skill, regularly running tyres twenty or thirty laps longer than his teammates on the same compound.',
        ],
      },
      {
        heading: 'How Telemetry Reveals the Perfect Line',
        paragraphs: [
          'The GPS data from modern F1 telemetry makes the racing line literally visible. By plotting the car\'s X and Y coordinates from the official timing system against the circuit outline, it is possible to see exactly where on the track the car was at every moment of the lap. This is what F1RaceSignature uses to generate the racing line art for each poster — the actual GPS path the car took around the circuit.',
          'When you overlay two drivers\' GPS traces on the same corner, the differences in their preferred lines become immediately apparent. Some drivers run a more geometric line with earlier apexes; others consistently late-apex every corner. Some use all the kerb on exit; others stay conservative. The data reveals that even at the very highest level of the sport, there is no single "correct" line — there are different solutions that work for different drivers in different cars.',
        ],
      },
      {
        heading: 'Corners That Define Championships',
        paragraphs: [
          'Certain corners in Formula 1 have become legendary not just for their challenge but for how clearly they reveal a driver\'s approach to the racing line. Eau Rouge and Raidillon at Spa is a flat-out compression that separates drivers who fully commit — taking the left-right-left sequence without lifting — from those who feel the merest shadow of doubt at 300 km/h and lose a tenth. Maggotts-Becketts-Chapel at Silverstone is a sustained high-speed sequence where the optimal line requires committing to the next corner\'s apex while still finishing the current one.',
          'The Parabolica at Monza is perhaps the most strategically critical single corner in Formula 1. Its radius tightens slightly through the exit, punishing drivers who apex too early with understeer onto the main straight. Getting the Parabolica right is worth more than two or three tenths per lap — at Monza, where margins are tiny, it can be the difference between winning and finishing second.',
        ],
      },
    ],
  },

  {
    slug: 'f1-data-strategy',
    title: 'How Formula 1 Teams Use Data to Win Races',
    description: 'Hundreds of sensors, thousands of data points per second, hundreds of engineers watching every number — the hidden world of data analysis that decides Formula 1 races.',
    date: '2025-11-29',
    readMinutes: 7,
    category: 'F1 Technology',
    intro: 'Modern Formula 1 is as much a data science competition as it is a driving contest. Every car generates more than 3 GB of data per race weekend. That data is analysed in real time by engineers in the garage, transmitted to factory-based simulation centres, and used to make decisions — some of them within seconds — that determine race outcomes. Understanding how teams use this information reveals a dimension of the sport that television coverage barely touches.',
    sections: [
      {
        heading: 'The Data That Flows From Every Car',
        paragraphs: [
          'A contemporary Formula 1 car carries over 200 individual sensors measuring every aspect of its performance. Wheel speed sensors on each corner calculate tyre slip in real time. Strain gauges on suspension components measure aerodynamic load. Temperature sensors throughout the braking system track disc and pad temperatures into the hundreds of degrees Celsius. Gyroscopes measure body roll and pitch. GPS units update the car\'s position many times per second.',
          'All of this data is transmitted wirelessly from the car to the pit wall several times per second using high-bandwidth radio links. Engineers monitoring individual systems see the car\'s complete health in real time — a brake temperature spike, an unusual fuel flow reading, a suspension deflection that differs between left and right — and can alert the driver before a problem becomes a failure.',
        ],
      },
      {
        heading: 'Strategy: The Race Within the Race',
        paragraphs: [
          'The most visible application of data in Formula 1 is race strategy. The fundamental question — when to pit, and for what tyre — is determined by a combination of real-time lap time data, tyre degradation models, and traffic simulation. Every lap the car completes produces a lap time, and the rate at which that lap time slows as the tyres degrade is the key input to strategy decisions.',
          'Teams run highly sophisticated traffic simulations that model the positions of every car on the circuit at every moment. When considering whether to pit on lap 28 or lap 32, the strategist needs to know not just whether there is a tyre advantage, but whether pitting will drop the driver behind a slower car that will be difficult to pass. This simulation runs continuously throughout the race, updated with every lap time from every car.',
        ],
      },
      {
        heading: 'The Role of Machine Learning',
        paragraphs: [
          'Formula 1 teams have been applying machine learning and statistical modelling to their data for longer than most industries. The challenge is that Formula 1 data is simultaneously enormous in volume and limited in sample size — there are only twenty-three races per season, and conditions between races vary enough that simple extrapolation is unreliable.',
          'Teams handle this by building models from historical data across multiple seasons, then calibrating them rapidly with data from the current race weekend. A tyre degradation model built on the previous five years of data at a given circuit can be updated with the first ten laps of practice to produce a highly accurate prediction for the race. The feedback loop between historical modelling and real-time calibration is one of the most sophisticated data processes in professional sport.',
        ],
      },
      {
        heading: 'Driver Coaching and Performance Analysis',
        paragraphs: [
          'Beyond strategy, telemetry is used continuously to help drivers find more performance. In practice sessions, engineers compare the driver\'s data to reference laps — either their own previous best, a teammate\'s performance, or a simulated "ideal lap" constructed by combining the best sector from every lap completed.',
          'The feedback can be startlingly specific. Not just "you\'re losing time at Turn 7" but "you\'re braking 8 metres earlier than your reference at Turn 7 and your minimum speed is 12 km/h below the reference, suggesting you can carry 15 more metres of brake before the corner without exceeding tyre limits." This level of precision is only possible because the data resolves every corner into dozens of individual data points that can be compared with exactness.',
        ],
      },
      {
        heading: 'The Factory Operation',
        paragraphs: [
          'On a race weekend, most Formula 1 teams operate what they call a "Mission Control" or "Remote Operations Centre" at their factory — sometimes hundreds or thousands of kilometres from the circuit. Dozens of additional engineers monitor the car\'s systems from the factory, providing specialist analysis that the garage crew cannot match with their smaller on-site teams.',
          'These factory-based engineers have access to exactly the same data as the pit wall, but they can also run computationally intensive simulations that would be impractical on the smaller systems at the track. A factory aerodynamicist can model the effect of a car setup change using computational fluid dynamics during the lunch break of a practice session and have a recommendation back to the trackside engineers before the session resumes. This remote capability has become one of the defining competitive dimensions of modern Formula 1.',
        ],
      },
    ],
  },

  {
    slug: 'greatest-f1-championships',
    title: 'The Greatest Formula 1 Championship Battles in History',
    description: 'Senna vs Prost, Schumacher vs Hill, Hamilton vs Rosberg, Hamilton vs Verstappen — the championship seasons that pushed Formula 1 to its most dramatic heights.',
    date: '2025-12-06',
    readMinutes: 8,
    category: 'F1 History',
    intro: 'A Formula 1 world championship decided in the final race, on the final lap, between two drivers who started the day equal on points — these are the moments the sport lives for. Some seasons produce clear dominance; others produce battles of such intensity that they define the entire image of Formula 1 for the generation that witnessed them.',
    sections: [
      {
        heading: 'Senna vs Prost: 1988–1990',
        paragraphs: [
          'The Senna-Prost rivalry across three seasons at McLaren Honda and then between McLaren and Ferrari is the defining narrative of Formula 1\'s late turbo era and the most psychologically rich rivalry the sport has ever produced. Two men of completely different temperaments — Senna mystical and intense, Prost clinical and strategic — who happened to be driving the fastest car in Formula 1 at exactly the same time.',
          'Their relationship deteriorated from carefully maintained cordiality to open hostility within two seasons of being teammates. The collisions at Suzuka in 1989 and 1990 — both of which decided the championship — remain the most controversial moments in the sport\'s history. In 1989, Senna was disqualified after they collided while Prost was leading; in 1990, Senna took Prost out at the first corner to claim the title he felt had been denied him the previous year.',
          'Three championships in three years split between them. The rivalry raised questions about sporting behaviour, team politics, and the boundary between aggressive racing and deliberate fouling that Formula 1 has never definitively answered.',
        ],
      },
      {
        heading: 'Schumacher vs Damon Hill: 1994',
        paragraphs: [
          'The 1994 Formula 1 season was the most turbulent in decades. Roland Ratzenberger and Ayrton Senna died at Imola within 24 hours. Safety was suddenly the most pressing issue in the sport. And in the middle of this, Michael Schumacher in a Benetton and Damon Hill in a Williams contested one of the tightest championship battles the sport had seen.',
          'The season was decided at the final race in Adelaide, Australia, in one of the most disputed moments in Formula 1 history. Schumacher, leading the championship by a single point, hit the wall on lap 36. Hill attempted to pass him through the gap. The cars made contact. Hill retired with suspension damage. Schumacher\'s Benetton was beached on the gravel. Schumacher was world champion. Whether the contact was a racing incident or a deliberate manoeuvre by Schumacher to prevent Hill from winning has never been resolved to everyone\'s satisfaction.',
        ],
      },
      {
        heading: 'Hamilton vs Rosberg: 2016',
        paragraphs: [
          'The 2016 Formula 1 season is the most psychologically intense championship battle since Senna and Prost. Lewis Hamilton and Nico Rosberg had been friends since karting, but by their final season as Mercedes teammates, the relationship had become brittle under the accumulated pressure of competing for world championships in the same car.',
          'Hamilton won nine races to Rosberg\'s nine, but the title came down to the Abu Dhabi finale where Rosberg simply needed to finish in the top three behind Hamilton to take the championship. Hamilton drove slowly on the final laps, trying to bring cars behind him into play against Rosberg. The strategy failed — Rosberg finished second, Hamilton first, and Rosberg was world champion by five points. He retired from Formula 1 five days later.',
        ],
      },
      {
        heading: 'Verstappen vs Hamilton: 2021',
        paragraphs: [
          'The 2021 Formula 1 season is the most contested championship in the hybrid era, a year-long battle between Red Bull\'s Max Verstappen and Mercedes\' Lewis Hamilton that went to the wire in the most controversial manner possible. Verstappen won from pole in Bahrain, Hamilton struck back at Imola, Verstappen won Monaco, Hamilton struck back at Silverstone — where they collided at Copse, Verstappen crashing at high speed and Hamilton receiving a ten-second time penalty before winning the race.',
          'By the Abu Dhabi finale, they were tied on points. The safety car controversy that followed — the decision by race director Michael Masi to allow only the lapped cars directly between Hamilton and Verstappen to unlap themselves, leaving Hamilton on degraded tyres immediately behind Verstappen who had just pitted for fresh rubber — produced a final lap that decided the championship and triggered months of debate about the governing of the sport.',
          'Whatever the verdict on the sporting governance, the season itself was a genuine battle between two extraordinary drivers at the peak of their abilities, with the most dramatic conclusion Formula 1 has produced in decades.',
        ],
      },
    ],
  },

  {
    slug: 'understanding-f1-sector-times',
    title: 'Understanding F1 Sector Times: What the Numbers Really Reveal',
    description: 'Green, purple, yellow — what sector time colours mean, how teams use them for strategy, and what they tell you about driver performance and car setup.',
    date: '2025-12-13',
    readMinutes: 5,
    category: 'F1 Technology',
    intro: 'The coloured sector time displays that flash on your television screen during Formula 1 qualifying sessions tell a complete story in three numbers. Green means a driver\'s personal best. Purple means the fastest anyone has gone all session. Yellow means slower than before. But behind those simple colours is one of the sport\'s most powerful analytical tools — a framework that teams use to diagnose car setup, identify driver mistakes, and build strategy for qualifying and the race.',
    sections: [
      {
        heading: 'How Sectors Are Defined',
        paragraphs: [
          'Every Formula 1 circuit is divided into three sectors by timing lines painted across the track. The exact placement of these lines varies by circuit and is decided by the FIA, but the general principle is that each sector represents a distinct character of the circuit. At Silverstone, for instance, Sector 1 covers the long, fast opening sequence through Copse and Maggotts-Becketts-Chapel; Sector 2 the more technical middle section; Sector 3 the final blast through Stowe, Vale, and Club.',
          'Within each sector, mini-sectors provide even finer granularity — splitting the circuit into much shorter segments that can identify performance differences in individual corners. Teams see this full mini-sector data in real time; television viewers see only the summary three-sector data.',
        ],
      },
      {
        heading: 'What Sector Times Reveal About Car Setup',
        paragraphs: [
          'Different cars have different strengths across different types of corners, and sector times make these strengths immediately visible. A car with high-downforce aerodynamic configuration will be strong in Sector 1 at Silverstone — the fast, sweeping corners where aerodynamic grip matters most — but may concede time in Sector 3 if it carries more drag than a lower-downforce rival.',
          'This is why teams sometimes make deliberately asymmetric setup choices. At Monza, where the circuit is essentially three long straights and three heavy braking zones, almost all teams run the lowest possible downforce levels. But at Monaco, where top speed is irrelevant and mechanical grip through slow corners is everything, the wings are at their maximum. The sector time splits from Friday practice are the primary data source for refining these setup decisions through the weekend.',
        ],
      },
      {
        heading: 'Driver vs Car: Reading the Difference',
        paragraphs: [
          'The most valuable use of sector time analysis is separating driver performance from car performance. If a driver is losing time in Sector 2 but competitive in Sectors 1 and 3, the question is whether that reflects a car setup weakness in medium-speed corners (the car) or a driver error at a particular corner (the driver). Only by examining the mini-sector data within Sector 2, corner by corner, does the answer emerge.',
          'When two teammates\' sector times are compared, the picture becomes even clearer because both drivers are in identical cars. If one consistently gains three tenths in Sector 1 but loses two of those tenths in Sector 3, the difference is purely technique. Engineers work with each driver independently to identify where those differences come from and whether they are systematic (a driver prefers a different corner entry style) or correctable (a driver is making a consistent error at a specific braking point).',
        ],
      },
      {
        heading: 'Sector Times in Race Strategy',
        paragraphs: [
          'During a race, sector times are tracked continuously to monitor tyre degradation and identify when a car\'s lap times are beginning to fall significantly. The pattern of degradation is different across sectors — tyres often lose performance progressively in the more demanding, higher-energy corners first. Watching the split between Sector 1 and Sector 3 degradation rates can indicate whether a set of tyres is degrading uniformly (healthy) or losing performance specifically in one type of corner (potentially heading toward a cliff).',
          'Safety car periods change the strategic calculus immediately. When the safety car is deployed, teams must decide in seconds whether to pit. The sector time data from the laps immediately before and after the safety car helps engineers calculate whether the undercut — pitting under the safety car for fresh tyres — will produce enough pace advantage on the restart to justify the position loss from stopping.',
        ],
      },
    ],
  },

  {
    slug: 'iconic-f1-circuits-explained',
    title: 'The World\'s Most Iconic Formula 1 Circuits Explained',
    description: 'Monaco\'s claustrophobic streets, Spa\'s forest sweeps, Suzuka\'s figure-of-eight, Monza\'s flat-out blasts — the circuits that define the soul of Formula 1.',
    date: '2025-12-20',
    readMinutes: 7,
    category: 'F1 Circuits',
    intro: 'Formula 1 has raced on more than seventy circuits across every inhabited continent. Most have been serviceable venues. A handful have been genuinely legendary — places where the history of the sport is layered so thickly into the asphalt that even a practice session feels like a pilgrimage. These are those circuits.',
    sections: [
      {
        heading: 'Monaco: The Greatest Challenge in Motorsport',
        paragraphs: [
          'The Circuit de Monaco is 3.337 kilometres of narrow, concrete-lined streets that wind through the hillside principality with no margin for error whatsoever. It is objectively the most difficult circuit on the Formula 1 calendar — not because of the raw speed demanded, but because of the consequence of any mistake. The barriers are centimetres from the car at every point. A mistake that would be a minor incident at another circuit is a race-ending crash at Monaco.',
          'What makes Monaco extraordinary is that a driver who is truly comfortable here — who has learned to flow through the Tunnel, to balance the car through the Casino square, to thread the Swimming Pool section without washing the front tyres wide — can find time that never appears in telemetry analysis. There is something intangible about Monaco pace. Senna\'s six Monaco wins remain the definitive statement of that intangibility.',
          'The most important corner at Monaco is the Nouvelle Chicane, the slow right-left-right combination after the Tunnel exit. Getting this corner right is worth far more than a tenth per lap — it determines the car\'s speed down to Tabac and into the Swimming Pool, two of the highest energy sections of the circuit. A clean Nouvelle Chicane is the heartbeat of a fast Monaco lap.',
        ],
      },
      {
        heading: 'Spa-Francorchamps: The Driver\'s Circuit',
        paragraphs: [
          'Circuit de Spa-Francorchamps is the circuit that Formula 1 drivers most consistently name as their favourite. Seven kilometres of Belgian Ardennes forest, multiple weather conditions often simultaneously at different parts of the track, and a layout that demands every type of driving skill: high-speed commitment through Eau Rouge and Raidillon, precision through the Bus Stop chicane, smooth aggression through Blanchimont.',
          'Eau Rouge is the most famous individual corner sequence in Formula 1. The compression and rise through the bottom of the valley — entering the dip at nearly 300 km/h, then pulling up the incline toward Raidillon while the track turns left — generates forces on the driver and car that feel, at limit, like the laws of physics are being negotiated rather than obeyed. Modern cars take the combination without lifting, but it remains the single most emotionally intense corner in the sport.',
          'Spa\'s unpredictable weather is part of its character. It is the only circuit on the Formula 1 calendar where it can be raining heavily at La Source and completely dry at Rivage — three kilometres of circuit between them. This produces strategy situations of extraordinary complexity and driving conditions that separate confident wet-weather artists from drivers who merely manage the conditions.',
        ],
      },
      {
        heading: 'Suzuka: Where Championships Are Decided',
        paragraphs: [
          'Suzuka Circuit in Japan is unusual in world motorsport: a figure-of-eight layout that requires a bridge over the track, on a circuit that has hosted more decisive championship moments than perhaps any other venue in the world. Senna clinched his 1988 and 1990 titles here. Schumacher took his first title at Suzuka in 1994 and celebrated multiple subsequent championships on the same ground. Verstappen\'s 2022 title was confirmed at Suzuka in rainy conditions that encapsulated everything about the circuit\'s drama.',
          'The signature feature of Suzuka is the Esses — a rapid sequence of high-speed direction changes that begins shortly after the start. Taken at race speed without lifting, the Esses demand the car\'s aerodynamic balance to be near perfect and the driver\'s commitment to be absolute. Getting through the Esses cleanly, in exactly the right position for the downhill approach to Dunlop curve, is one of the great skills specific to Suzuka.',
          'The final sector, from Spoon curve through the long right-hand 130R corner to the Casio chicane and final hairpin, is as technically demanding as anywhere in Formula 1. 130R — a long, fast right-hander that demands full commitment — is one of the fastest corners in regular Formula 1 use. The adjacent chicane then requires violent braking from extreme speed, producing one of the sport\'s most extreme tyre energy events in a very short distance.',
        ],
      },
      {
        heading: 'Monza: The Temple of Speed',
        paragraphs: [
          'The Autodromo Nazionale Monza is the oldest circuit on the Formula 1 calendar, having hosted its first grand prix in 1922. Its character is defined entirely by its three long straights and three heavy braking zones — a layout that rewards low aerodynamic drag above all else and produces the highest average speeds of any circuit on the calendar, with cars reaching 360 km/h on the main straight.',
          'The Parabolica — the long, tightening right-hand corner at the end of the back straight that feeds onto the main straight — is the most strategically critical corner at Monza. A car with good traction out of the Parabolica will carry more speed all the way down the following straight, and at a circuit where fractions of a kilometre per hour determine race positions, the Parabolica matters more than any other single corner.',
          'Monza\'s significance extends beyond its design. It is the home of the tifosi — Ferrari\'s passionate Italian fanbase — and the emotional atmosphere on race day is unlike anywhere else in Formula 1. Ferrari\'s wins at Monza carry a particular weight, and the years when a scarlet car does not reach the podium are felt as communal loss by hundreds of thousands of people.',
        ],
      },
      {
        heading: 'Silverstone: Britain\'s Racing Home',
        paragraphs: [
          'Silverstone was a Second World War airfield before it became the home of the British Grand Prix. Its wartime past explains its flat, open character — a dramatic contrast to the elevation changes of Monaco or Spa, but with sweeping, high-speed corners that challenge drivers in a completely different way. Maggotts-Becketts-Chapel, the rapid left-right-left sequence in the middle sector, is widely regarded as the most spectacular corner sequence in Formula 1.',
          'Hamilton\'s qualification for the 2020 British Grand Prix produced a lap around Silverstone that defined his peak: a 1:24.303 that stood nearly 1.5 seconds clear of his nearest rival. That he then won the race while nursing a puncture on the final lap — crossing the line on three wheels, barely able to celebrate — made the weekend one of the most complete performances in modern Formula 1 history.',
        ],
      },
    ],
  },

  {
    slug: 'hamilton-vs-schumacher',
    title: 'Hamilton vs Schumacher: Who Is the Greatest Formula 1 Driver of All Time?',
    description: 'Seven world championships each. Records broken and then broken again. The definitive head-to-head examination of the two greatest Formula 1 drivers in history.',
    date: '2026-06-15',
    readMinutes: 9,
    category: 'F1 History',
    intro: 'No debate in Formula 1 carries more weight, more evidence, or more genuine complexity than the question of whether Lewis Hamilton or Michael Schumacher was the greater driver. Both men hold seven world championships. Both dominated their respective eras with a completeness that left rivals competing for second place. Both transformed the sport — Schumacher the methodology, Hamilton the culture and the statistical records. But only one can be called the greatest. What follows is the most honest examination of the evidence.',
    sections: [
      {
        heading: 'The Records',
        paragraphs: [
          'On pure statistics, Hamilton wins without debate. He holds the records for the most race victories in Formula 1 history (104 as of his final Mercedes season), the most pole positions (103), and the most podium finishes. He has won races on every continent Formula 1 has visited. He has taken victories across five different technical regulatory eras. He matched Schumacher\'s seven championship record in 2020 and would have overtaken it had the 2021 season finished differently.',
          'Schumacher\'s statistics are themselves extraordinary — 91 race wins (a record that stood for fifteen years until Hamilton broke it), 68 pole positions, five consecutive world championships between 2000 and 2004. But compared to Hamilton\'s totals, they are smaller in almost every measurable category. If statistics alone settled the debate, Hamilton would be the clear answer.',
        ],
      },
      {
        heading: 'Era and Competition',
        paragraphs: [
          'The most important counter-argument for Schumacher is the quality of the competition he faced. In the 1994 season, his rivals included Damon Hill in a Williams that was arguably the faster car, and Schumacher still won the championship. In the late 1990s, he was competing against Häkkinen — one of the most naturally gifted drivers of his generation — in machinery that was often inferior to the McLaren. The fact that Ferrari\'s two pre-Schumacher championship years in the 1990s produced only one title says something about how competitive the midfield and top teams were in that era.',
          'Hamilton\'s championship years with Mercedes from 2014 to 2020 were contested in a car that was, for most of those seasons, the fastest or joint-fastest car on the grid. His rivals were Rosberg, Vettel, and Räikkönen — very good drivers but not operating at the supernatural level of Häkkinen at his peak or Hill in 1996. The asterisk that some attach to Hamilton\'s dominance is precisely this: how much of it was Hamilton, and how much was the W05, W07, W10?',
        ],
      },
      {
        heading: 'Head-to-Head by the Numbers',
        paragraphs: [
          'Direct comparisons are only possible through teammates, and here the evidence is instructive. Hamilton outscored every teammate in every season he competed — Alonso in 2007, Button across four seasons, Rosberg across three, Bottas across four. Schumacher outscored his teammates at Ferrari consistently but faced a more difficult direct comparison at Mercedes in his 2010–2012 return, where Rosberg matched and occasionally beat him.',
          'Against shared rivals, Hamilton and Schumacher\'s records are comparable. Both beat Räikkönen when they competed against him directly. Both beat Alonso in direct competition. What the teammate data most clearly shows is that both drivers elevated themselves above their direct competition in ways that teammates could not replicate — which is the most direct evidence we have for individual genius.',
        ],
      },
      {
        heading: 'Physical Era vs Mental Resilience',
        paragraphs: [
          'The physical demands of Schumacher\'s cars were different in kind from Hamilton\'s. The Ferrari F2002 had no power steering — Schumacher was physically steering a 600kg car at race speeds for up to two hours. The Benetton B194 in which he won his first championship had no traction control, no ABS, no seamless shift gearbox. Whether this makes Schumacher\'s performances more impressive or simply harder to compare is exactly the type of question that cannot be answered with data.',
          'Conversely, Hamilton has sustained elite performance for twenty years — six years longer than Schumacher\'s competitive career. The mental resilience required to maintain motivation, focus, and performance across that timeframe, while representing a sport as its most prominent Black driver through its reckoning with questions of diversity and inclusion, is a dimension of Hamilton\'s achievement that no statistical comparison captures.',
        ],
      },
      {
        heading: 'The Verdict',
        paragraphs: [
          'The honest verdict is that Hamilton and Schumacher represent two different peaks of human achievement in Formula 1, separated by twenty years and expressing their excellence in different ways. Schumacher\'s peak — from his 1994 Monaco qualifying lap to the 2004 Hungarian Grand Prix — produced individual performances that no data fully explains. His ability to find time in conditions that his rivals could not access, to push a car to a limit that appeared to belong to a different category, is the strongest argument for his greatness.',
          'Hamilton\'s career, taken whole, is the greatest in the sport\'s history. The span of it, the records it has produced, the consistency across technical eras and competitive environments, the individual moments of brilliance embedded within the long statistical arc — from his first season in 2007 to his Barcelona victory for Ferrari in 2026 — add up to an achievement that Schumacher\'s career, for all its extraordinary qualities, does not surpass on the full accounting.',
          'But — and this is the caveat that the debate deserves — if you were to select one race, one qualifying session, one moment in which a Formula 1 driver appeared to exceed what is physically possible in a racing car, the weight of evidence points to Schumacher. Hamilton\'s genius is sustained; Schumacher\'s peak, at its highest, may have been higher. Both answers are defensible. Neither is final. This is what makes the debate worth having.',
        ],
      },
    ],
  },
]

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

export function getAllArticleSlugs(): string[] {
  return ARTICLES.map((a) => a.slug)
}
