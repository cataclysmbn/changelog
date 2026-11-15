---
name: before-after
description: Turn a PR's before/after screenshot sets into one looping side-by-side animated WebP for a changelog post. Use when a post entry shows only the before (or only the after) image of a PR that has both, or when asked for a before/after comparison image.
compatibility: Deno and ImageMagick.
---

# Before/after comparison

Each frame shows one before image on the left (`Before`) and one after image on the right (`After`). Frames change every 1 s and loop forever.

1. List the images from the raw PR body. Keep the `Before` and `After` groups (usually `<details>` blocks) apart:

   ```sh
   gh pr view <number> -R cataclysmbn/Cataclysm-BN --json body -q .body
   ```

2. Look at every image and pair them by step: same place, z-level, and build stage. When one side has a step the other lacks, pair it with the other side's image that shows the same state. Example: PR 10834 has 3 before and 4 after shots. After shot 3 shows the new roof; pair it with before shot 2, because the old building had no roof.

3. Build the WebP into the post folder. Give the sources as `BEFORE AFTER` pairs, URLs or file paths:

   ```sh
   deno task compare -o dist/<period>/<number>-before-after.webp \
     <before1> <after1> <before2> <after2> ...
   ```

   Panels pad every image to the largest size without scaling. Pixel art (see `isPixelArt` in `scripts/mirror_images.ts`) is lossless; other images use the mirror's WebP quality. `-d <seconds>` changes the frame time.

4. Look at the frames before using the file:

   ```sh
   magick dist/<period>/<number>-before-after.webp -coalesce -append -resize 50% /tmp/<scratch>/frames.png
   ```

5. In both `changelog.txt` and `changelog.en.txt`, replace that entry's PR image lines with one line that points to the WebP as an absolute `file:` URL:

   ```text
   ![해체 작업장 변경 전후](file:///home/scarf/repo/cata/dc-changelog/dist/<period>/<number>-before-after.webp)
   ```

6. Re-render both HTML files. `deno task html` pushes the WebP to the `images` branch and writes its jsDelivr URL into the HTML:

   ```sh
   deno task html dist/<period>/changelog.txt
   deno task html dist/<period>/changelog.en.txt
   ```
