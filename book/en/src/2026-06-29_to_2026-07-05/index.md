# Bright Nights changelog: 2026-06-29 ~ 2026-07-05

Jun 29

## Lower pistol FMJ penetration and some damage.

- Base damage is set to 25 for 9mm FMJ and 30 for .45 ACP FMJ.

- .44 paper cartridge damage 33 -> 30. Fix the .38 Special hollow point description showing as FMJ.

- Slug damage is also set again to match 00 buckshot.

## Body armor values change a lot.

- The Kevlar vest now stops 9x19mm FMJ, but encumbrance goes 5 -> 10.

- Dragonskin and steel/superalloy MBR vests are raised to stop 5.56x45mm, and ceramic/hard steel MBR vests to stop 7.62x51mm.

- Power armor and RM13 ballistic values also rise to match the ammo.

- Zombies that wear this gear get matching ballistic values.

## The Kevlar vest can also use the size-adjust mod.

- The old XL Kevlar vest no longer spawns.

## Survivor suit recipes no longer consume a whole Kevlar vest or SWAT armor.

- Most now use Kevlar plates.

## Fix a handmade revolver that could spawn loaded with .357 ammo while it had a caliber conversion kit.

- Like other handmade guns, it no longer has starting ammo.

## Fix the combat medic starting choice overlapping with the combat engineer.

- A flamethrower trooper type starting choice is also added to some military scenarios.

## Effects are recalculated when you take off or drop an item with equipment effects.

- Fix cases where the game could crash after a transforming item or equipment effect processing.

Jun 30

## Fix rain sound effects playing only once and stopping.

- Rain sound now repeats continuously.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/308b664c71a533f98199ebfc0edea2644d93bd03d55e955a5bb3f65b23bffed4.webp)

## Suburban housing areas now form on the edge of cities.

- Large apartments or downtown blocks next to a forest are less common.

- Apartments appear more in the city center.

## Acid zombie evolution splits into civilian and military branches.

- Civilian acid zombies end at the acid mortar zombie or spawner zombie.

- Military zombies go through the acid sniper or support zombie to the acid juggernaut.

## Raise Rivtech and late-game ammo and shotgun penetration to match the new armor values.

- 8x40, 5x50, 20x66, and .277 ammo now deal damage even against ceramic plate armor.

- Rivtech flechette and slug deal damage against 5.56-class armor.

- Normal 00 buckshot deals some damage to Kevlar vests, and normal flechette deals some damage to empty MBR vests.

## Lower the skill damage multiplier of bashing weapons.

- Unarmed is unchanged.

- Bashing weapons go from 70% at skill 0 to 110% at skill 10.

## Fix a map regeneration error popup in a certain TCL lab corridor.

## Skeleton evolution gets more varied and skeleton hulks increase later.

- A basic skeleton has a 30% chance to become a skeleton shocker.

- A skeleton brute evolves into a skeleton hulk with 65% chance and a skeleton master with 35% chance.

- The skeleton brute evolution time goes from 12 days to 24 days.

## Add a new Kevlar zombie, and rename the old Kevlar zombie to Kevlar brute.

- The new Kevlar zombie is similar to the soldier zombie, but its ballistic protection is about 75% of Dragonskin.

- It is an intermediate step before a full 5.56 ballistic brute appears.

## You can order a follower NPC to sleep.

- When the NPC is tired, a sleep order shows in the talk menu.

- The NPC sleeps on the floor, or on a nearby bench if it has a blanket or pillow.

## Armor damage calculation changes.

- Even if damage does not reach the body, a big impact can scratch the armor.

- In return, weak penetrating attacks damage armor less than before.

- STURDY gear gets better damage avoidance.

Jul 01

## Subsonic ammo gets quieter when used with a suppressor.

- With a suppressor, subsonic ammo reduces noise by an extra 15.

- The subsonic ammo description now says it pairs well with suppressors.

- The suppressor description also explains the effect more clearly.

## You find traps again while moving.

- Fix traps not being found because the search around you ran only while waiting.

## Fix oatmeal calories and price.

- Calories rise to match 300 kcal per 100 g.

- The price that showed 50 g of oats at $75 is lowered.

## Fix the cursor jumping to the wrong food after use in the eat and drink menu.

- Example: after drinking maple syrup, the cursor moved to orange soda.

## Add the military drone operator starting profession.

- It is a 6-point profession. You start with an M4 with a masterkey shotgun, 34 rounds of 00 buckshot, and several inactive manhacks.

- The autodoc specialist gets computers 4, the medical resident trait, and a scalpel.

## Carbon fiber crafting and disassembly results are more natural.

- Carbon fiber guns and melee weapons now count as items that also contain steel for blades and barrels.

- Fix materials multiplying when you disassemble carbon fiber sheets.

- Carbon fiber upper receiver weight 80 g -> 240 g, carbon fiber cargo carrier 10 kg -> 9 kg.

- A carbon fiber airfoil with wiring can be disassembled.

## Fix the huge body adaptation mutations in Aftershock being locked like job-only mutations.

- After you gain a huge mutation, such as from bear serum, you can gain follow-up adaptation mutations.

## The contaminated meat drying tray now gives dried contaminated meat, not dried fish.

- This blocks the trick of turning contaminated meat into edible fish.

Jul 02

## Block climbing into empty air above fences and doors and taking fall damage.

- You can no longer reach the air right above a fence with '<' or a stepladder.

## The zombie technician's magnet pull gets weaker.

- It no longer pulls through vehicles.

- The farther away you are, the weaker the pull.

## Lab generation increases again.

- At least 1 lab now appears per overmap.

- The share of ant labs is lower.

- Normal lab basement level 4 connects again to the hidden train network.

- Ice labs and the lab escape start location use an icon on the overmap that makes the stairs position easy to see.

## Fix the Hub 01 light recovery mission failing with an error because it could not find a location.

- The search radius for the collapsed tower is much larger.

- If there are several, the closest one is chosen.

## Vehicle condition display now shows perfect separately when there is no damage at all.

- Treat like new as a state with light damage of 0 to 5%.

## Storage encumbrance is now calculated as filling rigid storage first.

- If fixed-encumbrance storage such as a box-type backpack has room left, duffel bags and handbags add less extra encumbrance.

- When the bag is full, the maximum encumbrance is the same as before.

## A reinforced plastic window with a curtain now has the same break difficulty as a window without a curtain.

## Fix a freeze and memory explosion related to EMP bombs.

- The game froze when you set off an EMP next to a searchlight turret at the military outpost.

- Also block cases where the game could crash or kill credit could break during the following explosion processing.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/afca0c84a0f2e7359dcaad9dde4f9f14cc12ac1c6b55766f5ff85d23a3b62255.webp)

## Add a debug setting to use the old armor damage calculation.

- If the new damage calculation is too heavy, you can switch back to the old way.

Jul 03

## The military jacket becomes the army blouse and goes in the normal clothing layer.

- It overlaps less with outerwear such as the winter military uniform or body armor vest.

- Military starting professions get an undershirt instead of a T-shirt.

- The military winter jacket starting profession also gets an army blouse.

## The cable charging CBM now draws only the power it needs.

- Before, even with one 5 J/turn CBM running, the Mk2 cable charger drew 10 kJ every turn and could waste most of it.

- Now it uses only what is needed, from 1 kJ steps up to its maximum output.

- When you have several UPS units, power is drawn from the UPS you actually plugged in.

## In ranged aiming, you can again manually aim at another Z level with '>'/'<'.

Jul 04

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/42e000ce918984a8f2be5fdbaf6ab73feab1dc93fbad600d98f54ef4be5e4907.webp)

## Add the prone stance.

- While prone, you can fire mounted guns such as BMG and ATGM, and bipod guns, from the ground.

- Movement is slower than crouching, but quieter.

- It gives an advantage in aim speed and accuracy.

- You become prone when you fall or sleep, and return to the previous stance when the state ends.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/6b3eae01ae9550ec63d9df46ca844c4847872ca3f35785e414ee5faab89a81a0.webp)

## Friendly robots mark enemy positions.

- Friendly eyebots and similar robots put a mark on enemies.

- You can see the mark with drone camera gear or the infolink CBM.

- The power armor helmet, control laptop, wrist control computer, RM13, upgraded scout visor, and others have this feature.

- The police eyebot's call for help works only once.

## Fix benches and tables being flipped by hitting them, then hit again and restored.

- Benches, metal benches, picnic tables, and normal and coffee tables can be flipped the first time.

- A flipped item no longer flips back repeatedly when you keep hitting it.

## Adjust MP5SD spawns and the built-in suppressor performance.

- The MP5SD now spawns correctly where a normal MP5 spawned instead of it.

- The MP5SD built-in suppressor lowers normal 9mm FMJ/JHP to subsonic, but not +P ammo.

- The RM11B built-in suppressor does not lower bullet speed.

- RM11B noise reduction also drops slightly, but it is still top class.

## Fix the zoom levels of the normal map and the overmap getting mixed up in the tileset.

- When you open the overmap, it shows at the saved overmap zoom.

- When you close it, it returns to the normal screen zoom.

## Hard work such as digging, mining, and logging now uses fatigue and stamina correctly and raises the athletics skill.

- This includes digging a ditch, pickaxing, jackhammering, chopping trees, cutting logs, filling a pit, hand cranking, and exercise equipment training.

## Buff the ballistic mask.

- Ballistic protection goes 20 -> 36, matching the description that it stops up to 9mm.

- The survivor mask recipe no longer requires a ballistic mask.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/9bb2a4dc9d1dd237f440c9064adebcc9bf6c7bb42598c15b77ebb85cba67086a.webp)

## Your own noise no longer interrupts your own work.

- Fix chopping trees and cutting logs showing the "Loud noise heard. Stop?" prompt for your own sound.

- Warnings made by others, such as zombie footsteps behind a wall, still show.

Jul 05

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/70ee4f3c97bfcb48a4da010cc072a2678afaea702ed50a2a56387d3ad8032e60.webp)

## Fix WebP start and loading pictures not showing in the Android experimental build.

- The start screen picture now shows correctly.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/7e1ea5f7104b59db6ac1263d385649fc8372350ab975eeb0b0be4cd38bd12d50.webp)

## Add island cities inside big lakes, cut off from outer roads.

- Roads and buildings are laid out like a normal city.

- The island shape is set to fit the city size.

- A docking pier is attached for access, and big islands can also get ground special locations such as an airport.

## Add an animal breeding and growth speed multiplier to world options.

- At 0, it applies automatically to match the season length.

- If you enter a number, breeding cycles and baby growth time lengthen or shorten by that percent.

- Evolution of non-animal monsters is unchanged.

## A vehicle shock absorber can be installed in the same tile as an armor plate.

- The armor plate blocks direct damage to that tile.

- The shock absorber reduces collision shock from other tiles, so you can install both together.
