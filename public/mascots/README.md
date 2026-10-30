# ProcrastiNot mascot artwork

All 12 uploaded PNGs are connected. The original filenames are preserved.
The central mapping is `src/data/mascot-assets.ts`:

| Character | Filename suffix | Identifying detail |
| --- | --- | --- |
| Perfectionist | `02_00_26 PM-1.png` | Emerald hair, glasses, pencil and checklist |
| Approval Seeker | `02_00_32 PM-2.png` | Coral hair, star and feedback bubbles |
| Worrier | `02_00_33 PM-3.png` | Powder-blue hair, storm cloud and questions |
| Self-Doubter | `02_00_35 PM-4.png` | Purple hair, low battery and checklist |
| Dreamer | `02_00_45 PM-5.png` | Yellow hair, rocket and light bulb |
| Overwhelmed One | `02_00_46 PM-6.png` | Mint hair, glasses and many notes |
| Overdoer | `02_00_48 PM-7.png` | Red hair, laptop and armfuls of folders |
| Defier | `02_00_54 PM-8.png` | Orange hair, crossed arms and stop sign |
| Crisis-Maker | `02_01_00 PM-9.png` | Aqua hair and alarm clocks |
| Instant-Gratification Chaser | `02_01_01 PM-10.png` | Indigo hair, phone and candy |
| Purpose Drifter | `02_00_39 PM-1.png` | Magenta hair, compass and signpost |
| Shame Spiraler | `02_00_46 PM-2.png` | Chartreuse hair, tears and crumpled paper |

Every filename starts with `ChatGPT Image Oct 29, 2026, `.
To replace an illustration, add the new file and update its mapping. Restart the
development server or rebuild production when adding or renaming files.

The shared Mascot component optimizes images with Next.js, keeps artwork contained,
and softens white edges against pastel surfaces. Matching SVGs remain available
as a fallback if an artwork file cannot load.
