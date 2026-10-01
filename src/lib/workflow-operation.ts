export interface WorkflowOperation {
  intent: string;
  key: string;
}

// Keep retries tied to the same user intent, without generating IDs during render.
export function workflowOperation(
  previous: WorkflowOperation | null,
  input: unknown,
  createKey: () => string,
): WorkflowOperation {
  const intent = JSON.stringify(input);
  return previous?.intent === intent ? previous : { intent, key: createKey() };
}
