import CalibrationSessionView from "@/components/calibration/calibration-session-view";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getCalibrationSessionData } from "@/server/calibration/calibration-session-service";

export const dynamic = "force-dynamic";

interface CalibrationSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function CalibrationSessionPage({ params }: CalibrationSessionPageProps) {
  const { sessionId } = await params;
  const context = await getDevRequestContext();
  const data = await getCalibrationSessionData(sessionId, context);

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <CalibrationSessionView
        sessionId={sessionId}
        auth={{ userId: context.userId, orgId: context.orgId }}
        initialData={data}
      />
    </div>
  );
}
