import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { SteeringTemplate } from './types.js';
import { getSteeringTemplateById, STEERING_TEMPLATES } from './types.js';
import { generateFrontmatter, type SteeringFile } from '@kiro-transition/steering-generator';

export function instantiateSteeringTemplate(
  templateId: string,
  variables: Record<string, string> = {}
): SteeringFile | null {
  const template = getSteeringTemplateById(templateId);
  if (!template) return null;

  let content = template.contentTemplate;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }

  return {
    frontmatter: template.frontmatter,
    content,
  };
}

export async function writeSteeringFromTemplate(
  templateId: string,
  outputDir: string,
  variables: Record<string, string> = {}
): Promise<string | null> {
  const steering = instantiateSteeringTemplate(templateId, variables);
  if (!steering) return null;

  const template = getSteeringTemplateById(templateId);
  const fileName = `${template!.id}.md`;
  const outputPath = path.join(outputDir, fileName);

  const frontmatterStr = generateFrontmatter(steering.frontmatter);
  const fullContent = `${frontmatterStr}\n\n${steering.content}`;

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, fullContent, 'utf-8');

  return outputPath;
}

export function findMatchingTemplates(
  filePath: string,
  templates: SteeringTemplate[] = STEERING_TEMPLATES
): SteeringTemplate[] {
  return templates.filter((t) => {
    if (t.frontmatter.inclusion !== 'fileMatch') return false;
    const patterns = t.frontmatter.fileMatchPattern;
    if (!patterns) return false;

    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    return patternArray.some((pattern) => {
      const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\./g, '\\.');
      return new RegExp(regex).test(filePath);
    });
  });
}
