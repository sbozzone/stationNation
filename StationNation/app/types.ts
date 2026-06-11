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
  | '10_EmptyState'
  | '11_Settings';

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
  distanceMiles?: number; // computed from real GPS coords when available
  cleanlinessTier: CleanlinessTier;
  score: number;
  ratingCount: number;
  freshnessHours: number; // Hours since confirmed
  safetyBadges: SafetyBadge[];
  subRatings: SubRatings;
  reviews: Review[];
  latitude: number; // real GPS latitude (NUMERIC 9,6) or 0-100 mock percentage
  longitude: number; // real GPS longitude (NUMERIC 9,6) or 0-100 mock percentage
}

export type TransitionType =
  | 'push-left'
  | 'push-right'
  | 'push-up'
  | 'move-in-bottom'
  | 'dissolve'
  | 'instant';
