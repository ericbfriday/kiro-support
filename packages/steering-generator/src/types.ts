export type InclusionMode = 'always' | 'fileMatch' | 'manual' | 'auto';

export interface SteeringFrontmatter {
  inclusion: InclusionMode;
  fileMatchPattern?: string | string[];
  name?: string;
  description?: string;
}

export interface SteeringFile {
  frontmatter: SteeringFrontmatter;
  content: string;
  references?: string[];
}

export interface SteeringGeneratorOptions {
  projectName?: string;
  techStack?: string[];
  includeReferences?: boolean;
  inclusionMode?: InclusionMode;
  fileMatchPattern?: string | string[];
}

export interface TechStackInfo {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  packageManager?: string;
  runtimeVersions: Map<string, string>;
}
