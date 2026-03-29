export interface ToolMessage {
  text: string;
}

function extractFilename(path: string): string {
  if (!path || path === "/") return "archivo";
  const segments = path.split("/").filter(Boolean);
  const filename = segments[segments.length - 1] || "archivo";

  // Truncate very long filenames
  if (filename.length > 30) {
    return filename.substring(0, 27) + "...";
  }

  return filename;
}

const TOOL_MESSAGES: Record<string, Record<string, string>> = {
  str_replace_editor: {
    create: "Creando {filename}",
    view: "Visualizando {filename}",
    str_replace: "Editando {filename}",
    insert: "Insertando en {filename}",
    undo_edit: "Deshaciendo cambios",
  },
  file_manager: {
    rename: "Renombrando {filename}",
    delete: "Eliminando {filename}",
  },
};

export function getToolMessage(
  toolName: string,
  args: Record<string, any> = {}
): ToolMessage {
  const toolMessages = TOOL_MESSAGES[toolName];

  if (!toolMessages) {
    return { text: toolName };
  }

  const command = args.command;

  if (!command) {
    return { text: toolName };
  }

  const messageTemplate = toolMessages[command];

  if (!messageTemplate) {
    return { text: toolName };
  }

  if (messageTemplate.includes("{filename}")) {
    const filename = extractFilename(args.path);
    return { text: messageTemplate.replace("{filename}", filename) };
  }

  return { text: messageTemplate };
}
