import { NextRequest, NextResponse } from "next/server";
import { exchangeTwitchCode, getTwitchUserInfo } from "@/lib/twitch-auth";
import { createStreamer, getStreamerByTwitchId } from "@/lib/db-queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/auth?error=access_denied", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=no_code", request.url));
  }

  try {
    // Trocar code por access token
    const tokenData = await exchangeTwitchCode(code);
    const { access_token } = tokenData;

    // Buscar informações do usuário
    const userInfo = await getTwitchUserInfo(access_token);

    if (!userInfo) {
      return NextResponse.redirect(new URL("/auth?error=no_user", request.url));
    }

    // Persistir streamer se não existir
    const existing = await getStreamerByTwitchId(userInfo.id);
    if (!existing) {
      await createStreamer({
        id: userInfo.id,
        twitchId: userInfo.id,
        name: userInfo.display_name || userInfo.login,
        twitchUsername: userInfo.login,
        avatar: userInfo.profile_image_url,
        bio: userInfo.description || "",
        twitchUrl: `https://twitch.tv/${userInfo.login}`,
        followers: userInfo.view_count?.toString() || "0",
      });
    }

    // Criar resposta com dados do usuário e redirecionar
    const response = NextResponse.redirect(new URL("/admin", request.url));

    // Armazenar dados na sessão (em um app real, use JWT ou cookies seguros)
    const sessionData = {
      id: userInfo.id,
      name: userInfo.display_name || userInfo.login,
      twitchUsername: userInfo.login,
      avatar: userInfo.profile_image_url,
      bio: userInfo.description || "",
      twitchUrl: `https://twitch.tv/${userInfo.login}`,
      followers: userInfo.view_count?.toString() || "0",
      accessToken: access_token,
      broadcasterType: userInfo.broadcaster_type,
      createdAt: userInfo.created_at,
    };

    // Armazenar em cookie (em produção, use cookies httpOnly e secure)
    response.cookies.set("twitch_session", JSON.stringify(sessionData), {
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      httpOnly: false, // Em produção, use httpOnly: true
    });

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth?error=callback_error", request.url)
    );
  }
}
