import {
  createPocketBaseService,
  PocketBaseService,
} from "../pocketbase/pocketbase.service";
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
   * Sign in with OAuth2 code
   */
  async signInWithOAuth(
    provider: "google" | "discord",
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    createData?: Record<string, any>,
  ): Promise<any> {
    try {
      const result = await this.pb.authWithOAuth2Code(
        provider,
        code,
        codeVerifier,
        redirectUrl,
        createData,
      );
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
