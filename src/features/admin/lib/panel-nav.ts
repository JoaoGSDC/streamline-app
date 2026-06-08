import {
  getChildFeatures,
  getTopLevelFeatures,
  OWNER_ONLY_FEATURE_KEYS,
  type PanelFeature,
} from "@/config/panel-features";

export function isAdminPathActive(pathname: string, route: string): boolean {
  const path = pathname.split("?")[0];
  if (route === "/admin") return path === "/admin";
  return path === route || path.startsWith(`${route}/`);
}

export function getVisibleTopLevelFeatures(
  isEnabled: (featureKey: string) => boolean,
  isOwner: boolean
): PanelFeature[] {
  return getTopLevelFeatures().filter((feature) => {
    if (!isEnabled(feature.key)) return false;
    if (OWNER_ONLY_FEATURE_KEYS.has(feature.key) && !isOwner) return false;
    return true;
  });
}

export function getVisibleChildFeatures(
  parentKey: string,
  isEnabled: (featureKey: string) => boolean
): PanelFeature[] {
  return getChildFeatures(parentKey).filter(
    (feature) => isEnabled(feature.key) && Boolean(feature.route)
  );
}
