// Global callback for streaming (TypeScript declaration)
declare global {
  var onResultCallback:
    | ((result: Record<string, any>, index: number) => Promise<void>)
    | null
}

export {};
