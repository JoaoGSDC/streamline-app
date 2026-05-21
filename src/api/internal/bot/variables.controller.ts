import { BOT_VARIABLES } from "@server/bot/bot.validators";
import { jsonSuccess } from "@api/shared/api-response";

export async function listBotVariablesController() {
  return jsonSuccess({ variables: BOT_VARIABLES });
}
