import type { DetectedManager } from '../types.js';
import { VERSION_MANAGER_ENV_VARS } from '../types.js';

export function detectVersionManagers(): DetectedManager[] {
  const managers: DetectedManager[] = [];

  for (const [name, envVar] of Object.entries(VERSION_MANAGER_ENV_VARS)) {
    const value = process.env[envVar];
    if (value) {
      managers.push({
        name,
        active: true,
        path: value,
        envVar,
      });
    }
  }

  // Check PATH for version manager directories
  const pathEnv = process.env.PATH ?? '';
  const pathDirs = pathEnv.split(':');

  const pathBasedManagers: Array<{ pattern: string; name: string }> = [
    { pattern: '.nvm/versions/node', name: 'nvm' },
    { pattern: 'fnm_multishell', name: 'fnm' },
    { pattern: '.asdf/shims', name: 'asdf' },
    { pattern: '.nodenv/shims', name: 'nodenv' },
    { pattern: '.pyenv/shims', name: 'pyenv' },
    { pattern: '.jenv/shims', name: 'jenv' },
    { pattern: '.rbenv/shims', name: 'rbenv' },
  ];

  for (const { pattern, name } of pathBasedManagers) {
    if (pathDirs.some((dir) => dir.includes(pattern))) {
      const existing = managers.find((m) => m.name === name);
      if (!existing) {
        managers.push({
          name,
          active: true,
        });
      }
    }
  }

  return managers;
}
