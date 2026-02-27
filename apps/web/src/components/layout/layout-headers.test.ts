import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";

describe("layout headers", () => {
  it("renders page header content", () => {
    const html = renderToStaticMarkup(
      createElement(PageHeader, {
        eyebrow: "Admin",
        title: "Review Cycles",
        description: "Manage cycle setup.",
      }),
    );

    expect(html).toContain("Admin");
    expect(html).toContain("Review Cycles");
    expect(html).toContain("Manage cycle setup.");
  });

  it("renders section header title and description", () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeader, {
        title: "Modules",
        description: "Choose a workflow.",
      }),
    );

    expect(html).toContain("Modules");
    expect(html).toContain("Choose a workflow.");
  });
});
