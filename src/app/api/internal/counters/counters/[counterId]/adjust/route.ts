import { adjustCounterController } from "@api/internal/counters/counters.controller";

export async function POST(
  request: Request,
  context: { params: Promise<{ counterId: string }> }
) {
  const { counterId } = await context.params;
  return adjustCounterController(request as never, counterId);
}
