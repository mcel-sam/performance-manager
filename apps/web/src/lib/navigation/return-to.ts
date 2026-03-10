const RETURN_TO_PARAM = "returnTo";

export function withReturnTo(href: string, returnTo: string | null | undefined): string {
  const normalizedReturnTo = normalizeReturnTo(returnTo);
  if (!normalizedReturnTo) {
    return href;
  }

  const url = new URL(href, "http://local");
  url.searchParams.set(RETURN_TO_PARAM, normalizedReturnTo);

  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}

export function resolveReturnTo(
  returnTo: string | null | undefined,
  fallbackHref: string,
): string {
  return normalizeReturnTo(returnTo) ?? fallbackHref;
}

export function getBackLabelForHref(href: string, fallbackLabel: string): string {
  const path = href.split("?")[0] ?? href;

  switch (path) {
    case "/":
      return "Back to Home";
    case "/performance/reviews":
      return "Back to Reviews";
    case "/performance/team-reviews":
      return "Back to My Team";
    case "/performance/improvement-plans":
      return "Back to Plans";
    case "/admin/performance/calibration":
      return "Back to Calibration";
    case "/admin/performance/reporting":
      return "Back to Reporting";
    default:
      return fallbackLabel;
  }
}

export function getReturnToParam(searchParams: URLSearchParams | ReadonlyURLSearchParamsLike): string | null {
  const value = searchParams.get(RETURN_TO_PARAM);
  return normalizeReturnTo(value);
}

interface ReadonlyURLSearchParamsLike {
  get(name: string): string | null;
}

function normalizeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
