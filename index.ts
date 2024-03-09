import { readFileSync } from "node:fs";
import type { BunPlugin } from "bun";

function JSXScriptBundlerPlugin(config?: { verbose?: true }): BunPlugin {
	const regexp = /<script .*((?=npm:|http:\/\/|https:\/\/).*?)(?=")/g;

	return {
		name: "bun-plugin-jsx-script-bundle",
		setup(builder) {
			builder.onLoad({ filter: /\.(jsx|tsx)$/ }, async (args) => {
				const contents = readFileSync(args.path, "utf-8");

				const matches = await Promise.all(
					Array.from(contents.matchAll(regexp), async ([match, g1]) => {
						let fileName: string;

						if (g1.includes("http://") || g1.includes("https://")) {
							const urlPath: string = g1;

							if (config?.verbose) console.log(`Downloading ${urlPath}`);

							const res = await fetch(urlPath);

							fileName = new URL(res.url).pathname.split("/").pop() ?? "";

							if (builder.config.outdir) {
								const savePath = `${builder.config.outdir ?? import.meta.dir}${
									builder.config.publicPath ?? ""
								}/js/${fileName}`;
								if (res.ok) {
									res.text().then((text) => {
										if (config?.verbose) console.log(`Writing to ${savePath}`);

										Bun.write(`${savePath}`, text);
									});
								} else {
									console.error(`Failed to fetch ${urlPath}`);
									return match;
								}
							}
						} else {
							const filePath = (() => {
								try {
									return import.meta.resolveSync(`${g1.split(":").pop()}`);
								} catch (error) {}
							})();

							if (!filePath) {
								console.error(`Cannot find module: ${g1}`);
								return match;
							}

							fileName = filePath.split("/").pop() ?? "";

							const file = readFileSync(filePath);

							if (builder.config.outdir) {
								const savePath = `${builder.config.outdir ?? import.meta.dir}${
									builder.config.publicPath ?? ""
								}/js/${fileName}`;

								if (config?.verbose) console.log(`Writing to ${savePath}`);

								Bun.write(savePath, file);
							}
						}

						return `${match.replace(
							g1,
							`${builder.config.publicPath ?? ""}/js/${fileName}`,
						)}`;
					}),
				);

				let i = 0;

				return {
					contents: contents.replace(regexp, () => matches[i++]),
					loader: args.loader,
				};
			});
		},
	};
}


export default JSXScriptBundlerPlugin;