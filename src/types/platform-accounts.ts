
export interface PlatformAccount {
  id: string;
  user_id: string;
  platform_id: string;
  account_name: string;
  account_identifier: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
}
