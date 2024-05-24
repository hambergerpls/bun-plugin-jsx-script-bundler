import { test, expect, beforeEach } from "bun:test";
import JSXScriptBundlerPlugin from ".";
import { rmSync } from "node:fs";

beforeEach(() => {
	rmSync("./dist/", { recursive: true });
});

test("jsx script bundler - no plugin", async () => {
	await Bun.build({
		entrypoints: ["./test.tsx"],
		outdir: "./dist",
	});
	expect(await Bun.file("./dist/htmx.min.js").exists()).toEqual(false);
});

test("jsx script bundler", async () => {
	await Bun.build({
		entrypoints: ["./test.tsx"],
		outdir: "./dist",
		minify: true,
		plugins: [JSXScriptBundlerPlugin()],
	});
	const glob = new Bun.Glob("{_hyperscript.min,htmx.min}-*.js");
	const scannedFiles = Array.from(glob.scanSync({ cwd: "./dist" }));
	for (const fileName of scannedFiles) {
		expect(await Bun.file(`./dist/${fileName}`).exists()).toEqual(true);
		expect(await Bun.file("./dist/test.js").text()).toInclude(
			`createElement("script",{src:"/${fileName}"})`,
		);
	}
});
