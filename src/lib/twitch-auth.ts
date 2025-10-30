interface TwitchUserInfo {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

export const TWITCH_CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
export const TWITCH_REDIRECT_URI =
  process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI ||
  "http://localhost:3000/api/auth/twitch/callback";

// Gerar URL de autorização Twitch
export const getTwitchAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: "code",
    scope: "user:read:email",
    state: generateRandomString(),
  });

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
};

// Trocar code por access token
export const exchangeTwitchCode = async (code: string): Promise<any> => {
  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: TWITCH_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code");
    }

    return response.json();
  } catch (error) {
    console.error("Error exchanging Twitch code:", error);
    throw error;
  }
};

// Buscar informações do usuário do Twitch
export const getTwitchUserInfo = async (
  accessToken: string
): Promise<TwitchUserInfo | null> => {
  try {
    const response = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error("Error getting Twitch user info:", error);
    return null;
  }
};

const generateRandomString = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
