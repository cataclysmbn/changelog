# Bright Nights changelog: 2026-11-02 ~ 2026-11-08

Nov 2

## [Soldier/SWAT zombie armor changes](https://github.com/cataclysmbn/Cataclysm-BN/pull/10780)

Changes armor values to match the armor that the lore says they wear (bash/cut/bullet)

- Kevlar zombie 14/34/53 -> 18/23/53
- Kevlar brute 18/45/70 -> 24/30/70
- Kevlar hulk 30/56/90 -> 26/49/90
- feral black-ops acid/fire resistance 17/16 -> 18/17
- SWAT and FPF commander enemies also change to match their worn armor. SWAT enemies get 2 acid and 1 fire resistance.

## [Skeleton armor changes](https://github.com/cataclysmbn/Cataclysm-BN/pull/10781)

Skeleton enemies are tougher against melee attacks and bows, and are relatively weaker against guns.

The roles are now different: Kevlar enemies resist bullets, and skeleton enemies resist cuts but are relatively weak against bullets (bash/cut/bullet)

- skeletal juggernaut 20/45/36 -> 36/45/27, adds 6 acid resistance
- skeletal brute 12/30/24 -> 24/30/18, adds 3 acid resistance
- skeleton 0/15/12 -> 10/15/10. Skeletal shockers and skeletal dogs also change.
- skeletal master/skeletal lich 0/15/24 -> 20/30/20
- Stab resistance is now the same as cut resistance. This nerfs the basic skeleton, which had very high stab resistance, and buffs the others.

## [New location: retirement community](https://github.com/cataclysmbn/Cataclysm-BN/pull/10769)

A large special location for a retirement village, ported from DDA.

It has basic supplies such as tools, and the basement can contain unusual items. Its spawn chance is higher than in DDA (20 -> 35)

## [The Tacoma Commune vehicle position fix](https://github.com/cataclysmbn/Cataclysm-BN/pull/10777)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@f927f109d9f01758b8dd606b5fd7ce6cf64c33be/2bfb01a764c4a6fdc42c1f75488359cc0aca40c63900082f26bc3114915a9671.webp)

Fixes a crash caused by The Tacoma Commune vehicles that went past the map border.

- Moves the Flatbed Truck inside the ranch map.
- The Bus went past the border and broke when it overlapped the Cube Van. It is now in a safe position, so vehicles no longer stand in a line like a wall.
- The Car Chassis no longer spawns after you progress the Foreman mission.

![Vehicle positions around the repair shop](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@f927f109d9f01758b8dd606b5fd7ce6cf64c33be/a9b2b633492f8514787f65efebee13f9604da8774f925bb5fa5907ac18caba10.webp)

## [Descriptions now show for perks without Enchantments](https://github.com/cataclysmbn/Cataclysm-BN/pull/10772)

Fixes perks without Enchantments showing no description.

Nov 3

## [Adds a radioactive evolution line for hazmat zombies](https://github.com/cataclysmbn/Cataclysm-BN/pull/10785)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@f927f109d9f01758b8dd606b5fd7ce6cf64c33be/d823a5ce78725734c3d71d7cbc93a9ef6129829d966e7bc01ab4f4a4b1beaa07.webp)

Hazmat zombies now evolve into glowing zombies, and then into radioactive husks.

Both regenerate and emit light, and their hits give you radiation. The radiation dose increases with the damage before armor. If an attack goes through your armor, it also ignores radiation protection gear.

- Radioactive husks are immune to fire, release toxic gas, and have higher stats and faster regeneration.
- When killed, they drop hazmat gear scraps and random radioactive items. Mininukes dropped too often, so a follow-up patch lowers their drop chance.
- Attacks from elite zombie scientists, irradiated wanderers, charred nightmares, C.H.U.D.s, and evolved mutants now also give radiation.

## [New hallucination monster: hat man](https://github.com/cataclysmbn/Cataclysm-BN/pull/10792)

Adds a man in a hat. You can see him only when you hallucinate.

He does not move and disappears after some turns, but he has extremely high dodge and guns cannot hit him. He can paralyze the player with fear.

## [Shotgun ammo names now start with 12x70mm](https://github.com/cataclysmbn/Cataclysm-BN/pull/10784)

In English names, all shotgun ammo now starts with 12x70mm, and the shotgun hull is now the 12x70mm hull.

This makes it easier to find the correct ammo with auto-pickup, sorting, and search.

## [ASCII art for hammer and crowbar](https://github.com/cataclysmbn/Cataclysm-BN/pull/10782)

The hammer and crowbar had no picture. Their item info screens now show ASCII art.

Nov 4

## [Ore vein sprite fix](https://github.com/cataclysmbn/Cataclysm-BN/pull/10794)

Fixes galena ore veins and electrumite ore veins showing the wrong sprite because of a typo in the sprite ID. Banded iron veins use the iron ore vein sprite.

Nov 5

## [Digital file system overhaul](https://github.com/cataclysmbn/Cataclysm-BN/pull/10804)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@f927f109d9f01758b8dd606b5fd7ce6cf64c33be/b6fd701e705fc85d24806a91e2d1adf2c85ccd46ca70124ea36f779e8403b163.webp)

Digital files are now real items. They are stored in SD-Memory cards, USB drives, hard drives, and electronic devices.

You can browse files, and copy or delete them between compatible devices. A device can only read a storage medium if it has a matching port.

- Adds digital books, recipes, and maps. Music and photo files also use the new system.
- USB drives replace genome drives. The e-ink tablet PC is removed. Instead, you can scan books to make digital copies.
- Encryption now works the same way on all digital media.
- Adds the new profession Data Hoarder. You start with a laptop computer and some hard drives with random files.
- Follow-up patches add martial arts training videos, pre-scanned book copies, trap/weapon blueprints, home videos, and voice memos.
- When you open a corrupted file, a miniboss appears.
- You can also scan items with text on them, such as newspapers or the Linux t-shirt. Also adds rare NFT files that exist only in digital form.
- Fixes digital recipes on devices not showing in the crafting menu. You can read digital books in the dark without a reading light.

![Digital content screenshot](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@f927f109d9f01758b8dd606b5fd7ce6cf64c33be/59ff7e758f38aab6d79f50ca8a442d9236e31c87ff8d13e3e8b6c93b01b9cdb8.webp)

![Digital content screenshot](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@f927f109d9f01758b8dd606b5fd7ce6cf64c33be/107b234e163d500e0a0a806f83e5222070dd14462072a2a8b144d2da4da3a96d.webp)

## [Adds combat drones + remote control rework](https://github.com/cataclysmbn/Cataclysm-BN/pull/10758)

Adds military kamikaze drones with a bomb bay, and a small basket vehicle part made from carbon sheets.

Drones spawn at military sites, from inactive military robots, from robotics tools, and in other places. Sometimes a remote control spawns with them.

- The remote-controlled vehicle list now shows only vehicles that are actually remote-controlled.
- When you control a vehicle, "Execute one vehicle action" skips vehicle selection and runs immediately. A new menu option opens the vehicle examine screen.
- Fixes "Execute one vehicle action" only showing "No controls there" on vehicles that you do not control.
- When the remote control battery is empty, the remote control turns off and does not disappear. Also fixes cameras that used battery power while off.
- Fixes Hotwire being required for a vehicle that you already control.

## [Fix ridden robots turning hostile after an EMP](https://github.com/cataclysmbn/Cataclysm-BN/pull/10797)

Fixes permanently friendly robots becoming only temporarily friendly after an EMP, and then turning hostile. A robot no longer turns hostile and kills the player while the player is off the robot.

Nov 6

## [Coffee farming](https://github.com/cataclysmbn/Cataclysm-BN/pull/10787)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@f927f109d9f01758b8dd606b5fd7ce6cf64c33be/61178355611babb3079685657ad5f54e67f4b900057f9a1620f51db376488d9c.webp)

You can grow coffee from seeds and drink it.

Plant coffee seeds → harvest coffee cherries → make coffee beans → roast them into roasted coffee beans → grind them into coffee powder, then brew

## [Evacuee scenario starting shelter changes](https://github.com/cataclysmbn/Cataclysm-BN/pull/10811)

In the Evacuee scenario and its variants with world borders, you no longer start in a ruined shelter.

- Zombie-infested basements now spawn only under ruined shelters, and not under intact shelters.
- Ruined shelter basements have looted sinks, but sometimes contain drugs instead.
- The 2 post-apocalyptic scenarios have both shelters.

## [Motel map replaced](https://github.com/cataclysmbn/Cataclysm-BN/pull/10810)

Ports the motel map from DDA 0.I. This replaces the old layout, which had almost none of the items that a motel usually has.

## [Bulging Reservoir mutation now reduces thirst](https://github.com/cataclysmbn/Cataclysm-BN/pull/10814)

Fixes Bulging Reservoir making you thirsty faster, which is the opposite of its description (thirst multiplier 0.75 -> -0.25)

## [Half the strength needed to drag a minifridge](https://github.com/cataclysmbn/Cataclysm-BN/pull/10812)

The minifridge needed 10 strength, the same as the fridge. Now it needs 5, the same as the minifreezer (10 -> 5)

## [Untranslated text can now be translated](https://github.com/cataclysmbn/Cataclysm-BN/pull/10747)

Some text showed only in English, even when the language was set to Korean. This text can now be translated.

- Martial arts buff names and descriptions
- Monster attack messages (miss, blocked by an obstacle, and others)
- Item use messages, such as training messages
- Gene scanner/editor messages and sample names. Also fixes a format error that showed instead of the scanner name.

## [Experimental builds now run on Linux Mint](https://github.com/cataclysmbn/Cataclysm-BN/pull/10808)

Linux builds are now made on Ubuntu 24, so release files run on Linux Mint versions with an older glibc.

Nov 7

## [Lightstrip on/off + recipe restored](https://github.com/cataclysmbn/Cataclysm-BN/pull/10818)

You can turn lightstrips on and off like normal lights, and you can craft them again.

Connect a battery to turn one on, and remove it to turn it off. You learn the recipe automatically, without a book.

- Light recipes now use light bulbs first, so you get light bulbs when you disassemble lights. This makes it easier to get parts for light fixtures that accept only light bulbs.
- The light bulb description now says LED bulb, and its material is now plastic.

## [Mushrooms keep poison/hallucinogen properties when harvested](https://github.com/cataclysmbn/Cataclysm-BN/pull/10813)

Grown mushrooms keep their poison and hallucinogen properties when you pick them by hand or harvest them with a harvester.

- Hallucinogenic mushrooms can now spawn in places where drugs spawn.
- Drug dealer hideouts can contain large amounts of LSD, hallucinogenic dried mushrooms, and GHB in a large container.

## [Food spoilage estimate uses current temperature](https://github.com/cataclysmbn/Cataclysm-BN/pull/10752)

Fixes the spoilage estimate in item info ignoring temperature. The estimate now uses the current temperature at the item's location, such as a fridge or vehicle cargo space.

## [Fix crash when you drop items that turn off in water](https://github.com/cataclysmbn/Cataclysm-BN/pull/10820)

Fixes a crash when you drop an item that turns off in water (WATER_DISABLE) on the ground.

Nov 8

## [Saws that are on make operating noise again](https://github.com/cataclysmbn/Cataclysm-BN/pull/10819)

The chainsaw (on), combat chainsaw (on), chainsaw lajatang (on), circular saw (on), hedge trimmer (on), electric carver (on), and masonry saw (on) now make noise and show messages continuously.

Electric tools are a bit quieter, and large chainsaws are louder. The old start-up messages are back when you turn the saws on.

- Turning on the electric carver (off) no longer uses 5 charges.
- Lowers the power use of the circular saw (on) and electric carver (on) to the level of other electric saws.
- Soundpacks can now play operating sounds.
- Fixes saws that did not turn off, and operating sounds that overlapped without end.

## [New profession: Vault Personnel](https://github.com/cataclysmbn/Cataclysm-BN/pull/10827)

Adds a civilian contractor profession. The Cataclysm started while this person was on the way to the Necropolis.

You start with a cleansuit, a wrist computer, and a hip flask.

- You can select it in the Sheltered, Overrun, Challenge - Trans-Coast Logistics Concourse, and Challenge - Emergency Shutdown scenarios.

## [New outlet mall roof design](https://github.com/cataclysmbn/Cataclysm-BN/pull/10829)

Outlet mall roofs now have rain gutters, drain pipes, and different equipment.
