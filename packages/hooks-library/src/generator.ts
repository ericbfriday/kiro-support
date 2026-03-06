import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { HookDefinition } from './types.js';
import { getTemplateById } from './templates.js';

export function instantiateTemplate(
  templateId: string,
  variables: Record<string, string> = {}
): HookDefinition | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  let def = JSON.stringify(template.template);

  for (const [key, value] of Object.entries(variables)) {
    def = def.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }

  return JSON.parse(def) as HookDefinition;
}

export function createCustomHook(definition: HookDefinition): HookDefinition {
  return {
    ...definition,
    version: definition.version ?? '1',
  };
}

export function validateHook(hook: HookDefinition): string[] {
  const errors: string[] = [];

  if (!hook.name?.trim()) {
    errors.push('Hook name is required');
  }

  if (!hook.when?.type) {
    errors.push('Hook event type (when.type) is required');
  }

  const validEventTypes = [
    'fileEdited', 'fileCreated', 'fileDeleted', 'manual',
    'PromptSubmit', 'AgentStop', 'PreToolUse', 'PostToolUse',
    'PreTaskExecution', 'PostTaskExecution',
  ];
  if (hook.when?.type && !validEventTypes.includes(hook.when.type)) {
    errors.push(`Invalid event type: ${hook.when.type}`);
  }

  if (!hook.then?.type) {
    errors.push('Hook action type (then.type) is required');
  }

  const validActionTypes = ['askAgent', 'shellCommand'];
  if (hook.then?.type && !validActionTypes.includes(hook.then.type)) {
    errors.push(`Invalid action type: ${hook.then.type}`);
  }

  if (hook.then?.type === 'askAgent' && !hook.then.prompt) {
    errors.push('askAgent action requires a prompt');
  }

  if (hook.then?.type === 'shellCommand' && !hook.then.command) {
    errors.push('shellCommand action requires a command');
  }

  return errors;
}

export async function writeHookFile(
  hook: HookDefinition,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(hook, null, 2);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, json, 'utf-8');
}

export function generateHookFileName(hook: HookDefinition): string {
  const safeName = hook.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${safeName}.kiro.hook`;
}
