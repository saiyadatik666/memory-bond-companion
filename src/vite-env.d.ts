/// <reference types="vite/client" />

declare namespace NodeJS {
  type Timeout = any;
  type Timer = any;
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
  interface Process {
    env: ProcessEnv;
  }
}

declare var process: NodeJS.Process;

declare module 'node:crypto' {
  export function createHash(algorithm: string): any;
  export function timingSafeEqual(a: any, b: any): boolean;
}
