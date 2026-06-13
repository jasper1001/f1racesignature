export interface DriverEntry {
  id: string
  name: string
  clues: {
    nationality: string
    number: string
    championships: number
    teams: string
    wins: number
    radioQuote: string
    debutYear: number
    podiums: number
  }
  fact: string
}

export const CLUE_DEFS = [
  { key: 'nationality'    as const, label: 'Nationality' },
  { key: 'number'         as const, label: 'Driver Number' },
  { key: 'championships'  as const, label: 'World Championships' },
  { key: 'teams'          as const, label: 'Teams Driven For' },
  { key: 'wins'           as const, label: 'Race Wins' },
  { key: 'radioQuote'     as const, label: 'Famous Team Radio' },
  { key: 'debutYear'      as const, label: 'F1 Debut Year' },
  { key: 'podiums'        as const, label: 'Career Podiums' },
]

export function scorePotential(revealedCount: number): number {
  if (revealedCount === 1) return 100
  if (revealedCount === 2) return 80
  if (revealedCount === 3) return 60
  if (revealedCount === 4) return 40
  return 20
}

export const DRIVERS: DriverEntry[] = [
  // ── MODERN ERA ────────────────────────────────────────────────
  {
    id: 'verstappen',
    name: 'Max Verstappen',
    clues: { nationality: 'Dutch', number: '1 / 33', championships: 4, teams: 'Toro Rosso, Red Bull Racing', wins: 63, radioQuote: '"Ridiculous! Absolutely ridiculous!"', debutYear: 2015, podiums: 112 },
    fact: 'Verstappen debuted at 17 years old — the youngest driver to ever start a Formula 1 race.',
  },
  {
    id: 'hamilton',
    name: 'Lewis Hamilton',
    clues: { nationality: 'British', number: '44', championships: 7, teams: 'McLaren, Mercedes, Ferrari', wins: 104, radioQuote: '"This one\'s for all the kids who dare to dream big."', debutYear: 2007, podiums: 201 },
    fact: 'Hamilton holds the all-time records for race wins (104), pole positions (104), and podiums (201) in Formula 1.',
  },
  {
    id: 'vettel',
    name: 'Sebastian Vettel',
    clues: { nationality: 'German', number: '5', championships: 4, teams: 'BMW Sauber, Toro Rosso, Red Bull, Ferrari, Aston Martin', wins: 53, radioQuote: '"I have no more words. This is the greatest day of my life."', debutYear: 2007, podiums: 122 },
    fact: 'Vettel won four consecutive world championships from 2010 to 2013 — all with Red Bull Racing.',
  },
  {
    id: 'raikkonen',
    name: 'Kimi Räikkönen',
    clues: { nationality: 'Finnish', number: '7', championships: 1, teams: 'Sauber, McLaren, Ferrari, Lotus, Ferrari, Alfa Romeo', wins: 21, radioQuote: '"Leave me alone, I know what I\'m doing."', debutYear: 2001, podiums: 103 },
    fact: 'Räikkönen took a two-year break from F1 to compete in the World Rally Championship, then returned to win the 2007 title.',
  },
  {
    id: 'alonso',
    name: 'Fernando Alonso',
    clues: { nationality: 'Spanish', number: '14', championships: 2, teams: 'Minardi, Renault, McLaren, Ferrari, Alpine, Aston Martin', wins: 32, radioQuote: '"I am ready. I am ready. I am ready."', debutYear: 2001, podiums: 106 },
    fact: 'Alonso was the youngest world champion in history when he won in 2005 at age 24 — a record later broken by Sebastian Vettel.',
  },
  {
    id: 'rosberg',
    name: 'Nico Rosberg',
    clues: { nationality: 'German', number: '6', championships: 1, teams: 'Williams, Mercedes', wins: 23, radioQuote: '"I\'m world champion! I\'m world champion!"', debutYear: 2006, podiums: 57 },
    fact: 'Rosberg announced his retirement just five days after winning the 2016 world championship — at the very peak of his career.',
  },
  {
    id: 'button',
    name: 'Jenson Button',
    clues: { nationality: 'British', number: '22', championships: 1, teams: 'Williams, BAR, Honda, Brawn GP, McLaren', wins: 15, radioQuote: '"This is incredible. This is absolutely incredible!"', debutYear: 2000, podiums: 50 },
    fact: 'Button won the 2009 world championship with Brawn GP — a team that was essentially brand-new and was sold to Mercedes the following year.',
  },
  {
    id: 'leclerc',
    name: 'Charles Leclerc',
    clues: { nationality: 'Monégasque', number: '16', championships: 0, teams: 'Sauber, Ferrari', wins: 8, radioQuote: '"Si si siiii! Grazie ragazzi, grazie mille!"', debutYear: 2018, podiums: 45 },
    fact: 'Leclerc became the first Monégasque driver to win the Monaco Grand Prix in 2024, ending a long wait for a home victory.',
  },
  {
    id: 'norris',
    name: 'Lando Norris',
    clues: { nationality: 'British', number: '4', championships: 1, teams: 'McLaren', wins: 6, radioQuote: '"This means everything to me — everything. Thank you so much!"', debutYear: 2019, podiums: 35 },
    fact: 'Norris won the 2025 F1 World Championship with McLaren, becoming Britain\'s first champion since Lewis Hamilton in 2020.',
  },
  {
    id: 'sainz',
    name: 'Carlos Sainz',
    clues: { nationality: 'Spanish', number: '55', championships: 0, teams: 'Toro Rosso, Renault, McLaren, Ferrari, Williams', wins: 4, radioQuote: '"This is for my family, for my father, for everyone who believed."', debutYear: 2015, podiums: 33 },
    fact: 'His father, Carlos Sainz Sr., is a two-time World Rally Champion — making them one of motorsport\'s most successful family dynasties.',
  },
  {
    id: 'russell',
    name: 'George Russell',
    clues: { nationality: 'British', number: '63', championships: 0, teams: 'Williams, Mercedes', wins: 2, radioQuote: '"Come on! Yes! That\'s P1! Let\'s go!"', debutYear: 2019, podiums: 20 },
    fact: 'Russell qualified inside the top 10 in almost every race during three seasons at Williams — remarkable given the car\'s limited pace.',
  },
  {
    id: 'piastri',
    name: 'Oscar Piastri',
    clues: { nationality: 'Australian', number: '81', championships: 0, teams: 'McLaren', wins: 4, radioQuote: '"Oh wow... I won! I actually won a Grand Prix!"', debutYear: 2023, podiums: 12 },
    fact: 'Before his F1 debut, Piastri won three consecutive junior championships: Formula Renault Eurocup, Formula 3, and Formula 2.',
  },
  {
    id: 'perez',
    name: 'Sergio Pérez',
    clues: { nationality: 'Mexican', number: '11', championships: 0, teams: 'Sauber, Force India, Racing Point, Red Bull Racing', wins: 6, radioQuote: '"Vamos! Vamos! This one is for Mexico!"', debutYear: 2011, podiums: 42 },
    fact: 'Pérez is the most successful Mexican driver in Formula 1 history, with 6 race wins and 42 podium finishes.',
  },
  {
    id: 'bottas',
    name: 'Valtteri Bottas',
    clues: { nationality: 'Finnish', number: '77', championships: 0, teams: 'Williams, Mercedes, Alfa Romeo', wins: 10, radioQuote: '"To whom it may concern — leave me alone, I\'m working."', debutYear: 2013, podiums: 67 },
    fact: 'Bottas spent five seasons as Lewis Hamilton\'s teammate at Mercedes, finishing runner-up in the championship three times.',
  },
  {
    id: 'ricciardo',
    name: 'Daniel Ricciardo',
    clues: { nationality: 'Australian', number: '3', championships: 0, teams: 'HRT, Toro Rosso, Red Bull, Renault, McLaren, AlphaTauri', wins: 8, radioQuote: '"That\'s how you do it, baby! Yeah!"', debutYear: 2011, podiums: 32 },
    fact: 'Ricciardo invented the "shoey" celebration — drinking champagne from his race boot — after winning the 2016 German Grand Prix.',
  },
  {
    id: 'gasly',
    name: 'Pierre Gasly',
    clues: { nationality: 'French', number: '10', championships: 0, teams: 'Toro Rosso, Red Bull, AlphaTauri, Alpine', wins: 1, radioQuote: '"I\'m going to cry. This is incredible. I cannot believe this."', debutYear: 2017, podiums: 4 },
    fact: 'Gasly\'s maiden win at the 2020 Italian Grand Prix came just 13 months after being demoted from Red Bull back to Toro Rosso.',
  },
  {
    id: 'ocon',
    name: 'Esteban Ocon',
    clues: { nationality: 'French', number: '31', championships: 0, teams: 'Manor, Force India, Renault, Alpine, Haas', wins: 1, radioQuote: '"I won a Grand Prix! I won a Formula 1 Grand Prix!"', debutYear: 2016, podiums: 4 },
    fact: 'Ocon spent the entire 2019 season on the sidelines as a reserve driver, then came back to win in Hungary in 2021.',
  },
  {
    id: 'hulkenberg',
    name: 'Nico Hülkenberg',
    clues: { nationality: 'German', number: '27', championships: 0, teams: 'Williams, Force India, Sauber, Renault, Racing Point, Haas', wins: 0, radioQuote: '"We need more pace. Much more pace."', debutYear: 2010, podiums: 0 },
    fact: 'Hülkenberg holds the record for the most Formula 1 race starts (200+) without ever finishing on the podium.',
  },
  {
    id: 'kmagnussen',
    name: 'Kevin Magnussen',
    clues: { nationality: 'Danish', number: '20', championships: 0, teams: 'McLaren, Renault, Haas', wins: 0, radioQuote: '"P2 on my debut! I love this sport!"', debutYear: 2014, podiums: 1 },
    fact: 'Magnussen finished second on his very first F1 start at the 2014 Australian Grand Prix — and it remains his only podium to this day.',
  },
  {
    id: 'grosjean',
    name: 'Romain Grosjean',
    clues: { nationality: 'French / Swiss', number: '8', championships: 0, teams: 'Renault, Lotus, Haas', wins: 0, radioQuote: '"Come on guys, we can still fight for this!"', debutYear: 2009, podiums: 10 },
    fact: 'Grosjean survived a terrifying crash at the 2020 Bahrain Grand Prix when his car split in two and caught fire — he escaped with minor burns.',
  },
  {
    id: 'stroll',
    name: 'Lance Stroll',
    clues: { nationality: 'Canadian', number: '18', championships: 0, teams: 'Williams, Racing Point, Aston Martin', wins: 0, radioQuote: '"P1! This is what we dreamed of. Come on!"', debutYear: 2017, podiums: 3 },
    fact: 'Stroll became the second-youngest driver to stand on an F1 podium when he finished third at the 2017 Azerbaijan Grand Prix, aged 18.',
  },
  {
    id: 'tsunoda',
    name: 'Yuki Tsunoda',
    clues: { nationality: 'Japanese', number: '22', championships: 0, teams: 'AlphaTauri, RB, Red Bull Racing', wins: 0, radioQuote: '"What the hell?! What is this guy doing?!"', debutYear: 2021, podiums: 1 },
    fact: 'Tsunoda is the first Japanese driver to score points in his debut F1 season since Kamui Kobayashi in 2009.',
  },
  {
    id: 'albon',
    name: 'Alexander Albon',
    clues: { nationality: 'Thai / British', number: '23', championships: 0, teams: 'Toro Rosso, Red Bull, Williams', wins: 0, radioQuote: '"We gave everything we had today. Everything."', debutYear: 2019, podiums: 2 },
    fact: 'Albon chose to represent Thailand internationally despite holding both Thai and British citizenship.',
  },
  {
    id: 'mschumacher',
    name: 'Mick Schumacher',
    clues: { nationality: 'German', number: '47', championships: 0, teams: 'Haas', wins: 0, radioQuote: '"Dad, we made it to Formula 1 together!"', debutYear: 2021, podiums: 0 },
    fact: 'Mick won the 2020 Formula 2 championship — the same feeder series his father Michael competed in on his way to F1.',
  },

  // ── CLASSIC ERA ────────────────────────────────────────────────
  {
    id: 'mschumacher-sr',
    name: 'Michael Schumacher',
    clues: { nationality: 'German', number: 'N/A', championships: 7, teams: 'Jordan, Benetton, Ferrari, Mercedes', wins: 91, radioQuote: '"To achieve the impossible dream, it helps to believe it is possible."', debutYear: 1991, podiums: 155 },
    fact: 'Schumacher won five consecutive championships from 2000 to 2004, including a record 13 victories in a single 2004 season.',
  },
  {
    id: 'senna',
    name: 'Ayrton Senna',
    clues: { nationality: 'Brazilian', number: 'N/A', championships: 3, teams: 'Toleman, Lotus, McLaren, Williams', wins: 41, radioQuote: '"There is no longer a fine line between what is real and what is imaginary."', debutYear: 1984, podiums: 80 },
    fact: 'Senna claimed 65 pole positions in 161 races — over 40% of all his starts — cementing his legacy as the greatest qualifier in F1 history.',
  },
  {
    id: 'prost',
    name: 'Alain Prost',
    clues: { nationality: 'French', number: 'N/A', championships: 4, teams: 'McLaren, Renault, Ferrari, Williams', wins: 51, radioQuote: '"You must always believe you can win. Always."', debutYear: 1980, podiums: 106 },
    fact: 'Prost was nicknamed "The Professor" for his calm, calculated approach to racing — a stark contrast to Senna\'s raw, emotional style.',
  },
  {
    id: 'hakkinen',
    name: 'Mika Häkkinen',
    clues: { nationality: 'Finnish', number: 'N/A', championships: 2, teams: 'Lotus, McLaren', wins: 20, radioQuote: '"I want to win. I want to win very, very much."', debutYear: 1991, podiums: 51 },
    fact: 'Häkkinen surprised everyone by taking a sabbatical after 2001 to spend time with his family — many thought he would never return to racing.',
  },
  {
    id: 'coulthard',
    name: 'David Coulthard',
    clues: { nationality: 'British', number: 'N/A', championships: 0, teams: 'Williams, McLaren, Red Bull', wins: 13, radioQuote: '"That is the best I have ever driven in my life. Incredible."', debutYear: 1994, podiums: 62 },
    fact: 'Coulthard survived a plane crash in 2000 that killed both pilots — he walked away unharmed and raced the very next weekend.',
  },
  {
    id: 'barrichello',
    name: 'Rubens Barrichello',
    clues: { nationality: 'Brazilian', number: 'N/A', championships: 0, teams: 'Jordan, Stewart, Ferrari, BAR/Honda, Brawn, Williams', wins: 11, radioQuote: '"I can win this race. I know I can win this race."', debutYear: 1993, podiums: 68 },
    fact: 'Barrichello holds the record for most F1 race starts without a world championship — 326 Grands Prix across 19 seasons.',
  },
  {
    id: 'irvine',
    name: 'Eddie Irvine',
    clues: { nationality: 'Northern Irish', number: 'N/A', championships: 0, teams: 'Jordan, Ferrari, Jaguar', wins: 4, radioQuote: '"Nearly had it. We nearly bloody had it!"', debutYear: 1993, podiums: 26 },
    fact: 'Irvine came within one point of the 1999 world championship after Schumacher broke his leg mid-season — losing narrowly to Häkkinen.',
  },
  {
    id: 'jvilleneuve',
    name: 'Jacques Villeneuve',
    clues: { nationality: 'Canadian', number: 'N/A', championships: 1, teams: 'Williams, BAR, Renault, Sauber', wins: 11, radioQuote: '"I win this race for my father. This one is for Gilles."', debutYear: 1996, podiums: 23 },
    fact: 'Villeneuve became world champion in only his second F1 season — following in the footsteps of his legendary father Gilles.',
  },
  {
    id: 'dhill',
    name: 'Damon Hill',
    clues: { nationality: 'British', number: 'N/A', championships: 1, teams: 'Brabham, Williams, Arrows, Jordan', wins: 22, radioQuote: '"I\'ve done it! I\'ve actually won the world championship!"', debutYear: 1992, podiums: 42 },
    fact: 'Hill and his father Graham are the only father-and-son pair to both become Formula 1 world champions.',
  },
  {
    id: 'frentzen',
    name: 'Heinz-Harald Frentzen',
    clues: { nationality: 'German', number: 'N/A', championships: 0, teams: 'Sauber, Williams, Jordan, Prost, Arrows', wins: 3, radioQuote: '"Everything is under control. The car feels good."', debutYear: 1994, podiums: 18 },
    fact: 'Michael Schumacher\'s management once claimed Frentzen was faster than Schumacher himself — a statement that sparked years of debate.',
  },
  {
    id: 'fisichella',
    name: 'Giancarlo Fisichella',
    clues: { nationality: 'Italian', number: 'N/A', championships: 0, teams: 'Minardi, Jordan, Benetton, Sauber, Renault, Force India, Ferrari', wins: 3, radioQuote: '"My God! I won! I really won the race!"', debutYear: 1996, podiums: 19 },
    fact: 'His 2005 Malaysian GP win was initially announced as Räikkönen\'s due to a scoring error — and was only officially corrected days later.',
  },
  {
    id: 'rschumacher',
    name: 'Ralf Schumacher',
    clues: { nationality: 'German', number: 'N/A', championships: 0, teams: 'Jordan, Williams, Toyota', wins: 6, radioQuote: '"I am pushing as hard as I can. This is my maximum."', debutYear: 1997, podiums: 27 },
    fact: 'Ralf is the only driver to share an F1 podium with his brother on multiple occasions throughout his career.',
  },
  {
    id: 'massa',
    name: 'Felipe Massa',
    clues: { nationality: 'Brazilian', number: 'N/A', championships: 0, teams: 'Sauber, Ferrari, Williams', wins: 11, radioQuote: '"You are a champion, you are a champion! You did it Felipe!"', debutYear: 2002, podiums: 41 },
    fact: 'Massa lost the 2008 world championship by a single point in the final lap of the final race — one of the most dramatic season endings in F1 history.',
  },
  {
    id: 'webber',
    name: 'Mark Webber',
    clues: { nationality: 'Australian', number: 'N/A', championships: 0, teams: 'Minardi, Jaguar, Williams, Red Bull', wins: 9, radioQuote: '"Not bad for a number two driver!"', debutYear: 2002, podiums: 42 },
    fact: 'Webber\'s "not bad for a number two driver" radio message after winning the 2010 British Grand Prix became one of F1\'s most iconic moments.',
  },
  {
    id: 'kubica',
    name: 'Robert Kubica',
    clues: { nationality: 'Polish', number: '88', championships: 0, teams: 'BMW Sauber, Renault, Williams', wins: 1, radioQuote: '"I am back. I am really back in Formula 1."', debutYear: 2006, podiums: 12 },
    fact: 'Kubica survived a rally crash in 2011 that nearly severed his right arm, then made an extraordinary comeback to race in F1 again in 2019.',
  },

  // ── GOLDEN ERA ─────────────────────────────────────────────────
  {
    id: 'mansell',
    name: 'Nigel Mansell',
    clues: { nationality: 'British', number: 'N/A', championships: 1, teams: 'Lotus, Williams, Ferrari, McLaren', wins: 31, radioQuote: '"I have always wanted to be world champion. That has never changed."', debutYear: 1980, podiums: 59 },
    fact: 'Mansell became the first driver to simultaneously hold both the F1 World Championship and IndyCar Series title — in consecutive years.',
  },
  {
    id: 'piquet',
    name: 'Nelson Piquet',
    clues: { nationality: 'Brazilian', number: 'N/A', championships: 3, teams: 'Brabham, Williams, Lotus, Benetton', wins: 23, radioQuote: '"Racing is my entire life. There is nothing else."', debutYear: 1978, podiums: 60 },
    fact: 'Piquet won three world championships with three different constructors — Brabham (twice) and Williams — across two decades.',
  },
  {
    id: 'lauda',
    name: 'Niki Lauda',
    clues: { nationality: 'Austrian', number: 'N/A', championships: 2, teams: 'March, BRM, Ferrari, Brabham, McLaren', wins: 25, radioQuote: '"I am coming back. I am not finished. I will race again."', debutYear: 1971, podiums: 54 },
    fact: 'Lauda returned to racing just 40 days after suffering severe burns in the 1976 German Grand Prix — one of sport\'s greatest comebacks.',
  },
  {
    id: 'hunt',
    name: 'James Hunt',
    clues: { nationality: 'British', number: 'N/A', championships: 1, teams: 'Hesketh, McLaren, Wolf', wins: 10, radioQuote: '"I am not afraid. I was born to race and I will race."', debutYear: 1973, podiums: 23 },
    fact: 'Hunt\'s 1976 rivalry with Lauda — immortalised in the film "Rush" — is widely considered the greatest championship battle in F1 history.',
  },
  {
    id: 'gvilleneuve',
    name: 'Gilles Villeneuve',
    clues: { nationality: 'Canadian', number: 'N/A', championships: 0, teams: 'McLaren, Ferrari', wins: 6, radioQuote: '"If I die, I want to die at full speed."', debutYear: 1977, podiums: 13 },
    fact: 'Despite never winning a world championship, Villeneuve is widely considered one of the most naturally gifted drivers in F1 history.',
  },
  {
    id: 'berger',
    name: 'Gerhard Berger',
    clues: { nationality: 'Austrian', number: 'N/A', championships: 0, teams: 'ATS, Arrows, Ferrari, McLaren, Ferrari, Benetton', wins: 10, radioQuote: '"I love this sport. Every single lap is an adventure."', debutYear: 1984, podiums: 48 },
    fact: 'Berger was F1\'s legendary prankster — most famously replacing Senna\'s Brazilian ID card photo with a topless model image.',
  },
  {
    id: 'patrese',
    name: 'Riccardo Patrese',
    clues: { nationality: 'Italian', number: 'N/A', championships: 0, teams: 'Shadow, Arrows, Brabham, Alfa Romeo, Williams, Benetton', wins: 6, radioQuote: '"Consistency is the only thing that matters in a long career."', debutYear: 1977, podiums: 37 },
    fact: 'Patrese held the record for most F1 race starts (256) for over 20 years — until Rubens Barrichello broke it in 2008.',
  },

  // ── LEGENDS ────────────────────────────────────────────────────
  {
    id: 'fangio',
    name: 'Juan Manuel Fangio',
    clues: { nationality: 'Argentine', number: 'N/A', championships: 5, teams: 'Alfa Romeo, Ferrari, Maserati, Mercedes', wins: 24, radioQuote: '"I always drove as fast as was necessary — no faster."', debutYear: 1950, podiums: 35 },
    fact: 'Fangio won five championships in seven seasons — his all-time win rate of 46.15% remains an unbeaten Formula 1 record.',
  },
  {
    id: 'clark',
    name: 'Jim Clark',
    clues: { nationality: 'Scottish', number: 'N/A', championships: 2, teams: 'Lotus', wins: 25, radioQuote: '"I just want to go as fast as the car will allow."', debutYear: 1960, podiums: 32 },
    fact: 'Clark won the 1963 world championship by claiming 7 of 10 races and setting the fastest lap in every race he finished.',
  },
  {
    id: 'stewart',
    name: 'Jackie Stewart',
    clues: { nationality: 'Scottish', number: 'N/A', championships: 3, teams: 'BRM, Tyrrell', wins: 27, radioQuote: '"Safety is not a dirty word. It should never be."', debutYear: 1965, podiums: 43 },
    fact: 'Stewart was a pioneering safety campaigner in F1 — his tireless advocacy after the deaths of friends directly led to the sport\'s modern safety standards.',
  },
  {
    id: 'fittipaldi',
    name: 'Emerson Fittipaldi',
    clues: { nationality: 'Brazilian', number: 'N/A', championships: 2, teams: 'Lotus, McLaren, Fittipaldi', wins: 14, radioQuote: '"I represent all of Brazil every time I sit in that car."', debutYear: 1970, podiums: 35 },
    fact: 'At 25, Fittipaldi became the youngest world champion in F1 history in 1972 — a record that stood for 33 years until Fernando Alonso.',
  },
  {
    id: 'brabham',
    name: 'Jack Brabham',
    clues: { nationality: 'Australian', number: 'N/A', championships: 3, teams: 'Cooper, Brabham', wins: 14, radioQuote: '"I built the car myself — why shouldn\'t I be the one to drive it?"', debutYear: 1955, podiums: 31 },
    fact: 'Brabham is the only driver in F1 history to win a world championship in a car bearing his own name — the Brabham BT19 in 1966.',
  },
  {
    id: 'graham-hill',
    name: 'Graham Hill',
    clues: { nationality: 'British', number: 'N/A', championships: 2, teams: 'Lotus, BRM, Brabham, Hill', wins: 14, radioQuote: '"I will race until my body tells me it is time to stop."', debutYear: 1958, podiums: 36 },
    fact: 'Hill is the only driver to win the "Triple Crown" of motorsport — the Monaco Grand Prix, Indianapolis 500, and Le Mans 24 Hours.',
  },
  {
    id: 'andretti',
    name: 'Mario Andretti',
    clues: { nationality: 'American / Italian', number: 'N/A', championships: 1, teams: 'Lotus, Ferrari, Alfa Romeo', wins: 12, radioQuote: '"If everything feels under control, you\'re just not going fast enough."', debutYear: 1968, podiums: 19 },
    fact: 'Andretti is one of only two drivers to have won races in Formula 1, IndyCar, NASCAR, and sports car racing — a true all-round legend.',
  },
]
