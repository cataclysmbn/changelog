# Bright Nights changelog: 2026-10-26 ~ 2026-11-03

## [Add boss feral FPF commander to the nuclear power plant tunnel](https://github.com/cataclysmbn/Cataclysm-BN/pull/10718)

A melee boss, feral FPF commander, spawns in the cooling tunnel under the nuclear power plant.

It has very high dodge, so it is hard to kill with guns, but high-capacity weapons such as machine guns work. It uses a leap, a dropkick that sends the player flying, and an execution attack that deals big damage only to a grabbed target. It also fires an energy wave that periodically stuns and deals a small amount of damage.

- Mid to late game gear drop
- Microreactor + upgrade drop
- Dangerous when it grabs you

![Feral FPF commander](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/ea99f2ee9bb5d1a57d5db5955b63e2b6d2f9487543f623007da6062767ffa48a.webp)

## [Bandit camp boss changes to a dedicated boss NPC](https://github.com/cataclysmbn/Cataclysm-BN/pull/10734)

In The Old Guard mission 4, a boss with much better gear appears instead of a normal bandit.

He wears a full set of recycled power armor with a military bionic. He uses rifle skill first and carries machine guns such as M1919 Stinger and PKM, or grenade and rocket launchers. He also carries grenades and medical supplies better than a normal bandit.

- Wears recycled power armor
- Uses machine guns and launchers
- Extra chance of advanced weapons when the Arcana, CRT Expansion, or Magiclysm mods are used

![Bandit boss](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/3f75a6b425498e963c7ec0637ae3e1109e859404ae5d20e145dedcf5527f3814.webp)

## [Major balance changes to ballistic vests and plates](https://github.com/cataclysmbn/Cataclysm-BN/pull/10737)

Protection values, spawns, and recipes of ballistic vests and plates change a lot.

Thickness goes from 4 layers to 6 so that a vest with a steel or alloy plate stops 5.56mm as described. Scrap plates count as iron, so with a vest they stop .223 Remington. The light ballistic vest is renamed plate carrier, its ballistic resistance goes from 2 to 6, and it gets a recipe. Metal plate thickness is then reduced to lower bash and cut resistance (steel and superalloy plate 24/24 -> 18/18, hardened steel plate 16/28 -> 12/21).

- Dragon skin vest changes to lamellar ballistic vest and becomes standalone armor
- Ballistic vest spawns are split into civilian and military
- Add aluminum and carbon fiber based stab protection plates
- ESAPI plate volume 5380 ml -> 4 L

## [Tactical helmet is one tier above military helmet](https://github.com/cataclysmbn/Cataclysm-BN/pull/10738)

Tactical helmet and tactical full helmet are clearly sturdier than the army helmet.

The material changes from plastic to hardened steel, so ballistic resistance becomes 50 (army helmet is 40). The army helmet stops up to .40 S&W, and the tactical helmet stops up to .357 Magnum. The survivor helmet is made from an army helmet or steel combat helmet plus Kevlar, and the heavy survivor helmet is made only from the tactical helmet line.

- Tactical helmet weight and encumbrance increase
- Heavy survivor helmet resistance 60

![Helmet comparison](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/a65374ba37f48cde73364de0dc3362907bde97fe63d4227c574e2bb0e49b6578.webp)

## [Disabled vehicles spawn in emergency shelter parking spaces, higher chance of infected basement](https://github.com/cataclysmbn/Cataclysm-BN/pull/10755)

A vehicle spawns in each parking space (3 spaces) of the emergency shelter with 25% chance.

The vehicle is always inoperable, so it is an early to mid game repair goal. The infected basement variant with monsters goes from 1/11 to 1/3 chance, and the bug that made it spawn no monsters at all is fixed. Instead, the monsters are trapped behind a boarded door, and the air filter is set into the wall so it does not break easily.

- Fix bug where the back wall broke when a vehicle spawned in shelter type 2

![Shelter parking lot](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/b8fb454eb9123707317f0136b1bd2cd3890dd76bdeb6412974859d4699af3089.webp)

## [Add food spoilage rate setting](https://github.com/cataclysmbn/Cataclysm-BN/pull/10691)

The ROT_RATE option is added to settings, so you can change how fast food and corpses rot.

At 0x, food stays fresh forever. At 0.05x, food rots 20 times slower. At 100x, food rots in 1 hour.

- 0x = no spoilage
- 0.05x = 20 times slower
- 100x = rots in 1 hour

![Spoilage rate setting](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/ed6095031060ae614148330a03bbef5c847f190e708813c922c83c16e368a3fd.png)

![100x spoilage rate](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/621764336b875007bbba9e1e8547873d8c574b68fe35cf3fdfcf122973a6d69f.webp)

## [Add radioactive zombie evolution line](https://github.com/cataclysmbn/Cataclysm-BN/pull/10785)

The hazmat zombie evolves into a glowing zombie, and then into a radioactive husk.

Both regenerate and give light, and their attacks irradiate you. The radioactive husk is immune to fire, emits toxic gas, and has higher stats and regeneration. If an attack deals damage, it ignores armor and irradiates you. If the damage is 0, armor blocks it. Attacks of the elite zombie scientist, irradiated wanderer, charred nightmare, and evolved mutant experiment also cause radiation.

- Radioactive item and clothing remains drops
- Small nuke drop weight is lowered in a follow-up fix

![Radioactive zombie](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/d823a5ce78725734c3d71d7cbc93a9ef6129829d966e7bc01ab4f4a4b1beaa07.webp)

## [Add feral human evolution path, basement spawn on the first day](https://github.com/cataclysmbn/Cataclysm-BN/pull/10724)

Normal and military feral humans get an evolution path, and ones that hold a pipe, crowbar, or axe spawn in basements from the first day.

When the normal type evolves, it becomes a normal zombie with 40%, a survivor-line zombie with 10%, or a survivor-type monster with 50%. The military type can wield a rifle, machine gun, shotgun, or DMR if it survives, and its accuracy is lower than the original. A type with a chainsaw is also added, but it appears late.

- Remove militia burst fire
- Starting ammo increases: security guard 5 -> 15, survivalist 3 -> 15, militiaman 10 -> 30

## [Add military barracks](https://github.com/cataclysmbn/Cataclysm-BN/pull/10735)

Barracks ported from the DDA 0.I military outpost appear in the world.

Three armed feral soldiers guard it. A rifleman stands next to the vehicle at the front gate, a sniper is on the roof, and a shotgunner is in front of the armory. Also fix the bug where military airfields were not shown on the military operations map.

- Rifleman / sniper / shotgunner placement

## [Add retirement village](https://github.com/cataclysmbn/Cataclysm-BN/pull/10769)

The large retirement village from DDA is ported, with basic items such as tools and unique basement items.

Spawn chance is raised from the original 20 to 35. The EOC computer from the original is left out.

## [Add new profession Marine CSO](https://github.com/cataclysmbn/Cataclysm-BN/pull/10748)

Marine CSO is added as a profession you can use as an alternative to the special forces soldier.

The gear is decent, but the only weapons are an M9 pistol and a knuckle duster. It is also included in scenarios with military professions and in the lab staff scenario.

- Start with M9 + knuckle duster

## [Vary starting ammo type by profession](https://github.com/cataclysmbn/Cataclysm-BN/pull/10754)

Military professions start with FMJ and police professions start with JHP rounds.

Tank crew, saboteur, and Marine CSO start with an M9 and 9mm FMJ. Police professions use .223 and .308, and military professions keep AP. The automatic rifleman starts with tracer rounds instead of normal 5.56mm.

- Bionic sniper .45 FMJ
- Police professions .45 JHP

## [Adjust armor of soldier, SWAT, and skeletal zombies](https://github.com/cataclysmbn/Cataclysm-BN/pull/10780)

Armor of military-line zombies is matched to current armor values, and the skeletal line becomes much sturdier against melee.

skeletal juggernaut 20/45/36 -> 36/45/27, skeletal brute 12/30/24 -> 24/30/18, skeletal master 0/15/24 -> 20/30/20. Kevlar zombie 14/34/53 -> 18/23/53, Kevlar brute 18/45/70 -> 24/30/70, Kevlar hulk 30/56/90 -> 26/49/90. feral FPF commander is 38/53/62 -> 32/46/70

- Juggernaut: strong against melee and bows, weak against bullets
- Skeletal line stab resistance becomes equal to cut resistance

## [Add hallucination-only monster hat man](https://github.com/cataclysmbn/Cataclysm-BN/pull/10792)

The hat man appears only in hallucinations.

It does not move and disappears after a few turns. It has very high dodge, so you cannot hit it with shooting. It can paralyze the player with fear.

## [Add natural omnivore mutation to alpha](https://github.com/cataclysmbn/Cataclysm-BN/pull/10733)

You can get natural omnivore in the late stages of alpha mutation.

It cancels all food allergies except junk food hypersensitivity.

## [Citizen mode: citizens are hostile in the feral player scenario](https://github.com/cataclysmbn/Cataclysm-BN/pull/10721)

When you use citizen mode and the feral player scenario together, citizens are hostile to the player.

Before, citizens stayed friendly, so the scenario had no point. Now they are hostile through a forced trait, and the start season is not summer, so some citizens are still alive. The bolas cooldown of the survivor child is also longer, so being stunned almost all the time is reduced.

## [Add foldable carbon fiber jerrycan](https://github.com/cataclysmbn/Cataclysm-BN/pull/10730)

A foldable vehicle fuel tank made of carbon fiber is added.

The only foldable vehicle tank before was one very small one. You can install it on a vehicle, fill it, and fold and unfold it.

## [Unify shot ammo names on 12x70mm](https://github.com/cataclysmbn/Cataclysm-BN/pull/10784)

Shotgun ammo names start with 12x70mm, and shot casings change to 12x70mm casings.

It is easier to find the shot line in auto pickup, sorting, and search. 20x66mm and .410 are kept separate.

## [A chainsaw works as a logging tool only when it is on](https://github.com/cataclysmbn/Cataclysm-BN/pull/10768)

Cutting trees with an off chainsaw is blocked, and the axe function works only while it is on.

The power use of the electric combat chainsaw drops to the level of the normal type (it was about 12 times higher). The start-up charge of the electric chainsaw drops from 5 to 1, and the capacity of the gasoline chainsaw and combat saw rises from 450 to 500.

## [Adjust vehicle part items and recipes](https://github.com/cataclysmbn/Cataclysm-BN/pull/10766)

The weight and volume of the light wooden wheel drive double, and the material amounts of the light wheel drive recipe change to match the item weight.

Carbon sheet, carbon frame, and carbon plate use 15, 30, and 40 of 3D printing respectively. Aluminum plate crafting needs a hammer quality.

## [Vehicle damage multiplier cap of 4.0](https://github.com/cataclysmbn/Cataclysm-BN/pull/10601)

The vehicle damage multiplier range in world settings is limited to 4.0.

At 4.0 and above, only vehicles with all parts destroyed spawned. After the update, the value in existing worlds returns to 1.0, so check it again.

![Vehicle damage multiplier](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/ca065981c57fb6dafd37810e0dc1111088b466196733b16d47c5838e0ae6b7ae.webp)

## [Add crop top and gold necklace](https://github.com/cataclysmbn/Cataclysm-BN/pull/10771)

Crop top and gold necklace are added, and used in the frat, sorority, and gangster profession outfits.

They also appear in pawn shops, commercial districts, and other places. Also fix the recipe bug where you could not make a t-shirt from rags.

## [Add bionic disassembly recipes](https://github.com/cataclysmbn/Cataclysm-BN/pull/10727)

You can disassemble about 20 kinds of bionics to get materials.

Targets include the flashbang generator, LED tattoo, radiation dosimeter, ventilator, heat absorber, leukocyte breeding system, electromagnetic unit, third eyelid, artificial night generator, sensory dampener, probability thruster, teleporter, underwater propulsion, internal storage, taste modifier, sleep inducer, and fusion blaster arm.

## [Adjust firearm attachment spawn rates](https://github.com/cataclysmbn/Cataclysm-BN/pull/10723)

Common attachments such as slings and pistol lanyards spawn less, and stabilizers spawn more.

The spawn weight of the shell catcher, sling, pistol lanyard, AR-15/MCX retool kit, and others drops to 10 (from 60 for the U shotgun attachment). The stabilizer rises to 20 in the rare group.

## [Fix size range of dog and horse armor](https://github.com/cataclysmbn/Cataclysm-BN/pull/10720)

Horse armor fits sizes 55 to 1000 L, and dog armor fits sizes 1 to 55 L.

Armor for medium quadrupeds can be put on a hauler bot, and also on large dogs.

## [Reduce volume of MK 23 mod 0](https://github.com/cataclysmbn/Cataclysm-BN/pull/10739)

The volume of MK 23 mod 0 drops from 1607 ml to 1 L.

It fits an oversized holster with the suppressor on, and just fits a normal holster without the suppressor.

![MK 23 comparison](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/4dcf12bb60d3853e31f531161cd1ec5cb20e14030bca171f24f17a7d913d7ce7.webp)

## [Learn the drone rotor recipe from books](https://github.com/cataclysmbn/Cataclysm-BN/pull/10751)

You can also learn the drone rotor recipe from Advanced Electrical Engineering, Electronic Circuit Theory, and Amateur Aviator.

## [Add roofs to Tacoma Commune restroom and greenhouse](https://github.com/cataclysmbn/Cataclysm-BN/pull/10746)

The Tacoma Commune restroom and greenhouse get roofs.

![Tacoma Commune](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/75db7661d7ba58e3ed5b7c99dc4ef9d114592ec79dce3b7bcce9421d42543656.webp)

## [Fix position of Tacoma flatbed truck](https://github.com/cataclysmbn/Cataclysm-BN/pull/10777)

Fix the game crashing when the flatbed truck went outside the map border.

## [Fix Old Guard representative giving Free Merchants quests again](https://github.com/cataclysmbn/Cataclysm-BN/pull/10732)

Fix the Old Guard representative giving the solar power and Kimjang day quests again after Necropolis.

## [Fungal walls also count as lab gate walls](https://github.com/cataclysmbn/Cataclysm-BN/pull/10731)

Fix gate levers not working in labs covered by fungus.

## [Fix repeated bionic detector low power message](https://github.com/cataclysmbn/Cataclysm-BN/pull/10764)

When power runs out, the message appears only once and the detector turns off (before, the message kept appearing and it stayed on).

![Detector message](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/b36c333cc0c155fbaf4ce573de655107e26e2d5c2905a8220fd86d13ee04750d.webp)

## [Combat chainsaw and chainsaw glaive can be holstered](https://github.com/cataclysmbn/Cataclysm-BN/pull/10762)

An off combat chainsaw fits in a sword sheath, and an off chainsaw glaive fits in a power armor weapon rack.

## [Fix tactical full helmet tile](https://github.com/cataclysmbn/Cataclysm-BN/pull/10741)

The tactical full helmet sprite is a little smaller and changes to a shape that covers the front of the face.

![Before](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/8bd638e883106e8243b9b06c21cf57e544c50f94cd4e2978e430cb5519b041d8.webp)

![After](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/d45c902f37fe45f6b9fc3da58874a7101f95cdd4e0735512b65fcf784a7f9e72.webp)

## [Add ASCII art to hammer and crowbar](https://github.com/cataclysmbn/Cataclysm-BN/pull/10782)

The item description cards of the hammer and crowbar get ASCII art.

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/8c502f87a4d73b505cfd850674d156b2c952534901c1ac9f0b4c85ba42e9a74f.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/23c5638ea5ce4dec848526aea2874027dc5dd1849ac6e593af98d51220740f76.webp)

## [Add SWAT cloaker taunt](https://github.com/cataclysmbn/Cataclysm-BN/pull/10736)

feral SWAT cloaker can shout "We call this a difficulty tweak!"
