export type ScreenId =
  | '00_Splash'
  | '01a_Intro'
  | '01b_Location'
  | '01c_Avatar'
  | '03_MapHome'
  | '04_FilterSheet'
  | '05_StationDetail'
  | '06_Rate_Step1'
  | '07_Rate_Step2'
  | '08_Rate_Confirm'
  | '09_Profile'
  | '10_EmptyState';

export type CleanlinessTier = 'clean' | 'mixed' | 'gross' | 'unrated';

export type SafetyBadge =
  | 'Lot well lit'
  | 'Indoor entrance'
  | 'Outdoor entrance'
  | 'Staff on site'
  | 'Visible from road'
  | '24/7';

export interface Review {
  id: string;
  username: string;
  avatarInitials: string;
  timestamp: string;
  text: string;
  score: number;
  helpfulCount: number;
  userVoted?: 'up' | 'down' | null;
}

export interface SubRatings {
  clean: number;
  friendly: number;
  convenient: number;
}

export interface Station {
  id: string;
  name: string;
  distance: string;
  cleanlinessTier: CleanlinessTier;
  score: number;
  ratingCount: number;
  freshnessHours: number; // Hours since confirmed
  safetyBadges: SafetyBadge[];
  subRatings: SubRatings;
  reviews: Review[];
  latitude: number; // percentage from top of map region (0-100)
  longitude: number; // percentage from left of map region (0-100)
}

export type TransitionType =
  | 'push-left'
  | 'push-right'
  | 'push-up'
  | 'move-in-bottom'
  | 'dissolve'
  | 'instant';
