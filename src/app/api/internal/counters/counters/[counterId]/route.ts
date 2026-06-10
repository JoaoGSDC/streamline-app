import {
  deleteCounterController,
  getCounterController,
  patchCounterController,
} from "@api/internal/counters/counters.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ counterId: string }> }
) {
  const { counterId } = await context.params;
  return getCounterController(request as never, counterId);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ counterId: string }> }
) {
  const { counterId } = await context.params;
  return patchCounterController(request as never, counterId);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ counterId: string }> }
) {
  const { counterId } = await context.params;
  return deleteCounterController(request as never, counterId);
}
