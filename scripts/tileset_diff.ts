/**
 * Draws the sprites that a commit adds or changes in tileset sheets as an onion skin: the old sprite shows faintly
 * under the new one. Neighbouring changed sprites stay together as they are laid out in the sheet, and unchanged
 * sprites between them are dimmed. Sheet areas without changes are left out.
 */

import { mkdir, writeFile } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import $ from "dax"

/** Tileset sheets: compiled tilesets under `gfx/`, and mod or external tilesets in a path with "tileset" in it. */
export const isTilesetSheet = (file: string): boolean =>
  /^gfx\/|tileset/iu.test(file) && /\.png$/iu.test(file)

type Size = { width: number; height: number }
type Sheet = Size & { sprite: Size; before?: Uint32Array; after: Uint32Array }
/** A box of sprites in sheet cells. `changed` holds the cell indices of the sheet that the commit changed. */
type Region = {
  sheet: Sheet
  column: number
  row: number
  columns: number
  rows: number
  changed: Set<number>
}

const spriteSide = 160
const maxWidth = 1200
const maxHeight = 2000
const gap = 8
const dimAlpha = 0.35
/** Pixels fainter than this do not count as a visible sprite. */
const visibleAlpha = 32
/** Channel differences up to this come from re-encoding a sheet, not from a changed sprite. */
const noise = 16
const background = [0x30, 0x30, 0x30]
const regionBackground = [0x48, 0x48, 0x48]

const show = async (repo: string, object: string): Promise<Uint8Array | undefined> => {
  const result = await $`git -C ${repo} show ${object}`.stdout("piped").stderr("null").noThrow()
  return result.code === 0 ? result.stdoutBytes : undefined
}

const sheetSize = async (bytes: Uint8Array): Promise<Size> => {
  const [width = 0, height = 0] = (
    await $`magick identify -format ${"%w %h "} png:-[0]`.stdin(bytes).stderr("null").text()
  )
    .split(" ")
    .map(Number)
  return { width, height }
}

/** RGBA pixels of a PNG padded with transparency to `size`, with every fully transparent pixel set to 0. */
const decode = async (bytes: Uint8Array, size: Size): Promise<Uint32Array> => {
  const raw =
    await $`magick png:-[0] -background none -gravity northwest -extent ${`${size.width}x${size.height}`} -depth 8 rgba:-`
      .stdin(bytes)
      .stderr("null")
      .bytes()
  const pixels = new Uint32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
  for (let index = 0; index < pixels.length; index++) {
    if (raw[index * 4 + 3] === 0) pixels[index] = 0
  }
  return pixels
}

/** Sprite size of `sheet` from a tileset JSON in its folder or a parent folder, or 32x32 when no config names it. */
const spriteSize = async (repo: string, commit: string, sheet: string): Promise<Size> => {
  // A compiled tileset names its sheets from the config folder, a mod tileset from the mod folder above it.
  const names = (config: string, file: string): boolean => {
    for (let folder = dirname(config); ; folder = dirname(folder)) {
      if (join(folder, file) === sheet) return true
      if (folder === ".") return false
    }
  }
  const found = await $`git -C ${repo} grep -l -F ${basename(sheet)} ${commit} -- ${"*.json"}`
    .stdout("piped")
    .noThrow()
  const configs = found.stdout
    .split("\n")
    .map((line) => line.slice(commit.length + 1))
    .filter((config) => config && sheet.startsWith(`${dirname(config)}/`))
  for (const config of configs) {
    try {
      const parsed: unknown = JSON.parse(
        await $`git -C ${repo} show ${`${commit}:${config}`}`.text(),
      )
      for (const tileset of [parsed].flat() as Record<string, any>[]) {
        const entry = tileset["tiles-new"]?.find((sheetEntry: { file?: string }) =>
          names(config, sheetEntry.file ?? ""),
        )
        if (!entry) continue
        const info = tileset["tile_info"]?.[0]
        return {
          width: entry.sprite_width ?? info?.width ?? 32,
          height: entry.sprite_height ?? info?.height ?? 32,
        }
      }
    } catch {
      // A JSON file that names the sheet in some other text is not a tileset config.
    }
  }
  return { width: 32, height: 32 }
}

const readSheet = async (
  repo: string,
  commit: string,
  path: string,
): Promise<Sheet | undefined> => {
  const afterBytes = await show(repo, `${commit}:${path}`)
  if (!afterBytes) return undefined
  const beforeBytes = await show(repo, `${commit}^:${path}`)
  const sizes = await Promise.all(
    [afterBytes, beforeBytes].flatMap((bytes) => (bytes ? [sheetSize(bytes)] : [])),
  )
  const size = {
    width: Math.max(...sizes.map((each) => each.width)),
    height: Math.max(...sizes.map((each) => each.height)),
  }
  return {
    ...size,
    sprite: await spriteSize(repo, commit, path),
    after: await decode(afterBytes, size),
    before: beforeBytes && (await decode(beforeBytes, size)),
  }
}

/** Compares colors premultiplied by alpha: the color of a pixel that is almost transparent does not show. */
const changedPixel = (after: number, before: number): boolean => {
  const channels = (pixel: number) => {
    const alpha = pixel >>> 24
    return [0, 8, 16].map((shift) => (((pixel >>> shift) & 0xff) * alpha) / 255).concat(alpha)
  }
  const [a, b] = [channels(after), channels(before)]
  return a.some((channel, index) => Math.abs(channel - b[index]!) > noise)
}

/**
 * Groups the sprites that differ between the two versions of `sheet` into boxes of neighbouring sprites. A sprite the
 * commit removes, which has no visible pixel left, does not count.
 */
const changedRegions = (sheet: Sheet): Region[] => {
  const columns = Math.floor(sheet.width / sheet.sprite.width)
  const rows = Math.floor(sheet.height / sheet.sprite.height)
  const changed = new Set<number>()
  for (let cell = 0; cell < columns * rows; cell++) {
    const x = (cell % columns) * sheet.sprite.width
    const y = Math.floor(cell / columns) * sheet.sprite.height
    let differs = false
    let visible = false
    for (let row = y; row < y + sheet.sprite.height; row++) {
      for (
        let index = row * sheet.width + x;
        index < row * sheet.width + x + sheet.sprite.width;
        index++
      ) {
        differs ||= changedPixel(sheet.after[index]!, sheet.before?.[index] ?? 0)
        visible ||= sheet.after[index]! >>> 24 >= visibleAlpha
      }
    }
    if (differs && visible) changed.add(cell)
  }

  const regions: Region[] = []
  const seen = new Set<number>()
  for (const start of changed) {
    if (seen.has(start)) continue
    const cells = [start]
    seen.add(start)
    for (const cell of cells) {
      const column = cell % columns
      for (const next of [
        column > 0 && cell - 1,
        column < columns - 1 && cell + 1,
        cell - columns,
        cell + columns,
      ]) {
        if (next !== false && changed.has(next) && !seen.has(next)) {
          seen.add(next)
          cells.push(next)
        }
      }
    }
    const cellColumns = cells.map((cell) => cell % columns)
    const cellRows = cells.map((cell) => Math.floor(cell / columns))
    const column = Math.min(...cellColumns)
    const row = Math.min(...cellRows)
    regions.push({
      sheet,
      column,
      row,
      columns: Math.max(...cellColumns) - column + 1,
      rows: Math.max(...cellRows) - row + 1,
      changed: new Set(cells),
    })
  }
  return regions
}

/** Blends the RGBA `pixel` at `opacity` over the RGB `color`. */
const blend = (color: number[], pixel: number, opacity: number): number[] => {
  const alpha = ((pixel >>> 24) / 255) * opacity
  return color.map((channel, index) =>
    Math.round(((pixel >>> (index * 8)) & 0xff) * alpha + channel * (1 - alpha)),
  )
}

/**
 * Writes one lossless WebP to `outDir` with the sprites that `commit` adds or changes in `sheets`, and returns its
 * path. Returns undefined when no sprite changed.
 */
export const tilesetDiff = async ({
  repo,
  commit,
  sheets,
  outDir,
}: {
  repo: string
  commit: string
  sheets: string[]
  outDir: string
}): Promise<string | undefined> => {
  const regions: Region[] = []
  for (const path of sheets) {
    const sheet = await readSheet(repo, commit, path)
    if (sheet) regions.push(...changedRegions(sheet))
  }

  // Shelf layout: regions go left to right and wrap at maxWidth. Regions past maxHeight are left out.
  const placed: {
    region: Region
    scale: number
    left: number
    top: number
    width: number
    height: number
  }[] = []
  let left = gap
  let top = gap
  let shelf = 0
  for (const region of regions) {
    const { sprite } = region.sheet
    const scale = Math.max(
      1,
      Math.min(
        Math.floor(spriteSide / Math.max(sprite.width, sprite.height)),
        Math.floor((maxWidth - 2 * gap) / (region.columns * sprite.width)),
      ),
    )
    // Regions too large for the image are cut to the whole sprites that fit.
    const fit = (count: number, side: number, limit: number) =>
      Math.max(1, Math.min(count, Math.floor((limit - 2 * gap) / (side * scale)))) * side * scale
    const width = fit(region.columns, sprite.width, maxWidth)
    const height = fit(region.rows, sprite.height, maxHeight)
    if (left > gap && left + width + gap > maxWidth) {
      left = gap
      top += shelf + gap
      shelf = 0
    }
    if (placed.length > 0 && top + height + gap > maxHeight) break
    placed.push({ region, scale, left, top, width, height })
    left += width + gap
    shelf = Math.max(shelf, height)
  }
  if (placed.length === 0) return undefined

  const width = Math.max(...placed.map((each) => each.left + each.width)) + gap
  const height = Math.max(...placed.map((each) => each.top + each.height)) + gap
  const out = new Uint8Array(width * height * 4)
  for (let index = 0; index < width * height; index++) out.set([...background, 255], index * 4)
  for (const { region, scale, left, top, width: regionWidth, height: regionHeight } of placed) {
    const { sheet } = region
    const columns = Math.floor(sheet.width / sheet.sprite.width)
    for (let y = 0; y < regionHeight; y++) {
      for (let x = 0; x < regionWidth; x++) {
        const sheetX = region.column * sheet.sprite.width + Math.floor(x / scale)
        const sheetY = region.row * sheet.sprite.height + Math.floor(y / scale)
        const index = sheetY * sheet.width + sheetX
        const cell =
          Math.floor(sheetY / sheet.sprite.height) * columns +
          Math.floor(sheetX / sheet.sprite.width)
        const color = region.changed.has(cell)
          ? blend(
              blend(regionBackground, sheet.before?.[index] ?? 0, dimAlpha),
              sheet.after[index]!,
              1,
            )
          : blend(regionBackground, sheet.after[index]!, dimAlpha)
        out.set([...color, 255], ((top + y) * width + left + x) * 4)
      }
    }
  }

  await mkdir(outDir, { recursive: true })
  const path = join(outDir, `${commit}-tileset.webp`)
  await writeFile(
    path,
    await $`magick -size ${`${width}x${height}`} -depth 8 rgba:- -define webp:lossless=true webp:-`
      .stdin(out)
      .stderr("null")
      .bytes(),
  )
  return path
}
