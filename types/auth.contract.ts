/**
 * Optional user data passed when creating/linking a user via OAuth.
 * PocketBase accepts optional fields for the users collection.
 */
export interface OAuthCreateData {
  name?: string;
  nickname?: string;
  avatar?: string;
  [key: string]: string | number | boolean | null | undefined;
}
