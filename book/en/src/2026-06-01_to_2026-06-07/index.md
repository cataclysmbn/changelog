# Bright Nights changelog: 2026-06-01 ~ 2026-06-07

## Jun 01

### Fixed a crash when loading a game at some start locations

- The change to boarded-up start locations is reverted for now.

### CVD diamond-coated melee weapons now have armor penetration

- Adds penetration equal to 35% of bash/cut/stab damage + 10.
- Bionic weapons add penetration equal to 50% of damage.
- Feral black ops bionic soldiers also make penetrating attacks, matching the monomolecular blade setup.

### First aid kits split into normal and advanced

- The normal first aid kit mainly has bandages, gauze, antiseptic, medical tape, and a pamphlet.
- The advanced first aid kit holds the extra items the old first aid kit had.
- Some old first aid kit spawns are now advanced first aid kits.

### First aid item balance changed

- Saline treats a deep bite wound with 50% chance, not eye drops.
- Hemostatic success rate 90% -> 99%
- Makeshift bandage success rate 90% -> 80%
- Cotton ball effect 75% -> 50%
- Makeshift antiseptic, thyme oil, and cattail jelly now all have 80% success rate.
- Added a recipe to make saline eye drops from saline.

### Military medic starting profession added

- Starts with first-aid-focused skills and rare medical items such as RX12.

### Medical ampoule and stimpack module recipes added

- They need a test tube, saline, medical materials, and nanomaterial.
- Learn them from the confidential chemistry reference book and the Libtech design binder.

### Gambler starting profession added that gets random weapons and survivor gear

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/f11cb7ad8410ff8249fb54ac5a3d487c9e3c66bfae1ad65dab3e23df97b9379b.webp)

### Steel trench armor and helm added to survivor zombies and some bandit gear

- Spawn weight is about 1/3 of the matching scrap armor.
- Fixed a problem where it looked like scrap armor in UDP tiles. It now has its own sprite.

### Reinforced electric motor is now made of steel, not superalloy

- Blocks the exploit to craft it and disassemble it for infinite superalloy.
- Repair and disassembly results also use steel.

### In the new pickup menu, you now pick up the exact amount of charged items such as ammo

- Weight and volume display also match the real amount.
- When you try to pick up over the limit, it asks if you want to wield it, as before.

## Jun 02

### Ski pants and ski jacket recipes added

- Ski pants need tailoring 5 and the ski jacket needs tailoring 6.
- You can make winter pants without fur pelts.

### Windbreaker material changed from plastic to synthetic fabric

- Slightly better cut and bash resistance.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/815c3d8122aac8be6d371359c01fd2685d6b305359bf49f7ae762c3650bd4a00.webp)

### Water boss Kraken added

- A strong water enemy with grab, pull, and ranged abilities.
- It is dangerous in a small boat. Fight it in an armored and armed boat.
- It drops an obsidian eye when killed.
- The obsidian eye gives a clairvoyance effect when wielded, but it also gets the attention of the Nether.

### Sound processing changed greatly

- Sound volume is now calculated in decibels.
- The way sound drops with distance and terrain changed.
- Gunshots, explosions, and monster and NPC sound reactions are now more consistent.

### In the refugee center Old Guard doctor quest, attacking TCL remnants no longer makes the whole Old Guard hostile

- If you solve the quest with violence, only the TCL remnants become hostile.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/2c93628fa2a0588a218023b3050d40612aa13bde06cee31f7aecb5f05bb1ae59.webp)

### Fixed terrain under the lighthouse and sand islands

- Underwater rock pillars appear again.
- The lighthouse basement stairs now line up with the ground-floor stairs.
- Fixed the strange icon for the lighthouse basement on the map.

## Jun 03

### Health penalty of deluxe milkshake and strong antibiotics changed

- Deluxe milkshake -6 -> -3
- Strong antibiotics set to -5

### Windbreaker recipe added

- It needs 9 synthetic fabric pieces.
- You learn it automatically at tailoring 3. With a book, you can craft it at tailoring 2.

### Fixed the magnetic teleport spell dropping you 24 tiles northwest, not at the selected portal location

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/51e41cc0198b20a95f5bdcaa304d6ce6c7545a74cd62ad3dc9e125ad4eed25d6.webp)

### 3 Aftershock crafting tools can be installed and connected to base power

- Cooking rig, KitchenMaster cooking buddy, and MetalMaster forge buddy.
- They can use building power, not batteries.

### Incendiary fragment effect added

- 25mm HEI spreads small fragments. An enemy hit by a fragment can catch fire.
- It no longer spreads flames on the ground as before.
- The Laufos round explosion radius is reduced 5 -> 2, and a radius 5 fragment effect is added.

### Fixed a bug where body temperature dropped fast although you wore warmer clothes

- Body temperature change is now smoother in extreme places such as the ice lab.

## Jun 04

### Fixed tiles that stayed hidden after a vision-blocking field such as thick smoke went away

- When thick smoke weakens to normal smoke or disperses, your vision returns right away.

### Electric engine noise reduced

- Engines that run on batteries are reduced to 10% noise.
- Removed the calculation that made noise too loud because of vehicle speed.
- A vehicle faster than sound makes a 180dB sonic boom.

### 40mm shot and slug range increased

- 40x46mm shot/flechette 10~12 -> 24
- 40x46mm slug 36
- 40x53mm shot/flechette 30, slug 45

### Applied the missing mood effect when you take cough syrup

### You can repair and disassemble brass items

- Bronze repair tools can also repair brass.
- Metal cutting tools can salvage brass.

### Fixed the "bullet hit X" message on tiles you cannot see

- You can no longer learn about combat behind a wall from messages without clairvoyance.

### Fixed thrown items and quiet ranged weapons making an absurdly loud sound because of the speed calculation

### Fixed some loot and starting gear errors

- Fixed shot that did not fit being spawned with a flintlock rifle.
- Fixed plutonium batteries that did not fit being put in some Aftershock gear.
- Fixed the missing starting gem for the Arcana Wild Guardian.

## Jun 05

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/07f2260905ebbe70057142ab78a23da41f544071ec1523e189a2c9114885b8fe.webp)

### Fixed dragon's breath shot that only did damage in a cone and left no flames

- It now leaves a flame trail in the area as intended.

### 40x46mm and 40x53mm grenade casings of the same caliber are now treated as one

- Casings from stun and tear gas grenades can also be reused to reload the same caliber.
- Crafting 40x46mm shot, slug, flechette, and improvised high-explosive grenades is no longer blocked by the casing type.
- Old casings in existing saves are changed to the new casings.

### Some drug effect durations are longer

- Cocaine 5 hours
- Crack 5 hours
- Blunt 2 hours
- Joint/marijuana 1.5 hours

### No repeated escape check or fall damage when you move from one pit to a neighboring pit

- Moving between the same pits is safe.
- Entering a different dangerous pit is still dangerous, as before.

### The repair menu hides items that are already reinforced

- Items that do not fit your body still show if they can be tailored.

### Fixed engines that always backfired at start

- Backfire noise is also reduced so it does not get too loud with engine power.

### Atlatl quiver description now matches its real capacity

- It now says 10, which is what it really holds, not 15.

### You can wear a tactical headset together with power armor

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/e3de666cbb8bf0ba8de0c1a4662cff01ffbf1a5271c967b320f13b2334432af6.webp)

### More filters can be used in auto pickup conditions

- Filter by category, material, quality, note, and the skill a book teaches.
- Example: `c:workshop tools` picks up the workshop tool category.

### Vehicles now block bullets from above and below better

- If you are in a vehicle with a roof, an attack from above hits the vehicle, not the person.
- This reduces the problem of a turret on a lower floor shooting the player inside a helicopter.

### Overlapping common items such as vehicle parts can also be damaged and repaired

- Fixed some vehicle parts that never broke like they were invincible.

### The macOS terminal DMG now includes the required ncurses/formw libraries

- Fewer launch failures on a Mac without Homebrew.

### Fixed several random crashes during city, vehicle, map generation, and sound processing

## Jun 06

### Closing reality tears is now in the base game

- It works without a separate mod.

### Restored Hub 01 underground access and fixed map errors

- You can use the ground elevator after you finish the intercom quest.
- Ulysses Luke and the Robofac NPCs appear again.
- If you have permission, the Hub turrets stay friendly.
- Fixed a blocked staircase, overlapping elevator controls, and a guard weapon spawn problem.
- Also fixed out-of-place metal floors, wrongly placed furniture, and misaligned stairs underground.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/4f4f143b765054e5a4b45c727970f3a05e0d4b09d0bf137224b8d142b78f043e.webp)

### Tool furniture that uses base power added

- Powered hotplate
- Powered makeshift sealer
- Powered gun repair tool
- Also fixed the missing casing forming quality in the gun crafting kit.

### Recipe added to cut a 40x53mm casing down to a 40x46mm casing

### Craftable magazines added

- FAL magazine
- Basic M9 magazine
- .40 S&W Glock 15-round and 22-round magazines
- M1911 magazine
- Gatling drum
- Saiga-12/Saiga-410 10-round magazine

## Jun 07

### High school age range applied to some student concept starting professions

- Rollerblader, Skateboarder, Teen Delinquent, Junior Survivalist, Dodgeball Player, Science Club Member, A/V Club Member

### Killing a child zombie no longer lowers your guilt morale

- This includes variants such as the burned child zombie.

### Fixed the display of inactive turret items

- The description of the inactive grenade launcher turret now says 40x53mm grenade, not .50 caliber.
- The inactive .50 caliber turret now has a tile.

### Added missing tile assignments to some bionic, mutagen, and software items

### Reduced the hovercraft repulsor crafting cost exploit

- Portal generator volume 500 ml -> 2500 ml
- When you make a portal generator with the nanofabricator to craft repulsors, the nanomaterial cost rises from 80 to about 200.

### Fixed the detached pointer error when you fill a vehicle storage space

- Overloading, such as putting 200 blueberries on a seat, is now handled correctly.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/e52127018a7768da09caad20ca7a0a76ae54c96b6d6c5edbdc0a0f48c4464894.png)

### Lighting and some vision processing changed in the graphical version

- Added groundwork in the GPU renderer to improve performance.
- Vehicle camera vision looks more consistent.
- Added support for colored lighting.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/b0e55237923900a65f989c12b58ae18b8eeb3d92d96ff9fd3398d44193a7022e.webp)

### Fixed lab cloning vats pushing items inside them onto the floor

- Mutated body parts in the vat room now go inside the vat, not on the floor.
- You can no longer drag a vat around.

### Fixed artifact save and load errors

- Fixed tangled weight, price, and volume values.
- Fixed an out-of-range error.
