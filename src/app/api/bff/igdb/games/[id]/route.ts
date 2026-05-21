import { getIgdbGameDetailsController } from "@api/bff/igdb/igdb.controller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return getIgdbGameDetailsController(id);
}
