export type HookEventType =
  | 'fileEdited'
  | 'fileCreated'
  | 'fileDeleted'
  | 'manual'
  | 'PromptSubmit'
  | 'AgentStop'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PreTaskExecution'
  | 'PostTaskExecution';

export type HookActionType = 'askAgent' | 'shellCommand';

export interface HookWhen {
  type: HookEventType;
  patterns?: string[];
}

export interface HookThen {
  type: HookActionType;
  prompt?: string;
  command?: string;
}

export interface HookDefinition {
  enabled: boolean;
  name: string;
  description: string;
  version: string;
  when: HookWhen;
  then: HookThen;
}

export interface HookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'linting' | 'testing' | 'formatting' | 'documentation' | 'security' | 'custom';
  template: HookDefinition;
  variables?: Record<string, string>;
}
