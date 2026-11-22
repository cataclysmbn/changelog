# Bright Nights changelog: 2026-06-08 ~ 2026-06-14

Jun 08

## Fix memory growing to tens of GB when the graphics renderer is `gpu` and a large tileset loads

- Tilesets with about 10,000 tiles, such as UndeadPeople, now load with no missing tiles.

## Fix the Linux console build failing to start where no display server exists, such as SSH or Termux

- If you set the DISPLAY, WAYLAND, or SDL video driver yourself, the game keeps your setting.

## Buff the handheld laser cannon

- Damage 10 -> 30, armor penetration 4 -> 5, and a 3-round burst is added.
- Volume goes from 1.5 L to 4 L, and UPS use goes from 25 to 60.
- Laser turrets also fire 3-round bursts, but they now need aim time and charge for 3 turns after firing.
- You can disassemble a recovered laser cannon.

## Fix a typo that showed wrong location names for balloon wing, jet, and wing vehicle parts in the install menu

Jun 09

## Fix queued input being dropped when turns pass slowly because of pain or leg injuries

- Input still carries over as before, even with both legs broken and 200 pain.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/d049a2b0850bf69d64d5c760c831b703281baa5d54958214ec0efb1358b17810.webp)

## Fix a spray can painting the background color with the foreground color

- The lab painter also shows the currently selected color on the tile.

## Fix time passing when you only change the target speed of a vehicle with cruise control on

## Add citizen types and tiles to the Civilians mod

- Adds children, police, ordinary people, melee, bow, crossbow, pistol, and guard survivors, and elite variants.
- Some citizens can smash corpses, and they turn into stronger citizens over time.

## Fix door, window, furniture, and terrain interaction sounds being too quiet

- Sound values for breaking windows, removing glass shards, smashing furniture, and similar actions are set again on a dB basis.

Jun 10

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/7dfae9481a5931487632021889c05c332eff71c7a6367043ff69a4c8ddb2f7f2.webp)

## Add a washing activity for showers and bathtubs

- Use building plumbing water or vehicle tank water. Warm water needs the power grid or a vehicle battery.
- Wash with a safe cleaner such as soap. A bloody shower or bathtub can be wiped clean with no cleaner.
- RVs and camper vans get a vehicle shower, and with a towel you dry off after washing.
- Add a vehicle shower recipe.

## Faster first tileset load

- Tiles are now uploaded in one batch at startup, so large tilesets load faster.
- Add a Texture Streaming Auto/Enable/Disable option to graphics settings.
- Auto is on for the `gpu` renderer and off for other renderers. You can turn it off if some Android devices have problems.

## Tileset tint and painted color display now apply to more tiles

- Also fix tile effects that add color handling transparency wrongly.

## Preserve freshness when cooking with ingredients from vehicle cargo, refrigerators, and freezers

- Fix ingredients taken from cans or sealed containers, vehicle fridge and freezer parts, and map refrigerators and freezers being counted as rotten at room temperature.

## Adjust a bullet vibrator left on during sleep so it does not add too much fatigue

- The fatigue gain interval goes from 1 minute to 2 minutes.

## Adjust hearing protection values and descriptions

- Earplugs and headsets are set to 40 NRR so that one of them is enough to avoid ringing ears from pistol fire.
- For large-caliber guns, you must wear two layers, such as earplugs and a headset.
- Ordinary headgear is 20 NRR. It only reduces noise while you sleep and does not protect against gunfire.

Jun 11

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/9da129f3ae155d01a4c1654cb066497236aa9ad7a839b4f3d13f84e107c7133a.webp)

## Fix tiles with colored light becoming darker

- Colored light now adds a tint, so light looks brighter in both day and night.

## Fix the wrong in-progress craft being finished when several in-progress crafts of the same recipe exist

- Example: with the same soup in your inventory and on the floor, continuing the floor one finished it with the ingredients of the other one.

## Fix an error at startup, or a freeze of about 29 seconds before the menu, caused by a saved Texture Streaming setting

- The old numeric format of the setting is also read.

## Include the SDL files needed by the Linux and Mac downloads

- This reduces cases where the game did not run because SDL was not installed separately.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/7a6400f506f77fedc0e87e04d85f58c7341e7eab9458ab1ac99694be137c8eb5.webp)

## Fix new characters wrongly starting as refugees in mods that limit start scenarios, such as Sky Island

- The first allowed start location is now selected automatically even if you skip the scenario tab, and random generation does not pick a banned scenario.

## Fix "no item can do this action" showing when you press a shortcut in the `%` item action menu

- Shortcuts inside the menu, such as `f` for starting a fire and sewing, now run the real item action at once.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/26fb94e5b2ffe80e3c51ac98c7b036c285747880b1033098c83a510e43a53cd3.webp)

## Sidebar compass width now fits the panel

- Fix the compass sticking out of the compact panel and text overlapping in the default label panel.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/ebe4d2f4f2488e15061867284995ea904df1105e7f39ee4ff11a04020f4c169e.webp)

## Add pets and bond levels

- Feeding, training, and playing raise the bond, and there is a cooldown after each rise.
- At bond 10, the pet treats you like family, training gets easier, and its combat morale rises more easily.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/fccb67566feb0cca0e8eb8aa255e4575ed1a6ee3191858c7850ff020fced98d2.webp)

## Ambulance lights change from red and blue to red and white

- Add a white light item, vehicle part, and tile. It applies only to the ambulance.

## Fix GPU lighting not starting on the Mac Metal renderer

## Fix monsters spawned by a Lua mod evolving suddenly as soon as they return after leaving the reality bubble

Jun 12

## Balance anti-tank weapons and explosions

- Anti-tank weapons now deal more direct and penetrating damage than blast damage, so they work better against vehicle armor.
- Explosions are smaller but stronger, and 84mm HE blast damage is raised slightly to match HEDP.
- Grenade damage now depends on throw accuracy: more accurate throws give more effect.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/12a965fc3ca8436b5033380aac037da2a2337a56d3ad5c10736e7aa2f17f84bd.png)

## Add the minirose CBM

- A mininuke self-destruct device placed inside the body. You can activate it, or an active mininuke appears on the spot when the wearer dies.
- Add a secret recipe and the CBM item and bionic.

## Add a small 1 L version of the resealable plastic bag

- Most medicine, food, and junk items that went in the old 6 L bag now use the small bag.
- The big bag stays for items that do not fit in 1 L, such as irradiated fruit and vegetables, and its spawn rate is lower.
- Small bag spawns, disassembly, and drug smuggling stashes also change to match.

## Remove duplicate bathtub assembly recipes from the construction menu

- Only the bathtub assembly recipe that matches the materials from smashing it remains.

## Rescue boat hulls work as buoyancy parts again

- Boats that floated by hull alone, such as the log boat in MST Extra, float on water again.

## Add Hellfire missiles

- The AGM-114L Longbow is an anti-tank missile with a HEAT blast for Hellfire, so it also heavily damages tanks.
- The R9X "Ninja" Hellfire has no blast and deals high damage to a single target with blades.
- Add launchers, vehicle parts, and tiles. Attack helicopters carry Hellfire racks instead of TOW, and ammo spawns at military helipads.

## Fix radiation positions shifting into a single line after saving and loading in a radioactive area

## Environments that cannot use GPU lighting now calculate lighting on the CPU

- On old or faulty GPUs, lighting is calculated on the CPU path instead of showing nothing on screen.
- The CPU path also handles rotating vehicle lights, but colored light is still fully supported only on the GPU.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/ce6c4242d6cc92ed4a2d4909d25a31336ae48ed74bf41cd135f7e5e74433b3df.webp)

## Add the new trait "Carry Permit"

- At the start, one common pistol arrives in a matching holster, and two reloads of ammo or magazines come in a leg pouch or ammo pouch.
- You cannot pick it together with lab patient, experiment subject, Migo, prison, and time anomaly scenarios, underage professions, or brawler and gun-fear traits.

Jun 13

## Remove "Closable Reality Tears" from the default mod list

- Closing reality tears is already a default feature, so the duplicate mod no longer shows on the world creation screen.

## Fix wrong monster group evolution defaults that made monsters evolve too much

## Fix ingredients being treated as rotten right away when cooking next to a vehicle kitchen or faucet

- Stop the faucet from wrongly adding ingredients such as meat as "zero-count ingredients that existed since day one of the Cataclysm".
- Cooking with fresh or frozen ingredients in vehicle cargo no longer shows `(rotten)` from 0%, and the result no longer vanishes right after it finishes.

## Change some enemy properties to match their look

- Cybernetics researchers, elite scientist zombies, and armored bio-ops can be sensed by electroreception.
- An EMP can stop the CBM-style recovery of black ops and armored bio-ops.
- Feral black ops now have target priority, and black ops commanders return fire.
- A kraken regains morale after regenerating and returns to fight.

## Adjust gun and ammo sounds and hearing protection calculations

- Suppressors, supersonic rounds, flashbangs, and NPC sound perception are now calculated with the new dB values.
- Reduce cases where earplug and headset effects stacked too much, and where gunshots sounded too quiet.

Jun 14

## Fix the tile under your feet being visible through solid floor when you look at the lower level

- Both CPU lighting and SDL_GPU lighting now treat the floor you stand on as a vision blocker.

## Separate rock-throwing zombies from the Lethal Zombies mod

- With only Lethal Zombies on, rock throwing is now removed. Turn on the Rocky Zombies mod too to get the old 14 rock-throwing attacks back.
- Existing Lethal Zombies saves also do not throw rocks unless you add Rocky Zombies yourself.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/72c6972aa02bf7c36ee2e97708ce17ef8a87636294215058d07069a405d70207.webp)

## Show clothes worn by a mannequin on the tile

- Add a new mannequin tile. Clothes and armor are drawn over the mannequin.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/9092807c46da80a0ac7801fd7951d14e5c40f9051e4f371f3ad292009f64050c.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/1970b41b7751315fb2f4cefbe6f2d1bfd37a2e0e6d7f666b8e78f726f5cc7676.webp)

## Redraw the tactical helmet and tactical full helmet tiles

- The normal helmet has an EXFIL look. The full helmet has a mandible guard and a face shield.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/d2de8dbbdfecc91b13a99756e519960ce9cbe6283a04659d7397a3e7c5a5c92c.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7a87dd98733a433d2822b7b8fcb2730a2073462a/0b9c3c37bec9bd55dfa88fbeffc5888f5aeb566ba4f9c1b42966c36c77e7089b.webp)

## Redraw the night vision goggles and infrared goggles tiles

- When off, the goggles show pushed up on the head, not only with dark lenses.

## Fix several vision and position bugs

- In Artificial Night, GPU lighting now follows the local light setting correctly.
- Fix peeking through a curtain or door hole looking in the opposite direction or at a wrong position.
- After a direct position change such as probability thruster or phase shift, the screen and map state now update at once.
- Fix vision keeping stale information when gas or smoke spreads across a zone boundary.
- With a time multiplier active, the body state is processed to match one tick of time.

## Shelter rooftop access doors no longer lock

- In the default start, this stops the player or NPCs getting trapped in the rooftop access room, and you can use rooftop equipment right away.

## A pen can now be used as a writing tool

- You can write on terrain like a survival marker, with 100 uses by default.
- A pen is added to the starting items of some professions, such as researcher, nursing assistant, engineer, student, library nerd, lawyer, and politician.
