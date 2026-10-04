#!/usr/bin/env -S deno run
import { Command } from "@cliffy/command"
import { ensureDir, exists } from "@std/fs"
import { basename, dirname, fromFileUrl, join, resolve } from "@std/path"

import {
  collectUploadAssets,
  parseUploadResult,
  uploadBrowserCode,
} from "../src/upload.ts"

export const runUpload = async (
  options: { directories: string[]; playwright: string; force?: boolean },
): Promise<void> => {
  const directories = [
    ...new Set(options.directories.map((dir) => resolve(dir))),
  ]
  const request = async (
    permission: Deno.PermissionDescriptor,
  ): Promise<void> => {
    if ((await Deno.permissions.request(permission)).state !== "granted") {
      throw new Error(`필요한 ${permission.name} 권한이 없습니다`)
    }
  }
  for (const directory of directories) {
    await request({ name: "read", path: directory })
    if (!options.force && await exists(join(directory, "uploads.json"))) {
      throw new Error(
        `${directory}/uploads.json 이미 존재합니다 (--force로 재업로드)`,
      )
    }
  }
  const assets = await collectUploadAssets(directories)
  if (assets.length === 0) {
    console.log("업로드할 이미지가 없습니다")
    return
  }

  const outputRoot = resolve(
    dirname(fromFileUrl(import.meta.url)),
    "../dist/.uploads",
  )
  for (const path of [...directories, outputRoot]) {
    await request({ name: "write", path })
  }
  await request({ name: "read", path: outputRoot })
  await request({ name: "run", command: options.playwright })
  const env: Record<string, string> = {}
  for (
    const variable of [
      "PATH",
      "HOME",
      "XDG_CACHE_HOME",
      "XDG_CONFIG_HOME",
      "XDG_DATA_HOME",
      "TMPDIR",
    ]
  ) {
    await request({ name: "env", variable })
    const value = Deno.env.get(variable)
    if (value !== undefined) env[variable] = value
  }
  await ensureDir(outputRoot)
  const workspace = await Deno.makeTempDir({
    dir: outputRoot,
    prefix: ".upload-",
  })
  const session = `dc-upload-${crypto.randomUUID()}`
  const command = async (args: string[]): Promise<string> => {
    const result = await new Deno.Command(options.playwright, {
      args: [`-s=${session}`, ...args],
      cwd: workspace,
      clearEnv: true,
      env,
      stdout: "piped",
      stderr: "piped",
    }).output()
    const stdout = new TextDecoder().decode(result.stdout)
    if (!result.success || /^### Error/m.test(stdout)) {
      const stderr = new TextDecoder().decode(result.stderr)
      throw new Error(
        /No version is set for shim/.test(stderr)
          ? "playwright-cli의 mise 실행 버전이 없습니다. --playwright로 실행 파일을 지정하세요"
          : `Playwright ${
            args[0]
          } 단계 실패 (로그에 포함될 수 있는 민감한 응답은 생략합니다)`,
      )
    }
    return stdout
  }

  let opened = false
  let failed = false
  const cleanupErrors: string[] = []
  try {
    const uploadFiles = []
    for (const [index, asset] of assets.entries()) {
      const path = join(workspace, `${index}-${basename(asset.files[0])}`)
      await Deno.copyFile(asset.files[0], path)
      uploadFiles.push(path)
    }
    console.log(`이미지 ${assets.length}종 업로드 중 (게시글 등록 없음)`)
    await command([
      "open",
      "https://gall.dcinside.com/board/write/?id=rlike",
      "--browser",
      "firefox",
    ])
    opened = true
    const images = parseUploadResult(
      await command(["run-code", uploadBrowserCode(assets, uploadFiles)]),
      assets,
    )
    for (const directory of directories) {
      const mapping = Object.fromEntries(
        images.flatMap(({ files, ...image }) =>
          files.filter((file) => dirname(file) === directory)
            .map((file) => [basename(file), image])
        ),
      )
      await Deno.writeTextFile(
        join(directory, "uploads.json"),
        JSON.stringify(mapping, null, 2) + "\n",
        { createNew: !options.force },
      )
      console.log(`저장: ${directory}/uploads.json`)
    }
  } catch (error) {
    failed = true
    throw error
  } finally {
    if (opened) {
      try {
        await command(["close"])
      } catch {
        cleanupErrors.push("브라우저 종료 실패")
      }
    }
    try {
      await Deno.remove(workspace, { recursive: true })
    } catch {
      cleanupErrors.push("임시 작업 폴더 제거 실패")
    }
    if (failed && cleanupErrors.length) console.error(cleanupErrors.join("; "))
  }
  if (cleanupErrors.length) throw new Error(cleanupErrors.join("; "))
}

if (import.meta.main) {
  try {
    await new Command()
      .name("dc-upload")
      .description(
        "변경목록에 쓰인 이미지만 DC 서버에 업로드합니다. 본문은 변경하지 않습니다.",
      )
      .arguments("<directories...:string>")
      .option("--playwright <path:string>", "playwright-cli 실행 파일", {
        default: "playwright-cli",
      })
      .option("--force", "기존 uploads.json을 덮어쓰고 재업로드")
      .action(async (options, ...directories) => {
        await runUpload({ ...options, directories })
      })
      .parse(Deno.args[0] === "--" ? Deno.args.slice(1) : Deno.args)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    Deno.exitCode = 1
  }
}
