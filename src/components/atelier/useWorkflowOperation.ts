"use client";

import { useRef } from "react";
import { workflowOperation, type WorkflowOperation } from "@/lib/workflow-operation";

export function useWorkflowOperation() {
  const previous = useRef<WorkflowOperation | null>(null);
  return (input: unknown) => {
    previous.current = workflowOperation(previous.current, input, () => crypto.randomUUID());
    return previous.current.key;
  };
}
