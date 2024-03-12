import type { BunPlugin, OnLoadArgs, OnLoadResult, PluginBuilder } from "bun";

type Options = { verbose?: true; inline?: true };

type ExtraArgs = Record<string, unknown> & {
	/**
	 * A map of source files to use instead.
	 * Use this to pass previous transpiled code if any.
	 * Otherwise, it will read the file from the file system.
	 * `{ [filePath: string]: code }`
	 */
	sourceFiles?: { [filePath: string]: string };
};

const pluginName = "bun-plugin-jsx-script-bundle";

const handleRemoteScripts = async (
	build: PluginBuilder,
	match: string,
	groups: string[],
	options?: Options,
) => {
	const [url, endTag] = groups;
	if (options?.verbose) console.log(`${pluginName}: Downloading ${url}`);

	const res = await fetch(url);
	if (!res.ok) {
		console.error(`${pluginName}: Failed to fetch ${url}`);
		return match;
	}

	if (options?.inline) {
		return `${match
			.replace(/src=".*"/, "")
			.replace(endTag, endTag === "/>" ? ">" : "")}{${JSON.stringify(
			await res.text(),
		)}}</script>`;
	}

	if (build.config?.outdir) {
		const moduleFileName = new URL(res.url).pathname.split("/").pop() ?? "";

		const savePath = `${build.config.outdir}${
			build.config.publicPath ?? ""
		}/js/${moduleFileName}`;

		if (options?.verbose) console.log(`${pluginName}: Writing to ${savePath}`);

		Bun.write(`${savePath}`, await res.text());
		return `${match.replace(
			url,
			`${build.config?.publicPath ?? ""}/js/${moduleFileName}`,
		)}`;
	}

	// If no outdir is provided or no inline option, leave it be
	return match;
};

const handleModules = async (
	build: PluginBuilder,
	match: string,
	groups: string[],
	options?: Options,
) => {
	const [moduleName, endTag] = groups;
	const modulefilePath = (() => {
		try {
			if (options?.verbose)
				console.log(`${pluginName}: Resolving ${moduleName.split(":").pop()}`);
			return import.meta.resolveSync(`${moduleName.split(":").pop()}`);
		} catch (error) {}
	})();

	if (!modulefilePath) {
		console.error(`${pluginName}: Cannot find module: ${moduleName}`);
		return match;
	}

	const moduleFileContent = await Bun.file(modulefilePath).text();

	if (options?.inline) {
		return `${match
			.replace(/src=".*"/, "")
			.replace(endTag, endTag === "/>" ? ">" : "")}{${JSON.stringify(
			moduleFileContent,
		)}}</script>`;
	}

	if (build.config?.outdir) {
		const moduleFileName = modulefilePath.split("/").pop() ?? "";

		const savePath = `${build.config.outdir}${
			build.config.publicPath ?? ""
		}/js/${moduleFileName}`;

		if (options?.verbose) console.log(`${pluginName}: Writing to ${savePath}`);

		await Bun.write(savePath, moduleFileContent);
		return `${match.replace(
			moduleName,
			`${build.config?.publicPath ?? ""}/js/${moduleFileName}`,
		)}`;
	}

	// If no outdir is provided or no inline option, leave it be
	return match;
};

/**
 *
 * @param options Options for the plugin.
 * @param extras Provide extra data to the plugin.
 * @returns {BunPlugin}
 */
const JSXScriptBundlerPlugin = (
	options?: Options,
	extras?: ExtraArgs,
): BunPlugin & { onLoadCallback: typeof onLoadCallback } => {
	const regexp =
		/<script .*((?=npm:|http:\/\/|https:\/\/).*?)(?=").*(\/>|<\/script>)/g;

	const onLoadCallback: (
		build: PluginBuilder,
		args: OnLoadArgs,
	) => OnLoadResult | Promise<OnLoadResult> = async (build, { path }) => {
		const contents = extras?.sourceFiles
			? extras.sourceFiles[path]
			: await Bun.file(path).text();
		const matches = await Promise.all(
			Array.from(contents.matchAll(regexp), async ([match, g1, endTag]) => {
				if (g1.includes("http://") || g1.includes("https://")) {
					return handleRemoteScripts(build, match, [g1, endTag], options);
				}

				return handleModules(build, match, [g1, endTag], options);
			}),
		);

		let i = 0;

		return {
			contents: contents.replace(regexp, () => matches[i++]),
		};
	};

	return {
		name: pluginName,
		setup(build) {
			build.onLoad({ filter: /\.(jsx|tsx)$/ }, (args) =>
				onLoadCallback(build, args),
			);
		},
		onLoadCallback,
	};
};

export default JSXScriptBundlerPlugin;
