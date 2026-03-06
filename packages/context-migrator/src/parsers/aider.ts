import { parse as parseYaml } from 'yaml';
import type { ParsedContext, ContextSection } from '../types.js';

export function parseAiderConfig(content: string): ParsedContext {
  const sections: ContextSection[] = [];
  const rules: string[] = [];
  const metadata: Record<string, unknown> = {};

  try {
    const parsed = parseYaml(content);

    if (Array.isArray(parsed.read)) {
      sections.push({
        heading: 'Context Files',
        content: parsed.read.map((f: string) => `- ${f}`).join('\n'),
        level: 2,
      });
    }

    if (parsed.model) {
      metadata.model = parsed.model;
    }

    if (Array.isArray(parsed.additional_commands)) {
      sections.push({
        heading: 'Additional Commands',
        content: parsed.additional_commands.map((c: string) => `- ${c}`).join('\n'),
        level: 2,
      });
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
