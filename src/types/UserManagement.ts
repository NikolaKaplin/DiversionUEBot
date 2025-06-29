export type DVUser = {
  image: string;
  email: string;
  fullName: string;
  id: string;
  name: string;
  tier: UserTier;
};
type UserTier =
  | 'EDUCATION'
  | 'INDIE'
  | 'PROFESSIONAL'
  | 'ENTERPRISE'
  | 'UNKNOWN';
