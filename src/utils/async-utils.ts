// src/utils/async-utils.ts

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)) 