import { parse as parseYaml } from 'yaml';
import type { ParsedContext, ContextSection } from '../types.js';

export function parseContinueConfig(content: string): ParsedContext {
  const sections: ContextSection[] = [];
  const rules: string[] = [];
  const metadata: Record<string, unknown> = {};

  try {
    const parsed = parseYaml(content);

    if (Array.isArray(parsed.rules)) {
      for (const rule of parsed.rules) {
        if (typeof rule === 'string') {
          rules.push(rule);
        }
      }
      metadata.rulesCount = parsed.rules.length;
    }

    if (Array.isArray(parsed.prompts)) {
      sections.push({
        heading: 'Prompts',
        content: parsed.prompts
          .map((p: { name?: string; description?: string }) => {
            if (p.name && p.description) {
              return `- **${p.name}**: ${p.description}`;
            }
            return null;
          })
          .filter(Boolean)
          .join('\n'),
        level: 2,
      });
    }

    if (parsed.model) {
      metadata.model = parsed.model;
    }
  } catch {
    // Invalid YAML
  }

  const result: ParsedContext = {
    sections,
    rules,
  };

  if (Object.keys(metadata).length > 0) {
    result.metadata = metadata;
  }

  return result;
}
