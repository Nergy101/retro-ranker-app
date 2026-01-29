import PocketBase, {
  ClientResponseError,
  ListResult,
  RecordModel,
} from "pocketbase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OAuthCreateData } from "../../types/auth.contract";

const POCKETBASE_URL =
  process.env.EXPO_PUBLIC_POCKETBASE_URL ||
  "https://pocketbase.retroranker.site";

/**
 * PocketBaseService - A service to interface with PocketBase in React Native
 * Uses AsyncStorage for auth persistence
 */
export class PocketBaseService {
  private pb: PocketBase;
  private static instance: PocketBaseService | null = null;
  private static initPromise: Promise<void> | null = null;
  private initialized: boolean = false;

  /**
   * Constructor for PocketBaseService
   * @param url The URL of your PocketBase instance
   */
  private constructor(url: string) {
    this.pb = new PocketBase(url);

    // Disable auto-cancellation for React Native
    this.pb.autoCancellation(false);

    // Configure auth store to use AsyncStorage
    this.pb.authStore.onChange((token, model) => {
      if (token && model) {
        AsyncStorage.setItem("pb_auth", JSON.stringify({ token, model }));
      } else {
        AsyncStorage.removeItem("pb_auth");
      }
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PocketBaseService {
    if (!PocketBaseService.instance) {
      PocketBaseService.instance = new PocketBaseService(POCKETBASE_URL);
      // Start loading auth from storage (tracked by initPromise)
      PocketBaseService.initPromise = PocketBaseService.instance
        .loadAuthFromStorage()
        .catch((err) => {
          console.error("Failed to load auth from storage:", err);
        });
    }
    return PocketBaseService.instance;
  }

  /**
   * Wait for the service to be fully initialized (auth loaded from storage)
   * Call this before making authenticated requests on cold start
   */
  public static async waitForInit(): Promise<void> {
    if (PocketBaseService.initPromise) {
      await PocketBaseService.initPromise;
    }
  }

  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Load auth from AsyncStorage
   */
  private async loadAuthFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem("pb_auth");
      if (stored) {
        const { token, model } = JSON.parse(stored);
        this.pb.authStore.save(token, model);
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error loading auth from storage:", error);
      this.initialized = true; // Mark as initialized even on error
    }
  }

  /**
   * Get the PocketBase instance
   * @returns PocketBase instance
   */
  public getPocketBaseClient(): PocketBase {
    return this.pb;
  }

  /**
   * Authenticate a user with nickname and password
   * @param nickname User nickname
   * @param password User password
   * @returns Authentication data
   */
  public async authWithPassword(
    nickname: string,
    password: string,
  ): Promise<any> {
    try {
      const result = await this.pb
        .collection("users")
        .authWithPassword(nickname, password);
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error("Authentication error:", error.message);
      }
      throw error;
    }
  }

  /**
   * Authenticate with OAuth2
   * @param provider OAuth provider name
   * @param code Authorization code
   * @param codeVerifier PKCE code verifier
   * @param redirectUrl Redirect URL
   * @param createData Additional user data
   * @returns Authentication data
   */
  public async authWithOAuth2Code(
    provider: string,
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    createData?: OAuthCreateData,
  ): Promise<any> {
    try {
      const result = await this.pb
        .collection("users")
        .authWithOAuth2Code(
          provider,
          code,
          codeVerifier,
          redirectUrl,
          createData,
        );
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error("OAuth2 error:", {
          message: error.message,
          status: error.status,
          url: error.url,
          data: (error as any).data,
          response: (error as any).response,
        });
      }
      throw error;
    }
  }

  /**
   * Register a new user
   * @param nickname User nickname
   * @param password User password
   * @param passwordConfirm Password confirmation
   * @returns Created user data
   */
  public async createUser(
    nickname: string,
    password: string,
    passwordConfirm: string,
  ): Promise<any> {
    try {
      const data = {
        nickname,
        password,
        passwordConfirm,
        emailVisibility: false,
        verified: false,
      };

      const result = await this.pb.collection("users").create(data);
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error("User creation error:", error.message);
      }
      throw error;
    }
  }

  /**
   * Get all records from a collection
   * @param collection Collection name
   * @param options Filter, expand, and sort options
   * @returns Array of records
   */
  public async getAll(
    collection: string,
    options: {
      filter?: string;
      expand?: string;
      sort?: string;
    } = {},
  ): Promise<any[]> {
    try {
      const result = await this.pb.collection(collection).getFullList({
        filter: options.filter || "",
        expand: options.expand || "",
        sort: options.sort || "",
      });
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error(`Error fetching ${collection}:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Fetch records from a collection with pagination
   * @param collection Collection name
   * @param page Page number
   * @param perPage Items per page
   * @param options Filter, sort, and expand options
   * @returns List result with items and pagination info
   */
  public async getList(
    collection: string,
    page: number = 1,
    perPage: number = 50,
    options: {
      filter?: string;
      sort?: string;
      expand?: string;
    } = {},
  ): Promise<ListResult<any>> {
    try {
      const result = await this.pb
        .collection(collection)
        .getList(page, perPage, {
          filter: options.filter || "",
          sort: options.sort || "",
          expand: options.expand || "",
        });
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error(`Error fetching ${collection}:`, {
          message: error.message,
          status: error.status,
          url: error.url,
          response: error.response?.data || error.response,
        });
      } else {
        console.error(`Unexpected error fetching ${collection}:`, error);
      }
      throw error;
    }
  }

  /**
   * Fetch a single record by ID
   * @param collection Collection name
   * @param id Record ID
   * @param expand Expand relations
   * @returns Record data
   */
  public async getOne(
    collection: string,
    id: string,
    expand: string = "",
  ): Promise<RecordModel> {
    try {
      const result = await this.pb.collection(collection).getOne(id, {
        expand,
      });
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error(`Error fetching ${collection} record:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Create a record in a collection
   * @param collection Collection name
   * @param data Record data
   * @returns Created record
   */
  public async create(
    collection: string,
    data: Record<string, any>,
  ): Promise<any> {
    try {
      const result = await this.pb.collection(collection).create(data);
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error(`Error creating ${collection} record:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Update a record in a collection
   * @param collection Collection name
   * @param id Record ID
   * @param data Updated data
   * @returns Updated record
   */
  public async update(
    collection: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any> {
    try {
      const result = await this.pb.collection(collection).update(id, data);
      return result;
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error(`Error updating ${collection} record:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Delete a record from a collection
   * @param collection Collection name
   * @param id Record ID
   * @returns void
   */
  public async delete(collection: string, id: string): Promise<void> {
    try {
      await this.pb.collection(collection).delete(id);
    } catch (error: unknown) {
      if (error instanceof ClientResponseError) {
        console.error(`Error deleting ${collection} record:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Check if a user is authenticated
   * @returns boolean
   */
  public isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  /**
   * Get the current authenticated user data
   * @returns User data or null
   */
  public getCurrentUser(): any {
    return this.pb.authStore.record;
  }

  /**
   * Refresh authentication token
   */
  public async authRefresh(): Promise<void> {
    if (this.pb.authStore.isValid) {
      try {
        await this.pb.collection("users").authRefresh();
      } catch (error) {
        console.error("Error refreshing auth:", error);
        // Clear invalid auth
        this.logout();
      }
    }
  }

  /**
   * Logout the current user
   */
  public logout(): void {
    this.pb.authStore.clear();
    AsyncStorage.removeItem("pb_auth");
  }
}

/**
 * Create a new PocketBase service instance (singleton)
 */
export function createPocketBaseService(): PocketBaseService {
  return PocketBaseService.getInstance();
}
