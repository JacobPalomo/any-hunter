export type Severity = 'warning' | 'error';

export interface Issue {
  file: string;
  line: number;
  character: number;
  message: string;
  severity: Severity;
}

export interface ProjectAnalysis {
  projectIssues: Issue[];
  projectScore: number;
  totalAnalyzedLOC: number;
}
