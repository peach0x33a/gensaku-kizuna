import { getPixivHeaders } from "./utils";
import type { AuthResponse } from "./models";

const CLIENT_ID = "MOBrBDS8blbauoSck0ZfDbtuzpyT";
const CLIENT_SECRET = "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj";
const AUTH_URL = "https://oauth.secure.pixiv.net/auth/token";

export class AuthManager {
  static async refresh(refreshToken: string): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);
    formData.append("client_id", CLIENT_ID);
    formData.append("client_secret", CLIENT_SECRET);

    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        ...getPixivHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      verbose: true,
    } as RequestInit);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pixiv Auth Error: ${response.status} ${error}`);
    }

    return response.json() as Promise<AuthResponse>;
  }
}
