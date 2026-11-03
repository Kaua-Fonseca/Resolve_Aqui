export type Tab = 'overview' | 'users' | 'professionals' | 'reviews' | 'categories' | 'settings';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
};

export type Professional = {
  id: string;
  slug: string;
  city: string;
  isPublished: boolean;
  isVerified: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  categories: { category: { name: string } }[];
};

export type Review = {
  id: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'PUBLISHED' | 'HIDDEN';
  createdAt: string;
  author: { name: string; email: string };
  professional: { id: string; user: { name: string } };
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  groupName: string;
  _count: { professionals: number; services: number };
};

export type Settings = {
  siteName: string;
  supportEmail: string;
  defaultCity: string;
  siteDescription: string;
};

export type Data = {
  users: User[];
  professionals: Professional[];
  reviews: Review[];
  categories: Category[];
  settings: Settings;
  stats: { userCount: number; professionalCount: number; reviewCount: number; pendingCount: number };
};
