import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { RuntimeVersion, CIEnvironment } from '../types.js';

export async function detectCIEnvironment(rootDir: string): Promise<CIEnvironment | null> {
  const searchDir = rootDir;

  // GitHub Actions
  const githubWorkflowsDir = path.join(searchDir, '.github', 'workflows');
  try {
    const files = await fs.readdir(githubWorkflowsDir);
    const yamlFiles = files.filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
    if (yamlFiles.length > 0) {
      const versions: RuntimeVersion[] = [];
      for (const file of yamlFiles) {
        const filePath = path.join(githubWorkflowsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        versions.push(...extractGitHubActionsVersions(content, filePath));
      }
      return {
        platform: 'github',
        versions,
        configFile: githubWorkflowsDir,
      };
    }
  } catch {}

  // GitLab CI
  try {
    const gitlabPath = path.join(searchDir, '.gitlab-ci.yml');
    const content = await fs.readFile(gitlabPath, 'utf-8');
    return {
      platform: 'gitlab',
      versions: extractGitLabCIVersions(content, gitlabPath),
      configFile: gitlabPath,
    };
  } catch {}

  // CircleCI
  try {
    const circlePath = path.join(searchDir, '.circleci', 'config.yml');
    const content = await fs.readFile(circlePath, 'utf-8');
    return {
      platform: 'circleci',
      versions: extractCircleCIVersions(content, circlePath),
      configFile: circlePath,
    };
  } catch {}

  // Azure Pipelines
  try {
    const azurePath = path.join(searchDir, 'azure-pipelines.yml');
    const content = await fs.readFile(azurePath, 'utf-8');
    return {
      platform: 'azure',
      versions: extractAzureVersions(content, azurePath),
      configFile: azurePath,
    };
  } catch {}

  // Bitbucket
  try {
    const bitbucketPath = path.join(searchDir, 'bitbucket-pipelines.yml');
    const content = await fs.readFile(bitbucketPath, 'utf-8');
    return {
      platform: 'bitbucket',
      versions: extractBitbucketVersions(content, bitbucketPath),
      configFile: bitbucketPath,
    };
  } catch {}

  // Docker
  try {
    const dockerfilePath = path.join(searchDir, 'Dockerfile');
    const content = await fs.readFile(dockerfilePath, 'utf-8');
    return {
      platform: 'docker',
      versions: extractDockerVersions(content, dockerfilePath),
      configFile: dockerfilePath,
    };
  } catch {}

  return null;
}

function extractGitHubActionsVersions(content: string, filePath: string): RuntimeVersion[] {
  const versions: RuntimeVersion[] = [];
  try {
    const parsed = parseYaml(content);

    // Find setup-* actions
    const jobs = parsed.jobs ?? {};
    for (const job of Object.values(jobs)) {
      const jobObj = job as Record<string, unknown>;
      const steps = jobObj.steps as Array<Record<string, unknown>> ?? [];
      for (const step of steps) {
        const uses = step.uses as string ?? '';
        const with_ = step.with as Record<string, unknown> ?? {};

        if (uses.includes('setup-node')) {
          if (with_['node-version']) {
            versions.push({
              runtime: 'node',
              version: String(with_['node-version']),
              source: { type: 'file', description: 'GitHub Actions setup-node' },
              configFile: filePath,
            });
          }
        }
        if (uses.includes('setup-python')) {
          if (with_['python-version']) {
            versions.push({
              runtime: 'python',
              version: String(with_['python-version']),
              source: { type: 'file', description: 'GitHub Actions setup-python' },
              configFile: filePath,
            });
          }
        }
        if (uses.includes('setup-java')) {
          if (with_['java-version']) {
            versions.push({
              runtime: 'java',
              version: String(with_['java-version']),
              source: { type: 'file', description: 'GitHub Actions setup-java' },
              configFile: filePath,
            });
          }
        }
      }

      // Matrix strategy
      const strategy = jobObj.strategy as Record<string, unknown> ?? {};
      const matrix = strategy.matrix as Record<string, unknown> ?? {};
      if (matrix.node) {
        for (const v of matrix.node as string[]) {
          versions.push({
            runtime: 'node',
            version: v,
            source: { type: 'file', description: 'GitHub Actions matrix.node' },
            configFile: filePath,
          });
        }
      }
    }
  } catch {}

  return versions;
}

function extractGitLabCIVersions(content: string, filePath: string): RuntimeVersion[] {
  const versions: RuntimeVersion[] = [];
  try {
    const parsed = parseYaml(content);

    if (typeof parsed.image === 'string') {
      const version = extractImageVersion(parsed.image);
      if (version) {
        versions.push({
          runtime: detectRuntimeFromImage(parsed.image),
          version,
          source: { type: 'file', description: 'GitLab CI image' },
          configFile: filePath,
        });
      }
    }
  } catch {}

  return versions;
}

function extractCircleCIVersions(content: string, filePath: string): RuntimeVersion[] {
  const versions: RuntimeVersion[] = [];
  try {
    const parsed = parseYaml(content);
    const jobs = parsed.jobs ?? {};

    for (const job of Object.values(jobs)) {
      const jobObj = job as Record<string, unknown>;
      const docker = jobObj.docker as Array<Record<string, unknown>> ?? [];
      for (const container of docker) {
        if (typeof container.image === 'string') {
          const version = extractImageVersion(container.image);
          if (version) {
            versions.push({
              runtime: detectRuntimeFromImage(container.image),
              version,
              source: { type: 'file', description: 'CircleCI docker image' },
              configFile: filePath,
            });
          }
        }
      }
    }
  } catch {}

  return versions;
}

function extractAzureVersions(content: string, filePath: string): RuntimeVersion[] {
  const versions: RuntimeVersion[] = [];
  try {
    const parsed = parseYaml(content);
    const resources = parsed.resources ?? {};
    const containers = resources.containers ?? [];

    for (const container of containers) {
      if (typeof container.image === 'string') {
        const version = extractImageVersion(container.image);
        if (version) {
          versions.push({
            runtime: detectRuntimeFromImage(container.image),
            version,
            source: { type: 'file', description: 'Azure Pipelines container' },
            configFile: filePath,
          });
        }
      }
    }
  } catch {}

  return versions;
}

function extractBitbucketVersions(content: string, filePath: string): RuntimeVersion[] {
  const versions: RuntimeVersion[] = [];
  try {
    const parsed = parseYaml(content);

    if (typeof parsed.image === 'string') {
      const version = extractImageVersion(parsed.image);
      if (version) {
        versions.push({
          runtime: detectRuntimeFromImage(parsed.image),
          version,
          source: { type: 'file', description: 'Bitbucket image' },
          configFile: filePath,
        });
      }
    }
  } catch {}

  return versions;
}

function extractDockerVersions(content: string, filePath: string): RuntimeVersion[] {
  const versions: RuntimeVersion[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const fromMatch = line.match(/^FROM\s+(\S+)/i);
    if (fromMatch?.[1]) {
      const image = fromMatch[1];
      const version = extractImageVersion(image);
      if (version) {
        versions.push({
          runtime: detectRuntimeFromImage(image),
          version,
          source: { type: 'file', description: 'Dockerfile FROM' },
          configFile: filePath,
        });
      }
    }

    const argMatch = line.match(/^ARG\s+\w*_?VERSION\s*=\s*(\S+)/i);
    if (argMatch?.[1]) {
      const version = argMatch[1].replace(/['"]/g, '');
      versions.push({
        runtime: 'unknown',
        version,
        source: { type: 'file', description: 'Dockerfile ARG' },
        configFile: filePath,
      });
    }
  }

  return versions;
}

function extractImageVersion(image: string): string | null {
  const match = image.match(/:(\d+(?:\.\d+)?(?:\.\d+)?(?:-\w+)?)/);
  return match?.[1] ?? null;
}

function detectRuntimeFromImage(image: string): string {
  if (image.includes('node')) return 'node';
  if (image.includes('python')) return 'python';
  if (image.includes('java') || image.includes('jdk') || image.includes('openjdk')) return 'java';
  if (image.includes('ruby')) return 'ruby';
  if (image.includes('golang') || image.includes('go:')) return 'go';
  if (image.includes('rust')) return 'rust';
  if (image.includes('php')) return 'php';
  if (image.includes('dotnet') || image.includes('microsoft/dotnet')) return 'dotnet';
  return 'unknown';
}
