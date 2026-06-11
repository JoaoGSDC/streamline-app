import {
  raffleStreamController,
} from "@api/internal/raffles/raffles.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return raffleStreamController(request as never, id);
}
