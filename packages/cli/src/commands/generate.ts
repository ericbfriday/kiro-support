import { 
  generateSteeringFile, 
  steeringToMarkdown, 
  type SteeringGeneratorOptions 
} from '@kiro-transition/steering-generator';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function runGenerateSteering(
  options: SteeringGeneratorOptions,
  outputPath: string
) {
  const steering = await generateSteeringFile(options);
  const markdown = steeringToMarkdown(steering);
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf-8');
  
  return outputPath;
}
