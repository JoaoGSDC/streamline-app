import { getFeature } from "@/config/panel-features";
import { getResolvedPanelConfigForStreamer } from "@lib/panel-config-db-queries";
import { isFeatureEffectivelyEnabled } from "@server/panel/resolve-panel-config";
import { HttpError } from "@server/utils/http-error";

export async function assertFeatureEnabledForStreamer(
  streamerId: string,
  featureKey: string
): Promise<void> {
  const definition = getFeature(featureKey);
  if (!definition) {
    throw new HttpError("Feature não registrada", 500, "FEATURE_NOT_REGISTERED");
  }

  const config = await getResolvedPanelConfigForStreamer(streamerId);
  if (!isFeatureEffectivelyEnabled(config, featureKey)) {
    throw new HttpError(
      `Funcionalidade "${definition.label}" não está disponível para este canal`,
      403,
      "FEATURE_DISABLED"
    );
  }
}
