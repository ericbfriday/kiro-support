import { 
  migrateToSteering, 
  writeMigrationResult, 
  type MigrationOptions 
} from '@kiro-transition/context-migrator';

export async function runMigrate(options: MigrationOptions) {
  const result = await migrateToSteering(options);
  await writeMigrationResult(result, options);
  return result;
}
