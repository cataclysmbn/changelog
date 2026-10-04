import { join, resolve } from "@std/path"
import * as v from "@valibot/valibot"

export type UploadAsset = { files: string[] }

export const collectUploadAssets = async (
  directories: string[],
): Promise<UploadAsset[]> => {
  const byHash = new Map<string, UploadAsset>()
  for (const directory of new Set(directories.map((dir) => resolve(dir)))) {
    const text = await Deno.readTextFile(join(directory, "changelog.txt"))
    const names = new Set(
      [...text.matchAll(/^pr-\d+-\d+\.(?:png|jpe?g|gif|webp)\r?$/gim)]
        .map((match) => match[0].trim()),
    )
    for (const name of names) {
      const file = join(directory, name)
      if (
        await Deno.realPath(file) !== join(await Deno.realPath(directory), name)
      ) {
        throw new Error(`외부 경로를 가리키는 이미지: ${file}`)
      }
      const stat = await Deno.stat(file)
      if (!stat.isFile || stat.size > 20_000_000) {
        throw new Error(`이미지 형식 또는 20MB 제한 위반: ${file}`)
      }
      const bytes = await Deno.readFile(file)
      const signature = new TextDecoder("latin1").decode(bytes.slice(0, 12))
      const valid = name.toLowerCase().endsWith(".png")
        ? bytes.slice(0, 8).join() === "137,80,78,71,13,10,26,10"
        : /\.jpe?g$/i.test(name)
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : /\.gif$/i.test(name)
        ? /^GIF8[79]a/.test(signature)
        : signature.startsWith("RIFF") && signature.slice(8) === "WEBP"
      if (!valid || bytes.length > 20_000_000) {
        throw new Error(`이미지 형식 또는 20MB 제한 위반: ${file}`)
      }
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))
        .join(",")
      const asset = byHash.get(hash) ?? { files: [] }
      asset.files.push(file)
      byHash.set(hash, asset)
    }
  }
  return [...byHash.values()]
}

const imageSchema = v.strictObject({
  files: v.array(v.string()),
  src: v.pipe(
    v.string(),
    v.url(),
    v.regex(/^https:\/\/dcimg\d+\.dcinside\.(?:com|co\.kr)\/viewimage\.php\?/),
  ),
  tempno: v.pipe(v.string(), v.regex(/^\d+$/)),
  width: v.pipe(v.number(), v.integer(), v.minValue(1)),
  height: v.pipe(v.number(), v.integer(), v.minValue(1)),
})

export type UploadedImage = v.InferOutput<typeof imageSchema>

export const parseUploadResult = (
  output: string,
  assets: UploadAsset[],
): UploadedImage[] => {
  const section = output.match(
    /^### Result\r?\n([\s\S]*?)(?=^### |$(?![\s\S]))/m,
  )
  if (!section) throw new Error("Playwright 업로드 결과가 없습니다")
  let images: UploadedImage[]
  try {
    images = v.parse(v.array(imageSchema), JSON.parse(section[1].trim()))
  } catch {
    throw new Error("Playwright 업로드 응답 형식이 올바르지 않습니다")
  }
  if (
    images.length !== assets.length ||
    images.some((image, index) =>
      JSON.stringify(image.files) !== JSON.stringify(assets[index].files)
    ) || new Set(images.map((image) => image.tempno)).size !== images.length
  ) throw new Error("업로드한 이미지와 서버 응답이 일치하지 않습니다")
  return images
}

// Upload one file at a time so completion order cannot swap image mappings.
export const uploadBrowserCode = (
  assets: UploadAsset[],
  uploadFiles = assets.map((asset) => asset.files[0]),
): string =>
  `async (page) => {
  const assets = ${JSON.stringify(assets)};
  const paths = ${JSON.stringify(uploadFiles)};
  const result = [];
  for (let start = 0; start < assets.length; start += 50) {
    const batch = assets.slice(start, start + 50);
    const editor = start === 0 ? page : await page.context().newPage();
    if (start > 0) await editor.goto("https://gall.dcinside.com/board/write/?id=rlike");
    const popupPromise = editor.waitForEvent("popup", {timeout: 30000});
    await editor.getByRole("button", {name: "이미지", exact: true}).click();
    const popup = await popupPromise;
    await popup.locator("input[type=file]").waitFor();
    if (await popup.locator("li.template-download img[data-no]").count()) {
      throw new Error("Unexpected existing uploads");
    }
    const pending = [];
    for (let index = 0; index < batch.length; index++) {
      await popup.locator("input[type=file]").setInputFiles(paths[start + index]);
      const known = pending.map(image => image.tempno);
      await popup.waitForFunction(known =>
        [...document.querySelectorAll("li.template-download img[data-no]")]
          .some(image => !known.includes(image.dataset.no)), known, {timeout: 120000});
      const added = await popup.locator("li.template-download img[data-no]")
        .evaluateAll((images, known) => images.map(image => image.dataset.no)
          .filter(id => !known.includes(id)), known);
      const tempno = added[0];
      if (added.length !== 1 || !/^\\d+$/.test(tempno || "")) throw new Error("Invalid image ID");
      pending.push({files: batch[index].files, tempno});
    }
    const closed = popup.waitForEvent("close", {timeout: 30000});
    await popup.getByRole("button", {name: "적용", exact: true}).click();
    await closed;
    for (const image of pending) {
      const locator = editor.locator('.note-editable img[data-tempno="' + image.tempno + '"]');
      await locator.waitFor({timeout: 30000});
      await editor.waitForFunction(tempno => {
        const image = document.querySelector('.note-editable img[data-tempno="' + tempno + '"]');
        return image && image.complete && image.naturalWidth > 0;
      }, image.tempno, {timeout: 120000});
      result.push(await locator.evaluate((image, entry) => ({
        ...entry, src: image.src, width: image.naturalWidth, height: image.naturalHeight
      }), image));
    }
  }
  return result;
}`
