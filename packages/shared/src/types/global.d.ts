/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_URL?: string;
      REACT_APP_API_URL?: string;
    }
  }

  const process: {
    env?: NodeJS.ProcessEnv;
  } | undefined;
}

