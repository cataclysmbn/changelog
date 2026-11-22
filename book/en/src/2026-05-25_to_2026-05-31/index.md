# Bright Nights changelog: 2026-05-25 ~ 2026-05-31

May 25

## Insect wing mutation gives a move bonus only when active

- Move cost is 0.75x while active.
- When off, it has no effect on move speed.

## The M47A1 Techno-Medusa in the Magical Nights mod can load .357 SIG ammo

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/f935c3d64c953c5d29aa7084ef5c2c16bb20682b561373a14e3b6d3360ef65bc.webp)

## The item examine window opens larger

- When you examine an item in the inventory, it uses more of the screen.

## Added mold painkillers and their recipe

- This medicine uses mold materials and has side effects when used.

## Military black box removed from the cockpit of commercial blimps

- You can no longer get the Sarcophagus access code quest item for free from civilian blimps.
- It remains in the Apache, nuclear helicopter, Osprey, and Blackhawk.

## Hallucination effects now show correctly

- Hallucinations from pink tabs, mushrooms, the burning eye gaze, spells, and monster attacks no longer cut off at 30 minutes.
- Short 1-hour hallucinations now show symptoms. Long hallucinations last up to 6 hours.

## Flying vehicle autodrive safety features added

- The game warns you before start if the airplane autodrive speed is dangerous.
- A vehicle that lands on water changes to a floating state, not a flying state, if it can float.

## Fixed a bug with aiming no-recoil weapons

- After you fully aim a recoilless weapon such as a laser weapon and fire, it no longer uses all your remaining moves.
- You can fire several shots in the displayed firing time.

## Activity no longer breaks when a corpse rots away during butchering

- A rotten corpse shows a dedicated message and is handled.

## Fixed a bug that could make aim jump when you target creatures on the floors above and below

## Fixed an item location error when you select a starting profession with food items

- The debug message no longer shows when you select a profession such as Vagabond.

## Fixed several tile display problems

- Fixed large sprites that overlapped each other.
- Fixed trees that were drawn over everything.
- Fixed a broken screen when you see a new area from an upper floor.
- Fixed blimp rope afterimages that stayed in the map memory.

## Added a mod that removes vehicle colors

- When on, vehicles do not use the color palette and show in default red.

## Fixed the vehicle export function

- When you export a bicycle, the y coordinate is no longer entered twice.

May 26

## Fixed the 2nd and 3rd quests of the Old Guard doctor at the refugee center

- The dialogue changed to follow the previous quest.
- Deleted the broken 3rd quest that sent you to a lab that does not exist.
- The new 3rd quest is an ice lab quest. The reward is 2 thermoelectric outfits.

## The 4th quest of the Old Guard doctor changed to a microlab quest

- Find and kill a special zombie foreman in the microlab and recover the secret documents.
- The foreman summons zombie workers with sledgehammers.

## Item names can now have a state label after them

- Labels such as `(friendly)` on a friendly robot and `(radio: R)` on a radio modification part show in the name.
- Mod items can also show a state in the name.

May 27

## State labels after item names can now be translated

- Translation patches can translate labels such as `(wet)` and `(friendly)`.

## Frozen food label shortened from `(very cold)` to `(frozen)`

- Food in a refrigerator or root cellar still shows `(cold)`.

## Faster new area generation and map loading

- You will notice it most in mods that have Lua terrain generation, such as Overgrowth.

## The 5th quest of the Old Guard doctor changed to a TCL quest

- Get the secret lab documents from the chief scientist who barricaded the cargo area.
- Solve it with one of these: persuade, steal, kill, or defeat the boss.
- If you choose to defeat the boss, the chief scientist later becomes a trader who sells items like those at Hub01.
- Also fixed a bug that gave infinite experience from repeated persuasion.

## Fencer profession gets thrusting weapon skill level 2

- This fixes a problem where the profession uses an épée but has no thrusting skill.

## Sea scooter parts can no longer be installed on a vehicle

- The battery and engine parts no longer show in the install menu.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/f2603dacd9dcab689a3859435e01960175730020710c0e689114bbfb44849d1c.webp)

## Normal vehicle colors increased to 16

- The default vehicle colors appear with equal chance.
- The More Vehicle Colors mod picks from more variants for each color.

## 40mm grenades buffed

- 40x46mm and 40x53mm HEDP have a small strong explosion and fragment radius 7.
- High-velocity 40mm grenades have higher fragment penetration.
- Improvised HE grenades have lower damage and radius than normal HE.

## 84mm recoilless rounds buffed

- HE rounds have higher fragment damage and damage to armored targets.
- HEDP rounds have better hit damage and armor performance, and make a small but strong explosion.

May 28

## The Beagle UGV fires long-range anti-tank missiles

- It fires an inaccurate 152mm anti-tank missile at vehicles from far away.

## Higher cooking skill gives a better mood bonus from food you made

- Enjoyment increases by 5% for each cooking level.
- The penalty for unpalatable cooked food is also smaller.

## Fewer warnings for winged blimps

- A blimp whose idle lift is greater than its weight does not show the wing control warning.
- Normal airplanes still warn when needed.

## Fixed a lab entrance generation problem

- The 1st-floor turrets spawn again, and the floor generates with normal tiles.

## 3 new starting professions added

- Rioter: starts with a few Molotov cocktails, improvised armor, and a rioter mask.
- Army Infantry: only for the time anomaly scenario. Starts with an M1 Garand and spare clips.
- Mutant Pack Leader: starts as a wolf mutant with 3 pet wolves.

## Some profession starting gear and age ranges changed

- Military professions get age ranges such as 17~35 and 20~40, and 30~62 for General.
- The default survivor gets a disposable lighter, not matches.
- The tourist wears a Hawaiian shirt, not a T-shirt.

May 29

## Computer skill needed to craft carbon fiber melee weapons greatly increased

- Some recipes need 2x to 3x or more. This makes early crafting hard.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/70d788e7c8af21b3a6eb214837f4bdb2db3f0f2b741a98afb24c9091e8ebc00c.webp)

## The vehicle plutonium generator is always on

- It is no longer in the electronics menu to turn on and off.
- The vehicle info window shows it as a generator. It keeps charging the battery.

## Fewer smuggler ship spawns

- They appear less on lakes and rivers.
- They do not appear at docks and marinas.
- They appear a little more in small bays.

## Chimera mutation line changed

- Extreme metabolism mutations are removed.
- The trait that recovers by eating stays.
- Genetic chaos is removed. Fast healing can be added at random.

## Black Belt profession buffed

- Athletics skill increased from 2 to 5.

## New profession `World's Greatest Athlete` added

- A decathlon champion concept with 10 athletics, 2 throwing, 2 melee, and 2 dodge.

## Added one-use door unlock code for locked lab doors

- You can rarely find it in labs. It opens one locked door.
- The scientist manager zombie always drops it.
- A manager's office spawns rarely and a manager zombie is guaranteed to spawn there.
- Hacking difficulty for the first login at a lab terminal is lowered to 1.
- Armory rooms are less common.

## Stones thrown by feral humans are much less accurate

- Dispersion increased from 150 to 6000.
- They now miss like an ordinary person who throws a stone, not with gun-level accuracy.

## Faster long waiting and activity processing

- Sealed containers stop spoilage.
- Turn processing time is shorter in places with many monsters or items.

## Fixed a crash on macOS when saving to SQLite

- Access to the save file is now safe when several threads handle the V2 map save at the same time.

## Fixed a bitmap font loading problem

- The game no longer crashes when you use a 16x16 bitmap font with 18x18 game tiles.
- Gray glyphs also blend with the color.

## 40x53mm grenade conversion kit added

- Install it on the M79 or M32 MGL to use both 40x46mm and 40x53mm.
- The RM802 grenade launcher can load both ammo types by default.
- Added to the military gun modification list and the advanced crafting recipes.

May 30

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/12d56156d7192becd022c9e14f16799759d5ae99c47f097f0bb64033a9594899.png)

## New pickup menu option added

- Turn on `Use new pickup menu` in the interface options.
- Quantity selection, filter, and display in floor pickup and nearby pickup work like the new inventory menu.
- You can use the wear and wield buttons in all inventory selection menus.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/c1098e4f18cf928074964066f6dd8b3d98a456a0f2a52c3e51ef82bb218be357.png)

## The auto pickup manager supports the Shift+V filter syntax

- A category filter such as `c:workshop tools` adds all tools to an auto pickup rule at once.

## A rescued prototype cyborg can always join as a follower

- If you persuade it and gain its trust, you can select it directly with no extra recruit check.
- Even when it is on alert, you can recruit it with no check by using the choice that persuades it to survive.

## Skipping time in long activities is faster

- Weather and light processing are batched during activities such as crafting and waiting.
- At a base this is usually about 2x faster, and up to about 4x in good conditions.
- Added an option to set the threshold for monster simplification during activities.

May 31

## Fixed a freeze when a vehicle hits a hallucinated creature

- A hallucinated creature such as a chicken disappears on impact.
- Real vehicle speed does not drop and the game does not freeze.

## Big cities generate like cities and small towns generate like towns

- A settlement with size over 8 is a city. It uses more buildings such as apartment towers, office towers, and dense shops.
- Large office towers appear less in small towns.

## Fires restored in the `Really Bad Day` and `Burning Building` start locations

- You start inside a burning building as intended. Fire and smoke generate.

## Fixed the boarded-up house start location

- Interior doors are no longer boarded up and are open.
- Windows stay boarded. Furniture barricades are placed indoors.
- Applies to Missed, Surrounded, Infected, Hunted, Burning Building, Really Bad Day, and The Lost And Damned.

## More materials for the improvised sling recipe

- You can also use down blankets, fur blankets, emergency blankets, comforters, and rag comforters.

## Vehicle seat material changed to steel

- Seat repair uses scrap metal, not aluminum ingots.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/813c0c1a878c077359b9fc230f28dc774ceb195b08ed3c57c18c026e930d5aa0.webp)

## You can choose the title screen

- You can define title screens for each language.
- Mods can also add their own title screens.
- You can also select a random title screen in the options.
