import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, test } from "vite-plus/test"

import { execText } from "./exec.ts"

test("execText finds a command on the parent PATH but gives the child only env", async () => {
  // "probe" exists only in a temporary PATH entry and prints PATH and HOME as the child sees them.
  const dir = await mkdtemp(join(tmpdir(), "exec-"))
  const saved = process.env["PATH"]
  try {
    await writeFile(join(dir, "probe"), '#!/bin/sh\necho "$HOME|$FOO"\n')
    await chmod(join(dir, "probe"), 0o755)
    process.env["PATH"] = `${dir}:${saved}`
    expect(await execText("probe", [], { FOO: "bar" }, "probe failed")).toEqual("|bar\n")
  } finally {
    process.env["PATH"] = saved
    await rm(dir, { recursive: true })
  }
})
