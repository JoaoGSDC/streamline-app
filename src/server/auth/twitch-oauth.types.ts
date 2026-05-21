export interface TwitchOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string[];
}

export interface TwitchOAuthUserDto {
  id: string;
  login: string;
  displayName: string;
  broadcasterType: string;
  description: string;
  profileImageUrl: string;
  viewCount: number;
  createdAt: string;
}

export interface TwitchOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
