import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpHint } from "@/components/ui/help-hint";
import { Modal } from "@/components/ui/modal";
import { SectionContainer } from "@/components/ui/section-container";
import { StatusChip } from "@/components/ui/status-chip";
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

  it("renders status chip with marker and label", () => {
    const html = renderToStaticMarkup(
      createElement(StatusChip, { tone: "success" }, "Submitted"),
    );

    expect(html).toContain("Submitted");
    expect(html).toContain("rounded-full");
  });

  it("renders section container with children", () => {
    const html = renderToStaticMarkup(
      createElement(SectionContainer, null, "Section content"),
    );

    expect(html).toContain("Section content");
    expect(html).toContain("rounded-[var(--radius-lg)]");
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
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain("Second");
  });

  it("renders drawer content in an aside", () => {
    const html = renderToStaticMarkup(
      createElement(Drawer, {
        title: "Context",
        description: "Drawer details",
      }),
    );

    expect(html).toContain("<aside");
    expect(html).toContain("Context");
    expect(html).toContain("Drawer details");
  });

  it("renders toast messages with status role", () => {
    const html = renderToStaticMarkup(
      createElement(Toast, { variant: "success" }, "Saved successfully."),
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Saved successfully.");
  });

  it("renders help hint toggle with accessible attributes", () => {
    const html = renderToStaticMarkup(
      createElement(HelpHint, { label: "Submit guidance" }, "Submit is final."),
    );

    expect(html).toContain("Submit guidance");
    expect(html).toContain('aria-label="Toggle help for Submit guidance"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders help hint content expanded when defaultOpen is true", () => {
    const html = renderToStaticMarkup(
      createElement(
        HelpHint,
        {
          label: "Packet visibility",
          defaultOpen: true,
        },
        "Managers and HR can view in-progress packets.",
      ),
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-hidden="false"');
    expect(html).toContain("Managers and HR can view in-progress packets.");
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
