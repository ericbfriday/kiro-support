import { scanEnvironment, type ScannerOptions } from '@kiro-transition/env-scanner';

export async function runScan(options: ScannerOptions) {
  return scanEnvironment(options);
}
