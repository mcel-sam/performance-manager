import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  ensureDemoSetup,
  loginAsCalibrator,
  loginAsEmployee,
  loginAsHrAdmin,
  loginAsManager,
} from "./helpers/demo";

interface RouteScenario {
  route: string;
  label: string;
}

interface RoleScenario {
  role: "HR_ADMIN" | "MANAGER" | "EMPLOYEE" | "CALIBRATOR";
  login: (page: Page) => Promise<void>;
  routes: RouteScenario[];
}

interface AuditResult {
  role: RoleScenario["role"];
  route: string;
  label: string;
  activeNavCount: number;
  hasPageHeader: boolean;
  viewportOverflow: boolean;
  brokenEmptyStates: number;
  hasUndefinedText: boolean;
  screenshotPath: string;
}

const roleScenarios: RoleScenario[] = [
  {
    role: "HR_ADMIN",
    login: loginAsHrAdmin,
    routes: [
      { route: "/", label: "Home" },
      { route: "/admin/performance/review-cycles", label: "Review cycles" },
      { route: "/admin/performance/reporting?tab=progress", label: "Reporting" },
    ],
  },
  {
    role: "MANAGER",
    login: loginAsManager,
    routes: [
      { route: "/performance/reviews", label: "Review tasks" },
      { route: "/performance/team-reviews", label: "My Team" },
      {
        route: "/performance/reviews/cycle_seed_draft_1/write/submission_seed_employee_manager_1",
        label: "Write review",
      },
    ],
  },
  {
    role: "EMPLOYEE",
    login: loginAsEmployee,
    routes: [{ route: "/performance/reviews", label: "My reviews" }],
  },
  {
    role: "CALIBRATOR",
    login: loginAsCalibrator,
    routes: [
      {
        route: "/performance/calibration/calibration_session_seed_1",
        label: "Calibration session",
      },
    ],
  },
];

const results: AuditResult[] = [];

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test.afterAll(async () => {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const reportDir = path.join(repoRoot, "docs", "ux");
  await mkdir(reportDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const passedCount = results.filter(
    (result) =>
      result.activeNavCount <= 1 &&
      result.hasPageHeader &&
      !result.viewportOverflow &&
      result.brokenEmptyStates === 0 &&
      !result.hasUndefinedText,
  ).length;

  const reportLines = [
    "# UX Audit Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    `Routes audited: ${results.length}`,
    `Passed checks: ${passedCount}`,
    "",
    "## Checks",
    "- Single active nav item (`aria-current=\"page\"`) per route",
    "- Visible page header (`main h1` exists)",
    "- No viewport overflow (`scrollWidth <= clientWidth + 1`)",
    "- No broken empty states (`section.border-dashed` requires title + description)",
    "- No visible `undefined` placeholder text",
    "",
    "## Route Results",
    "| Role | Route | Label | Active nav | Header | Overflow | Broken empty states | Undefined text | Screenshot |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...results.map((result) => {
      const headerStatus = result.hasPageHeader ? "yes" : "no";
      const overflowStatus = result.viewportOverflow ? "yes" : "no";
      const brokenEmptyStateStatus = result.brokenEmptyStates === 0 ? "no" : String(result.brokenEmptyStates);
      const undefinedStatus = result.hasUndefinedText ? "yes" : "no";
      return `| ${result.role} | \`${result.route}\` | ${result.label} | ${result.activeNavCount} | ${headerStatus} | ${overflowStatus} | ${brokenEmptyStateStatus} | ${undefinedStatus} | \`${result.screenshotPath}\` |`;
    }),
    "",
  ];

  await writeFile(
    path.join(reportDir, "UX_AUDIT_REPORT.md"),
    reportLines.join("\n"),
    "utf8",
  );
});

test("@ux captures screenshots and validates core layout checks", async ({
  page,
}) => {
  test.setTimeout(180_000);

  const screenshotDir = path.join(
    process.cwd(),
    "test-results",
    "ux-audit",
  );
  await mkdir(screenshotDir, { recursive: true });

  for (const scenario of roleScenarios) {
    await page.request.post("/api/demo/logout");
    await scenario.login(page);

    for (const routeScenario of scenario.routes) {
      await page.goto(routeScenario.route);
      await page.waitForLoadState("networkidle");

      const activeNavCount = await page.locator('a[aria-current="page"]').count();
      const hasPageHeader = (await page.locator("main h1").count()) > 0;
      const viewportOverflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth > root.clientWidth + 1;
      });
      const brokenEmptyStates = await page.evaluate(() => {
        const emptyStateCandidates = Array.from(
          document.querySelectorAll("section.border-dashed"),
        );
        return emptyStateCandidates.filter((node) => {
          return (
            node.querySelector("h2") === null || node.querySelector("p") === null
          );
        }).length;
      });
      const hasUndefinedText = await page.evaluate(() =>
        document.body.innerText.toLowerCase().includes("undefined"),
      );

      const screenshotName = `${scenario.role.toLowerCase()}-${toRouteSlug(
        routeScenario.route,
      )}.png`;
      const screenshotAbsolutePath = path.join(screenshotDir, screenshotName);
      await page.screenshot({ path: screenshotAbsolutePath, fullPage: true });

      results.push({
        role: scenario.role,
        route: routeScenario.route,
        label: routeScenario.label,
        activeNavCount,
        hasPageHeader,
        viewportOverflow,
        brokenEmptyStates,
        hasUndefinedText,
        screenshotPath: path
          .relative(process.cwd(), screenshotAbsolutePath)
          .replaceAll("\\", "/"),
      });

      expect(
        activeNavCount,
        `${scenario.role} ${routeScenario.route} should have at most one active nav link`,
      ).toBeLessThanOrEqual(1);
      expect(
        hasPageHeader,
        `${scenario.role} ${routeScenario.route} should render a page header`,
      ).toBe(true);
      expect(
        brokenEmptyStates,
        `${scenario.role} ${routeScenario.route} should not render broken empty states`,
      ).toBe(0);
      expect(
        hasUndefinedText,
        `${scenario.role} ${routeScenario.route} should not render undefined placeholders`,
      ).toBe(false);
    }
  }
});

function toRouteSlug(route: string): string {
  const slug = route
    .replace(/^\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "home";
}
