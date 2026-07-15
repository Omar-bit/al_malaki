export interface ProductAnalyticsProduct {
  id: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  primaryPlacement?: string;
  collection?: string;
  promoCode?: string;
  campaign?: string;
  status: 'active' | 'hidden';
  performance: 'new arrival' | 'recommended' | 'featured';
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  totalSales?: number;
  trend?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  image?: string;
  color?: string;
}

export interface CreateProductPayload {
  name: string;
  categoryId: string;
  brand?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  images?: string[];
  primaryPlacement?: string;
  collection?: string;
  promoCode?: string;
  campaign?: string;
  status: 'active' | 'hidden';
  performance: 'new arrival' | 'recommended' | 'featured';
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CreateCategoryPayload {
  name: string;
  image?: string;
  color?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  image?: string;
  color?: string;
}
