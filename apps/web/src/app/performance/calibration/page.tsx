import { redirect } from "next/navigation";

import { getDevRequestContext } from "@/server/auth/request-context";
import { resolveCalibrationWorkspaceHref } from "@/server/calibration/calibration-navigation-service";

export const dynamic = "force-dynamic";

export default async function CalibrationWorkspacePage() {
  const context = await getDevRequestContext();
  const href = await resolveCalibrationWorkspaceHref(context);

  redirect(href);
}
