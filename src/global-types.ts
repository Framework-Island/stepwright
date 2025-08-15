// Extend Node.js global type for callback functionality
declare namespace NodeJS {
  interface Global {
    onResultCallback: ((result: Record<string, any>, index: number) => Promise<void>) | null;
  }
}
