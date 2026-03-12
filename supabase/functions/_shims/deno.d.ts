// Minimal Deno type shims for editor support without the Deno VS Code extension.
// The actual runtime types are provided by Deno itself when deployed.

declare namespace Deno {
  interface Env {
    get(key: string): string | undefined
  }
  const env: Env

  function serve(handler: (req: Request) => Response | Promise<Response>): void
}
