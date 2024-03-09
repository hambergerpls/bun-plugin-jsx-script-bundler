import { test, expect, beforeEach } from "bun:test";
import JSXScriptBundlerPlugin from ".";
import { rmSync } from "node:fs";

beforeEach(() => {
    rmSync('./dist/', {recursive: true});
})

test("jsx script bundler - no plugin", async () => {
    await Bun.build({
        entrypoints: ["./test.tsx"],
        outdir: "./dist",
    })
    expect(await Bun.file('./dist/js/htmx.min.js').exists()).toEqual(false);
  });
  
  test("jsx script bundler", async () => {
    await Bun.build({
        entrypoints: ["./test.tsx"],
        outdir: "./dist",
        minify: true,
        plugins: [JSXScriptBundlerPlugin()]
    })
    expect(await Bun.file('./dist/js/htmx.min.js').exists()).toEqual(true);
    expect(await Bun.file('./dist/js/_hyperscript.min.js').exists()).toEqual(true);
    expect(await Bun.file('./dist/test.js').text()).toInclude(`createElement("script",{src:"/js/htmx.min.js"})`);
    expect(await Bun.file('./dist/test.js').text()).toInclude(`createElement("script",{src:"/js/_hyperscript.min.js"})`);
  });