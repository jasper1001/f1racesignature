export type ResultType =
  | 'Perfect Call'
  | 'Smart but Risky'
  | 'Understandable Mistake'
  | 'Strategy Disaster'

export interface StrategyOption {
  id: string
  text: string
  score: number
  resultType: ResultType
  explanation: string
}

export interface Scenario {
  id: string
  title: string
  subtitle: string
  grandPrix: string
  year: number
  lap: string
  role: string
  context: string[]
  question: string
  options: StrategyOption[]
  actualOutcome: string
  didYouKnow: string
}

export type StrategistRating =
  | 'Master Strategist'
  | 'Pit Wall Genius'
  | 'Solid Race Engineer'
  | 'Ferrari Strategy Department'
  | 'Back to the Simulator'

export function getRating(score: number): { label: StrategistRating; message: string; color: string } {
  if (score >= 800) return { label: 'Master Strategist',          message: 'Toto is checking your LinkedIn.',        color: '#d4a017' }
  if (score >= 600) return { label: 'Pit Wall Genius',            message: 'You belong on the pit wall.',            color: '#c0c0c0' }
  if (score >= 400) return { label: 'Solid Race Engineer',        message: 'A few more laps and you\'ll get there.', color: '#cd7f32' }
  if (score >= 200) return { label: 'Ferrari Strategy Department',message: 'Ferrari might call you soon. 😅',        color: '#e8002d' }
  return                    { label: 'Back to the Simulator',     message: 'Back to the strategy simulator.',        color: '#555555' }
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'abu-dhabi-2021',
    title: 'Abu Dhabi 2021',
    subtitle: 'The championship is decided in five laps.',
    grandPrix: 'Abu Dhabi Grand Prix',
    year: 2021,
    lap: 'Lap 53 of 58',
    role: 'You are the Mercedes strategist.',
    context: [
      'Hamilton leads by a few seconds, on track for the championship.',
      'Latifi crashes, bringing out a Safety Car with five laps remaining.',
      'Hamilton is on old, worn hard tyres.',
      'Verstappen immediately pits for fresh soft tyres.',
      'Five lapped cars sit between Hamilton and Verstappen.',
    ],
    question: 'Hamilton is leading. The Safety Car is out. What do you do?',
    options: [
      {
        id: 'pit',
        text: 'Pit Hamilton for fresh soft tyres',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Fresh tyres help Hamilton defend on the restart, but pitting means surrendering the lead. It becomes a pure racing gamble over five laps.',
      },
      {
        id: 'stay',
        text: 'Stay out and keep track position',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Mercedes stayed out to protect the lead. But the race director controversially un-lapped only selected cars, placing Verstappen directly behind on fresh softs. Hamilton couldn\'t defend.',
      },
      {
        id: 'retire',
        text: 'Accept 2nd place — bank the points safely',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Both drivers were level on points. Accepting 2nd would have handed Verstappen the championship. Never a viable option.',
      },
    ],
    actualOutcome: 'Mercedes stayed out to hold the lead. The race director controversially allowed only some lapped cars to un-lap, placing Verstappen directly behind Hamilton on fresh softs. Verstappen overtook Hamilton on the final lap and won his first World Championship.',
    didYouKnow: 'Race director Michael Masi was removed from his role following the controversy. Mercedes initially protested the result but later withdrew, accepting the outcome.',
  },
  {
    id: 'monaco-2016',
    title: 'Monaco 2016',
    subtitle: 'The Virtual Safety Car window closes in seconds.',
    grandPrix: 'Monaco Grand Prix',
    year: 2016,
    lap: 'Lap 34 of 78',
    role: 'You are the Mercedes strategist.',
    context: [
      'Rosberg leads the race. Hamilton is running 3rd.',
      'A Virtual Safety Car is triggered by a mechanical retirement ahead.',
      'Hamilton is overdue for his pit stop on ageing medium tyres.',
      'The VSC cuts pit stop time loss significantly — a rare opportunity.',
      'Teams have roughly 30 seconds to react before the window closes.',
    ],
    question: 'A VSC is deployed. Hamilton is overdue his stop. Do you pit now?',
    options: [
      {
        id: 'pit-now',
        text: 'Pit Hamilton immediately under the VSC',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'The VSC window dramatically reduces the time lost in the pits. Pitting now is almost free compared to a standard stop. This is an obvious call that should never be missed.',
      },
      {
        id: 'wait',
        text: 'Wait one more lap for the perfect entry window',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'The VSC window is live right now. Waiting even one lap means paying full pit stop time at Monaco, where overtaking is nearly impossible. A delay here ends the race.',
      },
      {
        id: 'no-pit',
        text: 'Skip the stop — run to the finish on old tyres',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Extending ageing mediums 44 more laps at Monaco risks a tyre failure. The VSC was a gift. Not using it is simply an error.',
      },
    ],
    actualOutcome: 'Mercedes inexplicably failed to pit Hamilton under the VSC. He lost enormous time in a later full pit stop and finished 2nd behind Rosberg. Hamilton was furious on the radio and later called it "the most amateur mistake".',
    didYouKnow: 'The blunder cost Hamilton an almost certain victory at Monaco — one of the most coveted wins in Formula 1. He and Mercedes were publicly at odds over the decision for weeks.',
  },
  {
    id: 'germany-2019',
    title: 'Germany 2019',
    subtitle: 'Light rain starts to fall at Hockenheim.',
    grandPrix: 'German Grand Prix',
    year: 2019,
    lap: 'Lap 42 of 64',
    role: 'You are the Ferrari strategist.',
    context: [
      'Vettel started from the pit lane but charged brilliantly to 2nd.',
      'Hamilton leads ahead in a Mercedes.',
      'Light rain has started to fall — the track is turning damp.',
      'Vettel is on old slick tyres losing performance rapidly.',
      'Switching to intermediates now could be decisive.',
    ],
    question: 'Rain is falling, the track is damp, and Vettel is closing on Hamilton. What do you do?',
    options: [
      {
        id: 'pit-inters',
        text: 'Pit Vettel immediately for intermediate tyres',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'Being the first team to react in mixed conditions is almost always decisive. Vettel on fresh inters could have jumped Hamilton and run to a stunning win.',
      },
      {
        id: 'wait-hamilton',
        text: 'Stay out and see what Hamilton does first',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Reactive strategy in rain often leaves you behind. Following Mercedes meant copying rather than seizing the initiative Ferrari had.',
      },
      {
        id: 'push-slicks',
        text: 'Stay on slicks — trust the rain will pass',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Ferrari left Vettel on slicks as the rain worsened. He lost grip, spun, and hit the barriers. Hamilton won. A painful outcome from a seemingly brilliant recovery drive.',
      },
    ],
    actualOutcome: 'Ferrari left Vettel out on old slick tyres as conditions worsened. He spun into the barriers trying to keep up with Hamilton and retired. Hamilton inherited the lead and won, extending his championship advantage by 30 points.',
    didYouKnow: 'Vettel had been on course for a fairytale result, having started from the pit lane after a late setup change. The decision not to react to the rain cost Ferrari what would have been their most emotional win of the season.',
  },
  {
    id: 'turkey-2020',
    title: 'Turkey 2020',
    subtitle: 'Hamilton chases his record seventh title.',
    grandPrix: 'Turkish Grand Prix',
    year: 2020,
    lap: 'Lap 36 of 58',
    role: 'You are the Mercedes strategist.',
    context: [
      'Hamilton is running 2nd on intermediate tyres, over 30 laps old.',
      'The track surface at Istanbul Park is extremely slippery.',
      'His tyres are heavily grained and losing pace rapidly.',
      'A pit stop for fresh intermediates costs roughly 20 seconds.',
      'Several rivals have already pitted and gained positions.',
    ],
    question: 'Hamilton\'s intermediates are well past their prime. Do you pit for fresh tyres?',
    options: [
      {
        id: 'stay',
        text: 'Stay out — trust the tyres to come back as the track rubbers in',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'A gamble, but the right one. As more rubber was laid down on the Istanbul surface, the tyres found grip again. Hamilton charged back through the field.',
      },
      {
        id: 'pit-fresh',
        text: 'Pit for fresh intermediate tyres now',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Fresh tyres would have felt better, but the 20-second time loss on a circuit where overtaking was extremely difficult would likely have been unrecoverable.',
      },
      {
        id: 'pit-slicks',
        text: 'Pit for soft slick tyres — the track looks nearly dry',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Istanbul Park was nowhere near dry enough for slicks. Making this switch would have resulted in an immediate spin or catastrophic tyre graining.',
      },
    ],
    actualOutcome: 'Hamilton stayed out on his worn intermediates and radioed "these tyres are shot" repeatedly. Mercedes kept him out. The tyres slowly came alive, and he climbed from 6th to finish 3rd — clinching his record-equalling 7th World Championship.',
    didYouKnow: 'Hamilton set fastest laps late in the race on tyres that were over 50 laps old. The Istanbul Park surface is unique — rubber doesn\'t stick to it, meaning early laps were treacherous but conditions improved significantly as the race progressed.',
  },
  {
    id: 'baku-2021',
    title: 'Baku 2021',
    subtitle: 'Verstappen leads with five laps remaining.',
    grandPrix: 'Azerbaijan Grand Prix',
    year: 2021,
    lap: 'Lap 46 of 51',
    role: 'You are the Red Bull strategist.',
    context: [
      'Verstappen leads, seemingly in control with five laps to go.',
      'Pirelli has flagged concerns about tyre stress on the 2 km Baku straights.',
      'Both Hamilton and Perez are within reach if anything goes wrong.',
      'A precautionary pit stop would drop Verstappen to 3rd or 4th.',
      'The car\'s tyre data looks stable on the screens.',
    ],
    question: 'Pirelli has flagged tyre stress concerns. Do you bring Verstappen in?',
    options: [
      {
        id: 'pit-safe',
        text: 'Box Verstappen — take guaranteed points and finish safely',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'A championship is won on points across a season. Sacrificing a win for guaranteed P3 or P4 in a year where both title rivals are close is the rational call.',
      },
      {
        id: 'slow-down',
        text: 'Ask Verstappen to reduce speed to lower tyre stress',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Slowing helps manage stress, but doesn\'t eliminate a failing tyre. It keeps the win possible while partially addressing the risk.',
      },
      {
        id: 'stay-win',
        text: 'Stay out — the data is fine and the win is in sight',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Red Bull left Verstappen out. His rear tyre exploded at over 300 km/h on the main straight. He crashed heavily but was uninjured. Zero points.',
      },
    ],
    actualOutcome: 'Red Bull kept Verstappen out. His right-rear tyre suffered a catastrophic blow-out at full speed on the main straight with two laps remaining. He crashed into the barriers and retired with zero points. Sergio Perez won for Red Bull.',
    didYouKnow: 'Verstappen later blamed Pirelli for the failure. In the same race, Hamilton accidentally pressed a brake migration button during the restart and went straight on, missing what would have been a near-certain victory. A memorable afternoon for all the wrong reasons.',
  },
  {
    id: 'hungary-2022',
    title: 'Hungary 2022',
    subtitle: 'Verstappen starts 10th after a lap-1 pile-up.',
    grandPrix: 'Hungarian Grand Prix',
    year: 2022,
    lap: 'Red flag restart',
    role: 'You are the Red Bull strategist.',
    context: [
      'A first-lap collision triggered a red flag — Verstappen is 10th.',
      'The entire field pits for fresh tyres during the red flag.',
      'Red Bull must choose the tyre compound for Verstappen\'s restart.',
      'Hard tyres offer a long first stint. Soft tyres give immediate pace.',
      'Most front-runners are choosing medium or soft tyres.',
    ],
    question: 'Verstappen restarts 10th. What tyre compound do you choose?',
    options: [
      {
        id: 'hard',
        text: 'Fit hard tyres — run a contrarian long first stint',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'Hard tyres give Verstappen a different rhythm from the field. He runs longer, pits later, and undercuts rivals who stop first. It is the precise strategy Red Bull used.',
      },
      {
        id: 'medium',
        text: 'Fit medium tyres — flexible middle-ground strategy',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Mediums are a reasonable choice, but they don\'t give Red Bull the specific strategic offset that the hard tyre provided. The contrarian call was the winning call.',
      },
      {
        id: 'soft',
        text: 'Fit soft tyres — maximum early pace to recover positions quickly',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Softs get you up the field fast, but from 10th at Hungary you still need pit stop strategy to reach the front. Short softs leave you exposed in the second stint.',
      },
    ],
    actualOutcome: 'Red Bull fitted hard tyres and Verstappen executed a perfectly-timed long first stint. He undercut rivals through the pit stops, cycled to the front, and won the race from 10th on the opening lap. Maximum points from a race that looked lost after lap 1.',
    didYouKnow: 'Verstappen\'s Hungary win was widely regarded as one of the best strategic drives of the modern era. Red Bull\'s composure under pressure — choosing an aggressive contrarian strategy when it would have been easy to panic — was a key factor in their 2022 title success.',
  },
  {
    id: 'silverstone-2022',
    title: 'Silverstone 2022',
    subtitle: 'Sainz leads the British Grand Prix.',
    grandPrix: 'British Grand Prix',
    year: 2022,
    lap: 'Lap 38 of 52',
    role: 'You are the Ferrari strategist.',
    context: [
      'Sainz is leading after a brilliant race — this would be his first win.',
      'A Safety Car is deployed following a dramatic crash by Zhou Guanyu.',
      'Sainz is on old medium tyres with 14 laps remaining.',
      'Perez behind has newer tyres and will pit for a free stop.',
      'Pitting now for fresh softs costs the lead but gives tyre advantage.',
    ],
    question: 'Safety Car is out and Sainz is leading. Do you pit?',
    options: [
      {
        id: 'pit-softs',
        text: 'Pit Sainz for soft tyres — race to the win on fresh rubber',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'The Safety Car gives Sainz an almost free stop. Fresh softs for the final 14-lap dash is the aggressive but correct call — especially with Perez also getting fresh tyres.',
      },
      {
        id: 'cover-perez',
        text: 'Only pit if Perez pits first — mirror his strategy',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Reactive strategy can work, but the safety car window means Ferrari should act decisively. Waiting on Perez hands Red Bull the initiative.',
      },
      {
        id: 'stay',
        text: 'Stay out and hold track position',
        score: 25,
        resultType: 'Strategy Disaster',
        explanation: 'Staying out on old mediums with multiple cars behind on fresh tyres is high-risk in the final laps. Sainz would very likely have been overtaken before the flag.',
      },
    ],
    actualOutcome: 'Ferrari pitted Sainz for soft tyres. He rejoined in 3rd but quickly recovered through the pit stop cycle to retake the lead. He held off Perez and Hamilton to win his maiden Formula 1 Grand Prix in his 150th career start — an emotional first win.',
    didYouKnow: 'Sainz became the first driver to win their maiden victory at Silverstone since Alain Prost in 1983. The win came on Ferrari\'s most difficult of weekends — hours before the race, he had been told he would be replaced by Lewis Hamilton for 2025.',
  },
  {
    id: 'france-2022',
    title: 'France 2022',
    subtitle: 'Leclerc leads comfortably — but the data is concerning.',
    grandPrix: 'French Grand Prix',
    year: 2022,
    lap: 'Lap 15 of 53',
    role: 'You are the Ferrari strategist.',
    context: [
      'Leclerc is leading the French Grand Prix with a comfortable gap.',
      'Telemetry shows a power unit anomaly — temperatures rising intermittently.',
      'Engine is currently within limits but the readings are unusual.',
      'A DNF from engine failure would cost 25 points in the championship.',
      'Slowing Leclerc down or pitting him would likely cost the race lead.',
    ],
    question: 'Telemetry flags a power unit anomaly on Leclerc\'s car. What do you do?',
    options: [
      {
        id: 'pit',
        text: 'Pit Leclerc now — protect the championship points',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'A DNF from engine failure in a championship year is catastrophic. Pitting sacrifices a win but 15 points for P4 is vastly better than zero for a retirement.',
      },
      {
        id: 'manage',
        text: 'Ask Leclerc to manage engine temperatures and continue carefully',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Managing temperatures can help, but it doesn\'t fix an underlying fault. It reduces the risk without eliminating it, and Leclerc\'s pace advantage disappears.',
      },
      {
        id: 'push',
        text: 'Let him push — the anomaly is within acceptable thresholds',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Ignoring a rising fault on a high-power circuit is exactly the kind of risk that ends championships. The data was warning Ferrari. They didn\'t act in time.',
      },
    ],
    actualOutcome: 'Ferrari kept Leclerc out and let him continue. The power unit failed catastrophically, sending him into retirement from the lead. Verstappen inherited the win and extended his championship lead by 26 points in a race Leclerc should have won.',
    didYouKnow: 'It was one of three engine failures Leclerc suffered during the 2022 season — at Spain, France, and Azerbaijan. The retirements cost him an estimated 73 championship points against Verstappen and are widely considered the primary reason Ferrari lost the title.',
  },
  {
    id: 'brazil-2021',
    title: 'Brazil 2021',
    subtitle: 'Hamilton\'s front wing is cracked.',
    grandPrix: 'São Paulo Grand Prix',
    year: 2021,
    lap: 'Lap 48 of 71',
    role: 'You are the Mercedes strategist.',
    context: [
      'Hamilton charged from 5th to challenge Verstappen for the lead.',
      'Verstappen forced both cars off at Turn 4 — contact was made.',
      'Hamilton\'s front wing has a visible crack from the collision.',
      'He is still competitive but full downforce is compromised.',
      'Pitting for a new wing costs track position but restores full performance.',
    ],
    question: 'Hamilton\'s front wing is cracked after contact with Verstappen. Do you pit?',
    options: [
      {
        id: 'push',
        text: 'Push on — the wing can survive to the finish',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Hamilton continued with the cracked wing and won. A brave call — but a structural failure at 300 km/h would have been extremely dangerous.',
      },
      {
        id: 'pit',
        text: 'Pit for a new front wing — safety first',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'The safe choice, but Hamilton would drop too far back to recover in the closing laps. The title battle meant every second counted.',
      },
      {
        id: 'retire',
        text: 'Retire the car — the championship gap justifies protecting the driver',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Both drivers were within touching distance on points. Retiring a functional, race-leading car was not a viable option.',
      },
    ],
    actualOutcome: 'Mercedes kept Hamilton out on the cracked front wing. He overtook Verstappen and won the race. The Turn 4 incident sparked enormous controversy, with Verstappen receiving a 5-second post-race penalty. Hamilton closed the championship gap ahead of the final rounds.',
    didYouKnow: 'The on-track battle between Hamilton and Verstappen at Interlagos was described as the most intense of their title fight. The Turn 4 collision was reviewed by stewards three separate times before a penalty was issued.',
  },
  {
    id: 'canada-2011',
    title: 'Canada 2011',
    subtitle: 'Button stages the greatest comeback.',
    grandPrix: 'Canadian Grand Prix',
    year: 2011,
    lap: 'Lap 58 (final phase)',
    role: 'You are the McLaren strategist.',
    context: [
      'Button pitted six times in the first half — a lap-1 puncture destroyed his race.',
      'Multiple Safety Cars and rain phases have scrambled the strategies across the field.',
      'Button is now last but on a completely different strategy to the whole field.',
      'The track is transitioning from wet to dry — tyre timing is critical.',
      'Vettel leads ahead but is on old intermediate tyres losing performance.',
    ],
    question: 'The track is drying fast and Button has fresh intermediates. When do you switch to slicks?',
    options: [
      {
        id: 'slicks-now',
        text: 'Commit to slicks immediately — the track is dry enough',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'Switching to slicks at the right moment gave Button a massive pace advantage. He charged through seven cars in the final stages. The call won him the race.',
      },
      {
        id: 'wait-lap',
        text: 'Wait one more lap to confirm conditions before committing',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Cautious but defensible. However, every lap on intermediates when rivals have slicks costs seconds — and Button\'s task was already enormous from last place.',
      },
      {
        id: 'stay-inters',
        text: 'Stay on intermediates — the track is still damp in places',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Intermediates are safe but the surface was clearly transitioning. Staying on them too long means Button wouldn\'t have the pace to pass the cars ahead.',
      },
    ],
    actualOutcome: 'McLaren switched Button to slick tyres at the right moment. He set fastest lap after fastest lap, charging from last place through the entire field. With just over a lap remaining, he overtook Vettel for the lead and won in one of the greatest drives in F1 history.',
    didYouKnow: 'The 2011 Canadian Grand Prix lasted nearly four hours due to a lengthy red flag period for heavy rain. Button\'s win required six pit stops, perfect strategy calls, and flawless driving over one of the most chaotic races in modern Formula 1.',
  },
  {
    id: 'sakhir-2020',
    title: 'Sakhir 2020',
    subtitle: 'Russell dominates in Hamilton\'s car.',
    grandPrix: 'Sakhir Grand Prix',
    year: 2020,
    lap: 'Lap 63 of 87',
    role: 'You are the Mercedes strategist.',
    context: [
      'George Russell is leading convincingly in Hamilton\'s Mercedes — a fairytale debut.',
      'Russell pitted under the Safety Car, but the wrong tyres were fitted by mistake.',
      'Despite the confusion, he rejoined and is leading again.',
      'His engineer radios to report a suspected slow puncture on the right-rear tyre.',
      'The Sakhir circuit\'s long straights make a blow-out particularly dangerous.',
    ],
    question: 'Russell has a suspected slow puncture while leading. Do you pit?',
    options: [
      {
        id: 'pit-now',
        text: 'Pit immediately — a blow-out at speed would be catastrophic',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'A slow puncture on a high-speed circuit is a safety emergency. Pitting sacrifices the lead but protects Russell and maximises points from a race he was dominating.',
      },
      {
        id: 'slow-down',
        text: 'Ask Russell to reduce speed and nurse it home',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Reducing speed helps, but a compromised tyre under race loads remains dangerous. Mercedes needed to act decisively, not manage a failing component.',
      },
      {
        id: 'one-more-lap',
        text: 'Push for one more lap — the win is almost certain',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Delaying a pit for a confirmed puncture at racing speeds is reckless regardless of the championship situation. No win is worth the risk of a high-speed failure.',
      },
    ],
    actualOutcome: 'Mercedes pitted Russell but suffered a catastrophic double error — the same wrong tyres were fitted again. Russell dropped to 9th. He then suffered a puncture anyway and finished 9th. Sergio Perez came through from the back of the grid to win one of the most dramatic races of the season.',
    didYouKnow: 'Russell had been on course for what would have been the most remarkable debut victory in Formula 1 history. The double pit stop error remains one of the most extraordinary mechanical failures in Mercedes\' recent history.',
  },
  {
    id: 'singapore-2023',
    title: 'Singapore 2023',
    subtitle: 'Red Bull\'s win streak is on the line.',
    grandPrix: 'Singapore Grand Prix',
    year: 2023,
    lap: 'Lap 35 of 62',
    role: 'You are the Ferrari strategist.',
    context: [
      'Sainz is leading the Singapore Grand Prix on hard tyres.',
      'Marina Bay\'s street circuit makes overtaking almost impossible.',
      'Verstappen is behind in the Red Bull, pushing hard.',
      'Sainz\'s hard tyres have roughly 8–10 laps before they start to fall off.',
      'Pitting now locks in a large enough window to manage the finish.',
    ],
    question: 'Sainz leads Singapore with ageing tyres. When do you pit?',
    options: [
      {
        id: 'pit-now',
        text: 'Pit now and run to the end on fresh hards — protect the gap',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'Pitting now maximises the tyre window for the run to the finish. At Singapore, leading into the pit cycle is everything — and Ferrari executed it perfectly.',
      },
      {
        id: 'react-verstappen',
        text: 'Wait for Verstappen to pit first — react to his strategy',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Reacting to Verstappen is reasonable but cedes the strategic initiative to Red Bull. At Singapore, where you can\'t pass on track, proactive strategy is always preferable.',
      },
      {
        id: 'extend',
        text: 'Extend the stint to maximise the tyre age gap',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Extending sounds clever in theory, but Sainz risked falling off the performance cliff and losing the lead in the pit cycle. In Singapore, losing the lead is almost always permanent.',
      },
    ],
    actualOutcome: 'Ferrari managed the strategy impeccably. Sainz pitted at the right moment, maintained the lead, and won the Singapore Grand Prix — snapping Red Bull\'s remarkable run of consecutive victories. One of only two 2023 races not won by Verstappen.',
    didYouKnow: 'Verstappen had won 10 races in a row before Singapore. Sainz\'s victory was only Ferrari\'s second win of 2023 and remains one of the most strategically complete performances of the season.',
  },
  {
    id: 'japan-2022',
    title: 'Japan 2022',
    subtitle: 'The championship is in the balance in the rain.',
    grandPrix: 'Japanese Grand Prix',
    year: 2022,
    lap: 'Lap 28 of 53',
    role: 'You are the Red Bull strategist.',
    context: [
      'Verstappen is leading behind the Safety Car in wet conditions.',
      'The Suzuka circuit is transitioning — patches of dry tarmac are appearing.',
      'Both Verstappen and rivals are on intermediate tyres showing signs of graining.',
      'Switching to slicks too early risks a spin in remaining damp sections.',
      'Waiting too long gives rivals the chance to react and potentially leapfrog.',
    ],
    question: 'The track is drying. Intermediates are beginning to grain. When do you switch Verstappen to slicks?',
    options: [
      {
        id: 'switch-now',
        text: 'Switch to slicks now — be the first team to commit',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'Making the tyre transition call before rivals is a decisive competitive move. Leading the switch avoids the reactive trap and preserves Verstappen\'s race lead.',
      },
      {
        id: 'wait-two-laps',
        text: 'Wait two laps for the track to confirm it is safe for slicks',
        score: 75,
        resultType: 'Smart but Risky',
        explanation: 'Caution is sensible, but two laps gives Ferrari a window to react first. Dropping into the traffic of a rival\'s under-cut is difficult to recover from.',
      },
      {
        id: 'stay-inters',
        text: 'Stay on intermediates — too much uncertainty to commit to slicks',
        score: 25,
        resultType: 'Strategy Disaster',
        explanation: 'With intermediates graining heavily as the track dries, staying on them when rivals are transitioning means falling back rapidly. Indecision here is costly.',
      },
    ],
    actualOutcome: 'Red Bull read the conditions correctly and made the tyre transition at the right moment. Verstappen maintained the lead and won the Japanese Grand Prix, clinching the 2022 Constructors\' Championship. His individual Drivers\' title was confirmed the following morning after points recalculation.',
    didYouKnow: 'The race was declared after just 28 laps due to persistent rain — meaning only half points were awarded. Verstappen\'s emotional celebration was delayed until the morning after, when FIA confirmed the full points calculation following a post-race penalty review.',
  },
  {
    id: 'saudi-arabia-2021',
    title: 'Saudi Arabia 2021',
    subtitle: 'Collision and chaos in the title battle.',
    grandPrix: 'Saudi Arabian Grand Prix',
    year: 2021,
    lap: 'Lap 37 of 50',
    role: 'You are the Mercedes strategist.',
    context: [
      'Hamilton and Verstappen are fighting wheel-to-wheel through multiple safety cars.',
      'Verstappen has been instructed to give back position after going off-track.',
      'Hamilton brakes cautiously, expecting a run-off. Verstappen is surprised and hits him from behind.',
      'Both cars are damaged from the contact.',
      'Hamilton\'s rear bodywork has taken impact — the extent is unclear.',
    ],
    question: 'Hamilton has been hit from behind. His car may be damaged. What do you do?',
    options: [
      {
        id: 'assess',
        text: 'Complete one assessment lap before deciding — gather data first',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'Waiting one lap confirmed the car was driveable. Reacting immediately without data risks an unnecessary pit stop that could cost the race lead and championship points.',
      },
      {
        id: 'pit-check',
        text: 'Pit immediately for a precautionary check',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Pitting sounds cautious but could mean losing position at a street circuit where retaking places is almost impossible. The title was too close to give up track position without data.',
      },
      {
        id: 'retire',
        text: 'Retire the car — preserve the championship lead',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'Both drivers were level on points heading into the final two races. Retiring a functional car was simply not an option.',
      },
    ],
    actualOutcome: 'Hamilton completed an assessment lap, confirmed minimal structural damage, and continued. He finished 2nd. Verstappen received a 10-second post-race penalty for the incident. Going into Abu Dhabi — the final race — both drivers were tied on exactly 369.5 points.',
    didYouKnow: 'The 2021 Saudi Arabian Grand Prix featured two red flags, multiple safety car periods, driver radio complaints from both title contenders, and stewards reviewing incidents multiple times across a single race weekend. It remains one of the most chaotic evenings in modern F1 history.',
  },
  {
    id: 'imola-2021',
    title: 'Imola 2021',
    subtitle: 'A red flag offers Hamilton a lifeline.',
    grandPrix: 'Emilia Romagna Grand Prix',
    year: 2021,
    lap: 'Red flag at lap 32',
    role: 'You are the Mercedes strategist.',
    context: [
      'Hamilton crashed after contact with Russell and suffered front wing damage.',
      'A red flag has been called — the pit lane is open for repairs.',
      'Hamilton\'s car is recovered and can be sent out for the restart.',
      'He will restart from the pit lane — at the very back of the field.',
      'Verstappen is running 3rd and will restart on fresh, fast tyres.',
    ],
    question: 'Hamilton restarts from the pit lane. Which compound do you choose?',
    options: [
      {
        id: 'soft',
        text: 'Fit soft tyres — maximum pace to charge through the field',
        score: 100,
        resultType: 'Perfect Call',
        explanation: 'From the back of the field at Imola, Hamilton needed raw pace more than longevity. Soft tyres gave him the speed to attack immediately after the restart.',
      },
      {
        id: 'medium',
        text: 'Fit medium tyres — balance pace with tyre life',
        score: 50,
        resultType: 'Understandable Mistake',
        explanation: 'Mediums are sensible but from the back of the grid Hamilton needed aggression. Softs provided the outright pace needed to pass cars quickly at a circuit with limited overtaking zones.',
      },
      {
        id: 'hard',
        text: 'Fit hard tyres — run the full distance without another stop',
        score: 0,
        resultType: 'Strategy Disaster',
        explanation: 'A one-stop hard strategy from the pit lane at Imola would leave Hamilton trapped in traffic with no pace to force his way through. Championships demand bold calls.',
      },
    ],
    actualOutcome: 'Mercedes fitted Hamilton with soft tyres. He charged from the back of the field, made multiple overtakes on the restart, and finished 2nd. Verstappen won the race. Hamilton\'s drive limited what could have been a catastrophic zero-point afternoon.',
    didYouKnow: 'The collision between Hamilton and Russell — his own junior driver at the time — created considerable tension within the Mercedes programme. Russell later publicly apologised but the incident underscored the intensity of the 2021 title battle.',
  },
]
