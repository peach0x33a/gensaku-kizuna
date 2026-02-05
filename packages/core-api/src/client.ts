import { AuthManager } from "./auth";
import { getPixivHeaders } from "./utils";
import type {
  Illust,
  IllustListResponse,
  UgoiraMetadata,
  UserDetail,
  UserListResponse
} from "./models";

export class PixivClient {
  private accessToken?: string;
  private refreshToken?: string;
  private expiresAt?: number;

  constructor(refreshToken?: string) {
    this.refreshToken = refreshToken;
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
  }

  private async ensureAuth() {
    if (!this.refreshToken) {
      throw new Error("Refresh token is required for PixivClient");
    }

    // Refresh if no token or expired (with 1 min buffer)
    if (!this.accessToken || !this.expiresAt || Date.now() > this.expiresAt - 60000) {
      console.log("Refreshing Pixiv access token...");
      const data = await AuthManager.refresh(this.refreshToken);
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = Date.now() + data.expires_in * 1000;
    }
  }

  private async request<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    await this.ensureAuth();

    const url = new URL(`https://app-api.pixiv.net${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }

    const response = await fetch(url.toString(), {
      headers: getPixivHeaders(this.accessToken),
      verbose: true,
    } as RequestInit);

    if (response.status === 401) {
      // Force refresh and retry once
      this.accessToken = undefined;
      await this.ensureAuth();
      const retryResponse = await fetch(url.toString(), {
        headers: getPixivHeaders(this.accessToken),
        verbose: true,
      } as RequestInit);
      if (!retryResponse.ok) throw new Error(`Pixiv API Error: ${retryResponse.status}`);
      return retryResponse.json() as Promise<T>;
    }

    if (!response.ok) {
      const err = await response.text();
      console.error(`Pixiv API Request Failed: ${path}`, { status: response.status, body: err });
      throw new Error(`Pixiv API Error: ${response.status} ${err}`);
    }

    return response.json() as Promise<T>;
  }

  async getUserIllusts(userId: string | number, type: "illust" | "manga" = "illust"): Promise<IllustListResponse> {
    return this.request("/v1/user/illusts", { user_id: userId, type });
  }

  async getIllustFollow(restrict: "public" | "private" = "public"): Promise<IllustListResponse> {
    return this.request("/v1/illust/follow", { restrict });
  }

  async getIllustDetail(illustId: string | number): Promise<{ illust: Illust }> {
    return this.request("/v1/illust/detail", { illust_id: illustId });
  }

  async getUgoiraMetadata(illustId: string | number): Promise<UgoiraMetadata> {
    return this.request("/v1/ugoira/metadata", { illust_id: illustId });
  }

  async getUserDetail(userId: string | number): Promise<UserDetail> {
    return this.request("/v1/user/detail", { user_id: userId });
  }
}
