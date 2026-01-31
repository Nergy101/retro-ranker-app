import {
  createPocketBaseService,
  PocketBaseService,
} from "../pocketbase/pocketbase.service";
import { OAuthCreateData } from "../../types/auth.contract";
import { User } from "../../types/user.contract";

export class AuthService {
  private pb: PocketBaseService;

  constructor() {
    this.pb = createPocketBaseService();
  }

  /**
   * Sign in with nickname and password
   */
  async signInWithPassword(nickname: string, password: string): Promise<any> {
    try {
      const result = await this.pb.authWithPassword(nickname, password);
      return result;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  /**
   * Sign in with OAuth2 code.
   * If the provider (e.g. Google) does not return a nickname, derives one from
   * the OAuth name or the part before "@" of the email and updates the user.
   */
  async signInWithOAuth(
    provider: "google" | "discord",
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    createData?: OAuthCreateData,
  ): Promise<any> {
    try {
      const result = await this.pb.authWithOAuth2Code(
        provider,
        code,
        codeVerifier,
        redirectUrl,
        createData,
      );

      const nickname = result?.record?.nickname;
      if (!nickname || String(nickname).trim() === "") {
        const email = result?.record?.email ?? "";
        const nameFromOAuth = result?.meta?.name;
        const name =
          nameFromOAuth?.trim() ||
          (email ? email.split("@")[0] : "user");
        const cleanNickname = name.toLowerCase().replace(/\s+/g, "_");
        await this.pb.update("users", result.record.id, {
          nickname: cleanNickname,
        });
        await this.pb.authRefresh();
        return { ...result, record: this.pb.getCurrentUser() };
      }

      return result;
    } catch (error) {
      console.error("OAuth sign in error:", error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  signOut(): void {
    this.pb.logout();
  }

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): User | null {
    return this.pb.getCurrentUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.pb.isAuthenticated();
  }

  /**
   * Refresh authentication token
   */
  async refreshAuth(): Promise<void> {
    await this.pb.authRefresh();
  }

  /**
   * Get PocketBase service instance
   */
  getPocketBaseService(): PocketBaseService {
    return this.pb;
  }
}
