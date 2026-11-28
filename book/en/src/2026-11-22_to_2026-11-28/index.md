# Bright Nights changelog: 2026-11-22 ~ 2026-11-28

## Nov 22

### [Aim mode stays on after you kill an enemy](https://github.com/cataclysmbn/Cataclysm-BN/pull/10972)

If you shoot and kill an enemy and other enemies are still in range, aim mode stays on.

Before, aim mode ended when recoil went above the aim limit for the tile you just shot. Now the game does not check recoil. It only checks if an enemy is in range.

- Example: You shoot and kill 1 of 2 zombies. The game aims at the other zombie immediately.

### [Faster game loading: tileset images load in advance](https://github.com/cataclysmbn/Cataclysm-BN/pull/10922)

While the game reads game data, a different thread decodes the tileset images at the same time.

- Final loading step: 3.42 s -> 2.36 s (31% shorter)
- Full world loading: 4.91 s -> 3.81 s (22% shorter)

### [Fix: Wrong tile directions in the DDA tileset of the experimental build](https://github.com/cataclysmbn/Cataclysm-BN/pull/10977)

The experimental build used a tileset made after DDA changed how tiles rotate, so some tiles pointed in the wrong direction. Now the build uses the version from before the rotation change.

## Nov 23

### [Add 5 fungal animals](https://github.com/cataclysmbn/Cataclysm-BN/pull/10981)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/11124e3547da80cea30955ad71944f288bb7d543566a3d97264e0f59a1303594.webp)

Adds fungal versions of the cat, coyote, wolf, cougar, and cow.

A character with Mycus mutations can tame all of them. You can ride the fungal cow. If you feed it fruit and then milk it, you get mushroom-flavored milk.

- Tamed fungal animals do not fight wild fungal monsters.
- If a pet of a non-Mycus character gets a fungal infection, it is no longer tame and becomes hostile.
- Example: A human character's dog becomes a fungal dog and attacks its owner.

![Fungal animal sprites](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/18751baaa1c404ad8c60fd03998f0d36da9cca378a5f9c590f06b85eb4e88122.webp)

![Fungal animal sprites 2](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/63ad7456445a61989c8bfd0ef7c5d0d1fd62bfb71e8a5c922d1f865d610f6b16.webp)

![Mycus pets and wild fungal monsters do not fight](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/6a0c73b7ad2707ca662b474e0c9a0f54b8e6333b542650e9ba216d656761e3f9.webp)

### [Nerf the Drug Deal, Dead Survivors, and Military Map extras](https://github.com/cataclysmbn/Cataclysm-BN/pull/10993)

Many players said that these 3 Map extras gave good loot too easily. Now they give less loot and more dangerous spawns.

Now all 3 use the item spawn rate from the world settings. In a world with a lower item spawn rate, they also give fewer items.

- Dead Survivors: Chance for elite survivor loot on corpses 100% -> 30%. The other 70% get normal survivor loot. Adds 2 encounters, such as a group of upgraded zombies and an encounter guarded by mi-go.
- Military: Soldier corpses 2~6 -> 2~4. Zombie and Robots encounters occur more often. The almost safe Portal encounter occurs less often. The zombie encounter adds a feral soldier with a shotgun.
- Drug Deal: Corpses have a lower chance to carry a gun. Most guns are Pistols (SMGs and Shotguns are rare). Corpses also carry less ammo.
- Drug Deal: Fewer corpses and more enemy spawns. Highly evolved zombies spawn. At a low chance, a former SWAT feral human mini-boss also spawns (types that use guns do not spawn).

### [Add farms with large farm fields](https://github.com/cataclysmbn/Cataclysm-BN/pull/10954)

Farms now generate from many connected parts, as in DDA. Large farms with large farm fields can spawn.

Some apple orchard map generation also changed.

- In old saves, 7 removed farm overmap terrains change automatically to similar terrains. Before this fix, the game showed a "Loaded invalid oter_id" error and broke those tiles.
- Wire fence tiles with a gate that are not generated yet change to wire fence without a gate.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/6dcb65c38e186951767709cd4784838e536e7dd095227c1b33366561a061754a.webp)

### [Save loading is about 2 times faster](https://github.com/cataclysmbn/Cataclysm-BN/pull/10924)

![Time from loading a save to showing the map: 4.1 s -> 2.1 s](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/75e6e3b5f38c1563dfb2290548509f48661808120160e474e4a0410436fd97d9.webp)

While the game reads the tileset, a different thread prepares map generation data at the same time.

The game also stops doing several unnecessary tasks while it loads a save.

- The game no longer reads the map near the world origin when it loads a save: save reading 1.23 s -> 0.43 s
- The loading screen does not redraw after each entry. It redraws at most once every 0.1 s: world loading 8.96 s -> 7.06 s
- A different thread loads the next loading screen image in advance.

### [Faster waiting near calm NPCs](https://github.com/cataclysmbn/Cataclysm-BN/pull/10986)

![Waiting 6 hours with 8 NPCs in view: 8.3 s -> 7.2 s](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/577ad84af07ee2dd2c04c9226894f6ab0b78944f0615cab52bc6afe3aecfc8ee.webp)

While you wait, the game checks calm NPCs for danger every 5 turns, not every turn. Up to 1.16 times faster.

But calm NPCs can notice danger some turns later.

### [Scent-blocking walls now block scent correctly](https://github.com/cataclysmbn/Cataclysm-BN/pull/10989)

NO_SCENT walls on the player's level did not block scent, because the game also checked other levels. Now it checks only the player's level. Processing time for each step when you walk is also about 21% shorter.

### [Add survivor's bunker and trans-coast logistics tiles to the UDP tileset overmap](https://github.com/cataclysmbn/Cataclysm-BN/pull/10994)

On the UDP tileset overmap, the survivor's bunker and trans-coast logistics (TCL) showed as ASCII letters. Now they show as graphic tiles.

### [Real flagpole on the fire lookout tower](https://github.com/cataclysmbn/Cataclysm-BN/pull/10992)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/2f32453e7a058127b153031eb46abc4aa8b118a5d473adb8be3775f4037329df.webp)

On the fire lookout tower, the pillar that acted as a flagpole is now a real flagpole.

## Nov 24

### [Fix: Second Sky Island character started in the air and fell](https://github.com/cataclysmbn/Cataclysm-BN/pull/11017)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/37a1c92ac1115af725ecd6f5a382e7b3b163507cc023538551fb44b5c1caba04.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/7485ca68797f883af1cf100b0f88b054d2dcfacd8a71bba56ed2529001950d0c.webp)

If you made a new character from the main menu without closing the game, the character started in the Pocket Dimension of the last game, and also outside its bounds.

Now the game always returns to the main world when you start a new game or load a save. A second Sky Island mod character also starts on the island.

### [Fix: Save problem that deleted overmap exploration data](https://github.com/cataclysmbn/Cataclysm-BN/pull/11007)

![A save with an NPC at -100 J bionic power opens without errors](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/47365e4303c86b67bdc721f38a97df0e16715050bcbf924753b18da194550b7f.webp)

When an autodoc removed a Power Storage CBM, the game removed the power capacity two times, so bionic power became negative. The game could not load an overmap with such an NPC. At the next save, the game overwrote and deleted the explored overmap data.

- The game removes the power capacity only once when you remove the CBM (example: removing a 100 kJ CBM gave -100 J).
- If saved bionic power is negative, the game loads it as 0.
- The game does not save an overmap that failed to load.
- Saves that were already overwritten cannot be recovered. Backups from before the problem open correctly.

### [Fix: Waiting stopped 1 turn late when a monster appeared](https://github.com/cataclysmbn/Cataclysm-BN/pull/11030)

When a monster or NPC appeared while you waited, waiting ended 1 turn late, and the hourly effects for that turn (mutagen, Morale decay, etc.) did not occur. Now waiting stops on time and the effects occur correctly.

### [Add 4 loading screen images](https://github.com/cataclysmbn/Cataclysm-BN/pull/11000)

Adds 4 loading screen images from DDA.

- The experimental tiles version includes the loading screen images.

| Base game | My Sweet Cataclysm mod |
| --- | --- |
| ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/538361f0211bd608d412858cc429dbcf5246520a3122cb688d9489238e38bc9d.webp) | ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/7a28464f86642c41c4ba9edc9a9e0bf431631eef2cba312d1145e7866ee86b9a.webp) |
| Dark Days of the Dead mod | innawoods mod |
| ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/35f3e7decba0e92f7d103d38b9c1b257de7f41bd28517ade087ea0a18d0f3f30.webp) | ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/74aab701ca9c43630894b88ab1a575c12b32d1c185bab1fb98b6e5d0b322d2a3.webp) |

### [Gases and fields you saw stay on the map](https://github.com/cataclysmbn/Cataclysm-BN/pull/11025)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/af18c1f5e6d7f0c06f1e3a4295f80307c501cae546e700e8b41e9bdd6108a9fc.webp)

Fields such as toxic gas stay on the map after they go out of view.

Fields that act as walls, such as foamcrete, are visible from far away. Rooms full of toxic gas also stay on the map.

### [GPS location search is about 9 times faster](https://github.com/cataclysmbn/Cataclysm-BN/pull/11020)

A Search GPS for houses took 90 s. Now it takes 10 s (with the debug GPS).

### [Fix: Tanks for one liquid offered a different liquid](https://github.com/cataclysmbn/Cataclysm-BN/pull/11026)

Fixed a problem where the plumbing network offered a different liquid for a tank that holds a specific liquid. For example, the game does not offer to fill a hydrogen tank with clean water. You can still fill water tanks with clean water.

## Nov 25

### [Forest animal spawn rework](https://github.com/cataclysmbn/Cataclysm-BN/pull/11032)

Based on the DDA forest spawn list, many more animal types spawn in the forest and field.

Also fixed zombie animals that spawned from day 1 and killed all forest animals. New animals start to spawn earlier, and existing animals decrease more slowly over time.

- Animals that DDA removed for realism, such as the wolf and vampire bat, spawn again.
- New spawns include the mutant giant frog, giant locust, many baby birds, and cats and dogs of many breeds.
- Animals from the old list still spawn.

### [Fix: Chance error in the FORCEFIELD and Uncanny Dodge enchantments](https://github.com/cataclysmbn/Cataclysm-BN/pull/11038)

The two enchantments used a DDA-style 0~1 decimal chance, so a character with them dodged almost all bullets. Now they use a 0~100 whole-number chance.

## Nov 26

### [Waiting near fire is up to 10 times faster](https://github.com/cataclysmbn/Cataclysm-BN/pull/11049)

![Waiting 12 hours next to a fireplace that keeps getting fuel: 34.5 s -> 7.5 s](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/f8a4889d27f08704e722a11cbd1730a04b519a0cb9d9628e1d88d0a95063a07e.webp)

When a fire burned nearby, the game processed waiting and crafting one turn at a time, so it was slow. This was worst next to a fireplace that kept getting fuel from a firewood source. Now the game processes in 5-minute steps also when a fire is present.

- Next to a fireplace: 10.06 times faster
- Near a spreading fire: 14.79 times faster
- The game still processes the area with the fire and the adjacent areas where fire can spread every turn, so fire spread does not change.

![Waiting 2 hours near a spreading fire: 4.6 s -> 1.0 s](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/4fa198fc2232febee540ed7751efaae30429e2fcdfe28cee852cdabcb8a389f7.webp)

### [Add a vehicle work speed world option](https://github.com/cataclysmbn/Cataclysm-BN/pull/11022)

Adds the world option Vehicle work speed percentage. It sets vehicle work speed separately, as Construction speed percentage does for construction.

You can set it from 0 to 1000%. The default is 100%. At 0%, work finishes immediately.

- Applies to installing, removing, and repairing vehicle parts, and replacing broken parts.
- The estimated work time in the vehicle menu also uses it.
- Also applies to work in vehicle auto-repair zones and deconstruction zones.

### [Fix: Switching between Albino and other skin tones added trait points](https://github.com/cataclysmbn/Cataclysm-BN/pull/11004)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/ae049d5ec925dca688f7a741ce90fd3f39bb9e21c7a37abcef1077411d36987d.webp)

In character creation, if you selected Albino and then changed to a different skin tone, the game did not remove the points from Albino.

- Before: Each change added +1 trait point and +1 to the disadvantage total.
- After: If you select Albino and then change to Skin tone: rose, points go back 9 -> 8 and disadvantages go back -1/-12 -> 0/-12.
- If the change makes disadvantages more than 12 points, the game shows "Sorry, but you can only take 12 points of disadvantages." and keeps the old skin tone.

### [Fix: Small fire hid the heat of lava](https://github.com/cataclysmbn/Cataclysm-BN/pull/11039)

For each tile, heat radiation now uses the hotter value of the fire intensity and the terrain heat. A small fire on lava does not block the lava heat.

### [Fix: Overmap look of the dumpsite and regional dump](https://github.com/cataclysmbn/Cataclysm-BN/pull/11042)

On the overmap, the dumpsite showed as a city building. Now it looks the same as other dumpsite tiles. The regional dump used only one tile type. Now its 2 corner tiles with a parking lot show as a parking lot.

## Nov 27

### [Fix: Crash when loading a save made during construction](https://github.com/cataclysmbn/Cataclysm-BN/pull/11056)

Fixed a crash from a memory access error when you loaded a save made during construction.

### [Fix: Error when charging battery tools with a UPS](https://github.com/cataclysmbn/Cataclysm-BN/pull/11041)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/b8eedf263e52208d7ba1bc7ac805528d74cd3122f3d67b931843ed9327a3e967.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/3911da5c1e308aa15ba2522a188df26d3ea23f95311e4df16825e4157ad4b596.webp)

When you charged a tool with no ammo type with a UPS, such as a bionic scanner that a mod enables, the game showed a "Tried to set invalid ammo battery" error window. Now the game charges the battery in the tool directly.

### [Tiles you remember from bumping into them while blind show the correct direction](https://github.com/cataclysmbn/Cataclysm-BN/pull/11054)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/c08db10e6ae6fc1db6892649a996b83dda71f2fce26a1d72b918441fa657e3ce.webp)

When a blind character bumps into a wall or furniture, the remembered tile now shows on the map in its real direction.

### [Fix: Loading screen images did not show at 2x/4x display scale](https://github.com/cataclysmbn/Cataclysm-BN/pull/10646)

After the change to SDL3, loading screen images and their credit text did not show at 2x or 4x display scale. Now they show correctly, and the images scale smoothly, so they look less pixelated.

## Nov 28

### [Add 4 starting traits](https://github.com/cataclysmbn/Cataclysm-BN/pull/11061)

You can select Durable, Unbreakable, Hyperalgesia, and Extreme Hyperalgesia in character creation.

### [Fix: Flatpak version crashed when a world started](https://github.com/cataclysmbn/Cataclysm-BN/pull/11064)

The apartment distribution value in the default region settings was 0, so the Flatpak version crashed when a world started. Now the world starts correctly. Also fixed a problem where the apartment value overwrote the shop value when region settings were overwritten.

### [Waiting is up to 1.2 times faster](https://github.com/cataclysmbn/Cataclysm-BN/pull/11057)

![Waiting 12 hours with no fire nearby, left before, right after](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/ab8ad1162f3e41a5f6af0c9ccb23a33b6087766496d5035e09460826ed9b6a00.webp)

If no fire or trap is nearby, the game does not search for fires to refuel or for hidden traps every turn while you wait.

- Waiting 10 hours in a field: 1.24 times faster
- Town: 1.15 times, next to a fireplace: 1.10 times, next to a hay fire: 1.23 times faster
- Traps that are part of terrain, such as a ledge or pit, are now in the trap list, so the game does not miss them when it skips the trap search.

![Waiting 12 hours next to a fireplace, left before, right after](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/150d9398b0662d0552bd68d290139fe84e61cb47d2bd6f96083698ce79c1dd9a.webp)

![Waiting 12 hours next to a hay fire, left before, right after](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/b1fe4badce1461afdd2a353aab627daf1f074d2e1f09c780d5ba1f7a628ec3e8.webp)

---

This changelog was generated automatically by AI (claude-opus-5-5).
