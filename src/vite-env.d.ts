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

declare const process: NodeJS.Process;
