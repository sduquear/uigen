import { test, expect, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolIndicator } from "../ToolIndicator";

afterEach(() => {
  cleanup();
});

describe("ToolIndicator - str_replace_editor commands", () => {
  test("shows 'Creando {filename}' for create command with path", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "/App.jsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("Creando App.jsx")).toBeDefined();
  });

  test("shows 'Editando {filename}' for str_replace command with path", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "str_replace", path: "/components/Button.tsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("Editando Button.tsx")).toBeDefined();
  });

  test("shows 'Visualizando {filename}' for view command with path", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "view", path: "/utils/helpers.ts" }}
        result="Success"
      />
    );

    expect(screen.getByText("Visualizando helpers.ts")).toBeDefined();
  });

  test("shows 'Insertando en {filename}' for insert command with path", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "insert", path: "/config.json" }}
        result="Success"
      />
    );

    expect(screen.getByText("Insertando en config.json")).toBeDefined();
  });

  test("shows 'Deshaciendo cambios' for undo_edit command", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "undo_edit", path: "/App.jsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("Deshaciendo cambios")).toBeDefined();
  });

  test("extracts filename from nested path correctly", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "/src/components/ui/Button.tsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("Creando Button.tsx")).toBeDefined();
  });

  test("handles path without leading slash", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "App.jsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("Creando App.jsx")).toBeDefined();
  });
});

describe("ToolIndicator - file_manager commands", () => {
  test("shows 'Renombrando {filename}' for rename command", () => {
    render(
      <ToolIndicator
        toolName="file_manager"
        state="result"
        args={{ command: "rename", path: "/Button.tsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("Renombrando Button.tsx")).toBeDefined();
  });

  test("shows 'Eliminando {filename}' for delete command", () => {
    render(
      <ToolIndicator
        toolName="file_manager"
        state="result"
        args={{ command: "delete", path: "/old-component.tsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("Eliminando old-component.tsx")).toBeDefined();
  });
});

describe("ToolIndicator - status indicators", () => {
  test("shows green dot when state is 'result' with result", () => {
    const { container } = render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "/App.jsx" }}
        result="Success"
      />
    );

    const greenDot = container.querySelector(".bg-emerald-500");
    expect(greenDot).toBeDefined();
    expect(greenDot?.className).toContain("w-2 h-2 rounded-full");
  });

  test("shows spinner when state is not 'result'", () => {
    const { container } = render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="pending"
        args={{ command: "create", path: "/App.jsx" }}
      />
    );

    const spinner = container.querySelector(".animate-spin.text-blue-600");
    expect(spinner).toBeDefined();
  });

  test("shows spinner when result is missing even if state is 'result'", () => {
    const { container } = render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "/App.jsx" }}
      />
    );

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeDefined();
  });
});

describe("ToolIndicator - edge cases", () => {
  test("handles missing path - uses 'archivo' as fallback", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create" }}
        result="Success"
      />
    );

    expect(screen.getByText("Creando archivo")).toBeDefined();
  });

  test("handles empty path - uses 'archivo' as fallback", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "" }}
        result="Success"
      />
    );

    expect(screen.getByText("Creando archivo")).toBeDefined();
  });

  test("handles root path '/' - uses 'archivo' as fallback", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "/" }}
        result="Success"
      />
    );

    expect(screen.getByText("Creando archivo")).toBeDefined();
  });

  test("handles missing command - falls back to tool name", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ path: "/App.jsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("str_replace_editor")).toBeDefined();
  });

  test("handles unknown command - falls back to tool name", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "unknown_command", path: "/App.jsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("str_replace_editor")).toBeDefined();
  });

  test("handles unknown tool - displays raw tool name", () => {
    render(
      <ToolIndicator
        toolName="unknown_tool"
        state="result"
        args={{ command: "some_command", path: "/App.jsx" }}
        result="Success"
      />
    );

    expect(screen.getByText("unknown_tool")).toBeDefined();
  });

  test("handles empty args object", () => {
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{}}
        result="Success"
      />
    );

    expect(screen.getByText("str_replace_editor")).toBeDefined();
  });

  test("truncates very long filenames", () => {
    const longFilename =
      "this-is-a-very-long-filename-that-should-be-truncated.tsx";
    render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: `/${longFilename}` }}
        result="Success"
      />
    );

    const displayedText = screen
      .getByText(/Creando/)
      .textContent?.split(" ")[1];
    expect(displayedText?.endsWith("...")).toBe(true);
    expect(displayedText?.length).toBeLessThanOrEqual(30);
  });
});

describe("ToolIndicator - styling", () => {
  test("applies correct CSS classes", () => {
    const { container } = render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "/App.jsx" }}
        result="Success"
      />
    );

    const toolIndicator = container.firstChild as HTMLElement;
    expect(toolIndicator.className).toContain("inline-flex");
    expect(toolIndicator.className).toContain("items-center");
    expect(toolIndicator.className).toContain("gap-2");
    expect(toolIndicator.className).toContain("bg-neutral-50");
    expect(toolIndicator.className).toContain("rounded-lg");
    expect(toolIndicator.className).toContain("text-xs");
    expect(toolIndicator.className).toContain("font-mono");
    expect(toolIndicator.className).toContain("border");
  });

  test("text has correct color class", () => {
    const { container } = render(
      <ToolIndicator
        toolName="str_replace_editor"
        state="result"
        args={{ command: "create", path: "/App.jsx" }}
        result="Success"
      />
    );

    const textSpan = container.querySelector("span");
    expect(textSpan?.className).toContain("text-neutral-700");
  });
});
