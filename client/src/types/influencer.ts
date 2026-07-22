export interface InfluencerTrackingItem {
  id: string;
  influencerName: string;
  influencerHandle?: string;
  code: string;
  trackingUrl: string;
  destinationPath: string;
  notes?: string;
  status: 'active' | 'disabled';
  clicks: number;
  accountsCreated: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface InfluencerTrackingStats {
  totalClicks: number;
  totalAccounts: number;
  totalOrders: number;
  totalRevenue: number;
  activeLinks: number;
}

export interface CreateInfluencerTrackingPayload {
  influencerName: string;
  influencerHandle?: string;
  destinationPath?: string;
  notes?: string;
}

export interface InfluencerTrackingFilters {
  search?: string;
  status?: 'active' | 'disabled';
  sortBy?:
    | 'createdAt'
    | 'influencerName'
    | 'clicks'
    | 'accountsCreated'
    | 'orders'
    | 'revenue'
    | 'conversionRate';
  sortOrder?: 'asc' | 'desc';
}
