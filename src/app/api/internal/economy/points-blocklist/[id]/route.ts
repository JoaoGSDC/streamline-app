import { deleteEconomyPointsBlocklistController } from "@api/internal/economy/economy.controller";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return deleteEconomyPointsBlocklistController(request as never, id);
}
