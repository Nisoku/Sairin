import { createSatori, type SatoriInstance, type SatoriLogger } from "@nisoku/satori";

export type LockViolationBehavior = "throw" | "warn" | "silent";

export interface SairinConfig {
  lockViolation: LockViolationBehavior;
  satori: SatoriInstance;
}

let currentConfig: SairinConfig = {
  lockViolation: "throw",
  satori: createSatori({ logLevel: "debug" }),
};

export function configureSairin(config: Partial<SairinConfig>): void {
  if (config.lockViolation !== undefined) {
    currentConfig.lockViolation = config.lockViolation;
  }
  if (config.satori !== undefined) {
    currentConfig.satori = config.satori;
  }
}

export function getSairinConfig(): Readonly<SairinConfig> {
  return currentConfig;
}

export function getSairinLogger(): SatoriLogger {
  return currentConfig.satori.createLogger("sairin");
}
