import { archiveCounterController } from "@api/internal/counters/counters.controller";

export async function POST(
  request: Request,
  context: { params: Promise<{ counterId: string }> }
) {
  const { counterId } = await context.params;
  return archiveCounterController(request as never, counterId);
}
