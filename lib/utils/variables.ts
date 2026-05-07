const variablePattern = /\{\{(\w+)\}\}/g;

export function parseVariables(content: string): string[] {
  const matches = content.matchAll(variablePattern);
  return [...new Set([...matches].map((match) => match[1]))];
}

export function resolveVariables(content: string, values: Record<string, string>): string {
  return content.replace(variablePattern, (_, name: string) => values[name] ?? `{{${name}}}`);
}
