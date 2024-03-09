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