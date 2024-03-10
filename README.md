# `bun-plugin-jsx-script-bundler`

Adds support for bundling scripts from `.jsx`/`.tsx` files to configured `outDir`

## Installation

```sh
bun add bun-plugin-jsx-script-bundler -d
```

## Bundler usage

This plugin can be used to bundle scripts from `.jsx`/`.tsx` files in Bun's bundler by passing it into the `plugins` array:

```ts
import JSXScriptBundlerPlugin from "bun-plugin-jsx-script-bundler";

Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  plugins: [JSXScriptBundlerPlugin()],
});
```

The JSX/TSX file:

```tsx
// some-root-layout.tsx
export default async function RootLayout({ children }: { children?: JSX.Element | JSX.Element[] }) {
    return (
        <html lang="en">
            <head>
                <script src="npm:htmx.org" />
                <script src="https://unpkg.com/hyperscript.org@0.9.12" />
            </head>
            <body>
                {children}
            </body>
        </html>
    )
}
```

The scripts referenced in `src` attributes will be bundled to the `outDir` of the Bun.build config. The `npm:` prefix is used to reference packages from the `node_modules` directory. The `https://` prefix is used to reference external scripts. Any other scripts referenced without the prefixes will not be bundled.

Resulting output:
```
/outDir
    /js
        /htmx.min.js
        /_hyperscript.min.js
    /some-root-layout.js
```
## Contributing

```bash
$ bun install # project setup
$ bun test # run tests
```