# Powder Keg

A pausable grand strategy game set in Europe from 28 June 1914. Every nation is a
countryball, every nation is playable, and the decisions made in the July Crisis
and after push history off its real course.

Open `index.html` in a browser to play. Nothing needs installing.

## What is in the game now (stage 1)

- A map of Europe in 1914: 233 provinces with real coastlines, terrain, forts,
  industry and sea crossings.
- 23 nations, all playable. Each computer-run nation has three temperament
  dials (ambition, caution, grudge) that weight its choices.
- Divisions as individual units. A division designer (line battalions and
  support companies), recruitment, equipment, reinforcement, entrenchment,
  supply and encirclement, combat width, retreats.
- Industry: military production lines, construction, conscription and economy
  laws, 19 technologies.
- Diplomacy: opinions, alliances, guarantees, cases for war, peace offers,
  capitulation, armistices and three kinds of peace treaty that leave grudges.
- The July Crisis as a chain of telegrams in which Vienna, Berlin, St
  Petersburg, Belgrade and London each get a real choice, followed by the later
  entries into the war, the revolutions, and a deck of random Fate cards.
- The Chronicle, a running newspaper of the timeline.
- A numbered seed. The same seed and the same decisions replay the same history.
- Saves in the browser's local storage, written on the first of each month.

## Not built yet

- National plan trees (the focus-tree equivalent).
- Fleets and aircraft as units. Naval strength is one number per nation that
  decides sea crossings and blockade.
- Army groups, generals and battle plans. Divisions are ordered directly.
- New nations appearing in a peace (Poland, Finland and so on).
- The 1936 start, sound, a tutorial, and the end-of-game comparison with real
  history.
- Balance is provisional. Computer-run wars currently end in one to two years,
  faster than the real war.

## Layout

| Path | What it is |
|---|---|
| `src/data.js` | Nations, units, laws, technologies, starting armies |
| `src/sim.js` | The simulation. No DOM; state is plain JSON |
| `src/events.js` | Telegrams and Fate cards |
| `src/art.js` | Countryball drawing |
| `src/ui.js`, `src/style.css`, `src/shell.html` | Interface |
| `src/mapdata.js` | Generated map. Do not edit by hand |
| `tools/provinces.js` | Province list the map is generated from |
| `tools/build-map.js` | Map generator (needs `world-atlas` and `topojson-client`; see the comment at the top of the file) |
| `build.js` | Bundles `src/` into `index.html` and `dist/powder-keg.html` |
| `test/run.js` | Headless game with invariant checks |
| `concept/` | The original design overview |

## Commands

```
node build.js                      # rebuild index.html and dist/
node test/run.js 1914 1700         # seed, days: all nations computer-run, prints the Chronicle
node test/run.js 5 1500 GER -q     # with a player seat (takes the first option of every telegram)
```

Map data: coastlines from Natural Earth (public domain) via the `world-atlas`
package.
