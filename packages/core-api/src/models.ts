export interface User {
  id: string;
  name: string;
  account: string;
  profile_image_urls: {
    medium: string;
  };
  is_followed?: boolean;
}

export interface Illust {
  id: string;
  title: string;
  type: "illust" | "manga" | "ugoira";
  image_urls: {
    square_medium: string;
    medium: string;
    large: string;
  };
  caption: string;
  restrict: number;
  user: User;
  tags: Array<{
    name: string;
    translated_name?: string;
  }>;
  tools: string[];
  create_date: string;
  page_count: number;
  width: number;
  height: number;
  sanity_level: number;
  x_restrict: number;
  series?: {
    id: number;
    title: string;
  };
  meta_single_page: {
    original_image_url?: string;
  };
  meta_pages: Array<{
    image_urls: {
      square_medium: string;
      medium: string;
      large: string;
      original: string;
    };
  }>;
  total_view: number;
  total_bookmarks: number;
  is_bookmarked: boolean;
  visible: boolean;
  is_muted: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface UgoiraMetadata {
  ugoira_metadata: {
    zip_urls: {
      medium: string;
    };
    frames: Array<{
      file: string;
      delay: number;
    }>;
  };
}

export interface UserDetail {
  user: User;
  profile: {
    webpage: string;
    gender: string;
    birth: string;
    birth_day: string;
    birth_year: number;
    region: string;
    address_id: number;
    country_code: string;
    job: string;
    job_id: number;
    total_follow_users: number;
    total_mypixiv_users: number;
    total_illusts: number;
    total_manga: number;
    total_novels: number;
    total_illust_bookmarks_public: number;
    total_illust_series: number;
    total_novel_series: number;
    background_image_url: string;
    twitter_account: string;
    twitter_url: string;
    pawoo_url: string;
    is_premium: boolean;
    is_using_custom_profile_image: boolean;
  };
  profile_publicity: {
    gender: string;
    region: string;
    birth_day: string;
    birth_year: string;
    job: string;
    pawoo: boolean;
  };
  workspace: Record<string, unknown>;
}

export interface IllustListResponse {
  illusts: Illust[];
  next_url?: string;
}

export interface UserListResponse {
  user_previews: Array<{
    user: User;
    illusts: Illust[];
    novels: unknown[];
    is_muted: boolean;
  }>;
  next_url?: string;
}
