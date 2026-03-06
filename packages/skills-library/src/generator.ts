import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { SkillDefinition } from './types.js';
import { getSkillTemplateById } from './types.js';

export function instantiateSkillTemplate(
  templateId: string,
  overrides: Partial<SkillDefinition> = {}
): SkillDefinition | null {
  const template = getSkillTemplateById(templateId);
  if (!template) return null;

  return {
    ...template.template,
    ...overrides,
  };
}

export async function writeSkillFile(
  skill: SkillDefinition,
  outputDir: string
): Promise<string> {
  const fileName = `${skill.name}.json`;
  const outputPath = path.join(outputDir, fileName);
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(skill, null, 2), 'utf-8');
  
  return outputPath;
}

export function validateSkill(skill: SkillDefinition): string[] {
  const errors: string[] = [];

  if (!skill.name?.trim()) {
    errors.push('Skill name is required');
  }

  if (!skill.description?.trim()) {
    errors.push('Skill description is required');
  }

  if (!skill.prompt?.trim()) {
    errors.push('Skill prompt is required');
  }

  if (skill.name && !/^[a-z0-9-]+$/.test(skill.name)) {
    errors.push('Skill name must be lowercase kebab-case (a-z, 0-9, hyphens only)');
  }

  return errors;
}
