import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";

describe("ui foundation primitives", () => {
  it("renders empty state title and description", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        title: "No data",
        description: "Create an item to continue.",
      }),
    );

    expect(html).toContain("No data");
    expect(html).toContain("Create an item to continue.");
  });

  it("renders tabs with the selected tab marked", () => {
    const html = renderToStaticMarkup(
      createElement(Tabs, {
        tabs: [
          { value: "first", label: "First" },
          { value: "second", label: "Second" },
        ],
        value: "second",
        onValueChange: () => {},
      }),
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("Second");
  });

  it("renders toast messages with status role", () => {
    const html = renderToStaticMarkup(
      createElement(Toast, { variant: "success" }, "Saved successfully."),
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Saved successfully.");
  });

  it("does not render modal markup when closed", () => {
    const html = renderToStaticMarkup(
      createElement(Modal, {
        open: false,
        title: "Hidden",
      }),
    );

    expect(html).toBe("");
  });
});
