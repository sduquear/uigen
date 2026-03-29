import { Loader2 } from "lucide-react";
import { getToolMessage } from "@/lib/tool-messages";

interface ToolIndicatorProps {
  toolName: string;
  state: string;
  args: Record<string, any>;
  result?: any;
}

export function ToolIndicator({
  toolName,
  state,
  args,
  result,
}: ToolIndicatorProps) {
  const message = getToolMessage(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {state === "result" && result ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{message.text}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message.text}</span>
        </>
      )}
    </div>
  );
}
