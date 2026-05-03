export interface User {
  id: number;
  name: string;
  email: string;
  birth_date?: string | null;
  avatar_url?: string | null;
  notifications_enabled: boolean;
}

export interface Relationship {
  id: number;
  title: string;
  tagline: string | null;
  partner_one_name: string;
  partner_two_name: string;
  started_at: string;
  future_children_slots: number;
  children?: Array<{
    id: number | null;
    name: string;
    birth_date: string | null;
    photo_url: string | null;
  }>;
  home_quote: string | null;
  family_tree?: {
    partner_one: {
      id: number | null;
      name: string;
      role: string;
      birth_date?: string | null;
      avatar_url?: string | null;
    };
    partner_two: {
      id: number | null;
      name: string;
      role: string;
      birth_date?: string | null;
      avatar_url?: string | null;
    };
    future_children_slots: number;
    children?: Array<{
      id: number | null;
      name: string;
      birth_date: string | null;
      photo_url: string | null;
    }>;
  };
}

export interface SessionPayload {
  user: User;
  relationship: Relationship | null;
}

export interface AuthProfileOption {
  id: number;
  name: string;
}

export interface AuthOptionsPayload {
  requires_setup: boolean;
  users: AuthProfileOption[];
}

export interface MemoryReminder {
  id: number;
  text: string;
  date: string | null;
  media_url: string | null;
  source: "memory" | "journal";
}

export interface DashboardData {
  relationship: Relationship & {
    days_together: number | null;
    next_milestone: {
      label: string;
      date: string;
      days_remaining: number;
    } | null;
  };
  current_user: {
    id: number;
    name: string;
    avatar_url?: string | null;
    today_mood: string | null;
  };
  partner: {
    id: number;
    name: string;
    avatar_url?: string | null;
    today_mood: string | null;
  } | null;
  memory_reminders: MemoryReminder[];
}

export interface UpcomingBirthday {
  type: "partner" | "child";
  id: number | null;
  name: string;
  photo: string | null;
  next_birthday_date: string;
  days_left: number;
}

export interface JournalEntry {
  id: number;
  author: string;
  author_id: number;
  mood: "love" | "happy" | "miss" | "grateful";
  text: string;
  date: string;
  time: string;
  created_at: string;
  editable_until: string;
  can_edit: boolean;
  can_delete: boolean;
  media: Array<{
    id: number;
    type: "image" | "video";
    url: string;
    mime_type: string | null;
    size: number;
  }>;
}

export interface MemoryItem {
  id: number;
  author: string;
  author_id: number;
  type: "image" | "video";
  caption: string | null;
  description: string | null;
  date: string;
  likes: number;
  url: string;
  mime_type: string | null;
  size: number;
  can_manage: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemoriesResponse {
  count: number;
  items: MemoryItem[];
}

export interface AnonymousMessage {
  id: number;
  text: string;
  date: string;
  created_at: string;
  author: string;
}

export interface PromiseItem {
  id: number;
  text: string;
  author: string;
  date: string;
  created_at: string;
}

export interface MessageCapsule {
  id: number;
  unlock_date: string;
  is_locked: boolean;
  days_until_unlock: number;
  preview: string;
  message: string | null;
  author: string;
  opened_at: string | null;
  created_at: string;
}
