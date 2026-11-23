# Powder Keg

A pausable grand strategy game of Europe in the age of the world wars. Every
nation is a countryball, and the decisions made in each crisis push history off
its real course.

Open `index.html` in a browser to play. Nothing needs installing.

## What is in the game

- **Two starting years.** 1914, from the Sarajevo murders to 1 January 1920, with
  every nation playable. 1936, to 1 January 1946, in which Germany, Italy and
  the Soviet Union are run by the computer and never offered as seats.
- **Carrying a world forward.** A finished 1914 game can be continued into 1936
  with its own borders, treaties, new states and grudges. Powers that were given
  a hard peace come back wanting their provinces.
- **The map.** 233 provinces with real coastlines, terrain, forts, railways,
  industry and sea crossings.
- **Divisions** as individual units: a division designer, recruitment,
  equipment, reinforcement, entrenchment, supply and encirclement, combat width,
  retreats. Motorised infantry and tanks in the later era.
- **Armies** under named generals, ordered by hand or set to Hold, Advance or
  Assault a front on their own.
- **The country:** national plans (some rule each other out), production lines,
  construction, warships, conscription and economy laws, research.
- **Diplomacy:** opinions, alliances, guarantees, demands for claimed provinces,
  cases for war, peace offers, capitulation, armistices, and three kinds of
  peace treaty. Treaties can create new states (Poland, Finland, Czechoslovakia,
  Hungary, Ukraine, the Baltic states, Ireland), return liberated land to its
  owner, and leave grudges.
- **Telegrams and Fate cards.** Each crisis is a chain of real choices for
  whoever holds that seat, with weights for computer-run nations set by three
  temperament dials. A deck of random Fate cards runs alongside.
- **Aims and the reckoning.** Each nation has aims judged on the end date, when
  the timeline is set beside what really happened.
- **A numbered seed.** The same seed and the same decisions replay the same
  history.
- Saves in the browser's local storage, on the first of each month. Sound, and
  a How to play page.

## Simplifications to know about

- Fleets and aircraft are not units. A fleet is one number per nation that
  decides sea crossings and blockade; aircraft are research bonuses.
- The world outside Europe is off the map. The United States arrives as
  divisions and supplies; the Spanish Civil War is told through telegrams.
- Borders follow straight lines between province centres, within about half a
  degree of the real ones. The 1936 map reuses the 1914 provinces, so there is
  no separate Sudetenland or Danzig.
- Balance is rough. Aims are reachable but some are hard: a computer-run
  Czechoslovakia keeps its republic whole in roughly one game in five.

## Layout

| Path | What it is |
|---|---|
| `src/data.js` | Nations, units, laws, technologies, 1914 armies, aims |
| `src/sim.js` | The simulation. No DOM; state is plain JSON |
| `src/events.js` | 1914 telegrams, standing telegrams, Fate cards |
| `src/plans.js` | National plans |
| `src/scen1936.js` | The 1936 start, its telegrams and plans, and carrying a world forward |
| `src/art.js` | Countryball drawing |
| `src/ui.js`, `src/style.css`, `src/shell.html` | Interface |
| `src/mapdata.js` | Generated map. Do not edit by hand |
| `tools/provinces.js`, `tools/build-map.js` | Province list and map generator |
| `build.js` | Bundles `src/` into `index.html` and `dist/powder-keg.html` |
| `test/` | Test suites, below |
| `concept/` | The original design overview |

## Commands

```
node build.js                      # syntax-check and rebuild index.html and dist/
node test/logic.js 12 1914         # logic suite over 12 games (also: 1936)
node test/ui-smoke.js 220 1914,1936  # browser suite; needs Playwright with Chromium
node test/run.js 1914 1700         # one all-computer game, printing the Chronicle
node test/run.js 5 1500 GER 1914 -q  # with a player seat
```

`test/logic.js` checks the data for dangling references, exercises every player
command, checks that a seed is deterministic and that a loaded save continues
identically, then plays many games and reports any telegram that never fires,
any plan never completed and any aim never achieved. It proves each territorial
aim reachable, plays each nation from its own seat, and carries finished worlds
into 1936.

`test/ui-smoke.js` opens every panel, then clicks at random for a few hundred
steps per seat with time running, reaches the end screen, saves, quits and
reloads.

Map data: coastlines from Natural Earth (public domain) via the `world-atlas`
package.
