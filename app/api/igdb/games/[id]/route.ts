import { NextResponse } from "next/server";
import { getGameDetails } from "@/lib/igdb";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const game = await getGameDetails(id);
    if (!game) {
      return NextResponse.json(
        { error: "Jogo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error("IGDB proxy game details error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar jogo na IGDB" },
      { status: 500 }
    );
  }
}
