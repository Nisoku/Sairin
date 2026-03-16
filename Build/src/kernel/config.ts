import type { SatoriInstance, SatoriLogger } from "@nisoku/satori-log";

export type LockViolationBehavior = "throw" | "warn" | "silent";

export interface SairinConfig {
  lockViolation: LockViolationBehavior;
  satori: SatoriInstance | null;
}

let currentConfig: SairinConfig = {
  lockViolation: "throw",
  satori: null,
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

export function getSairinLogger(): SatoriLogger | null {
  if (!currentConfig.satori) {
    return null;
  }
  return currentConfig.satori.createLogger("sairin");
}
