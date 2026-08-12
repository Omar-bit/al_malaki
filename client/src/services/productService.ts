import type {
  CreateCategoryPayload,
  CreateProductPayload,
  ProductAnalyticsProduct,
  ProductCategory,
  UpdateCategoryPayload,
} from '../types/product';
import { api } from './apiClient';
import { resolveAssetUrl } from '../utils/url';

export function getProducts(): Promise<ProductAnalyticsProduct[]> {
  return api.get<ProductAnalyticsProduct[]>('/admin/products');
}

export function getCategories(): Promise<ProductCategory[]> {
  return api.get<ProductCategory[]>('/admin/categories');
}

export function getLandingProducts(): Promise<ProductAnalyticsProduct[]> {
  return api.get<ProductAnalyticsProduct[]>('/public/products/landing');
}

export function getPublicProducts(): Promise<ProductAnalyticsProduct[]> {
  return api.get<ProductAnalyticsProduct[]>('/public/products');
}

export function getPublicCategories(): Promise<ProductCategory[]> {
  return api.get<ProductCategory[]>('/public/categories');
}

export function getPublicProduct(
  slug: string,
): Promise<ProductAnalyticsProduct> {
  return api.get<ProductAnalyticsProduct>(`/public/products/${slug}`);
}

export function createProduct(
  payload: CreateProductPayload,
): Promise<ProductAnalyticsProduct> {
  return api.post<ProductAnalyticsProduct>('/admin/products', payload);
}

export function updateProduct(
  id: string,
  payload: Partial<CreateProductPayload>,
): Promise<ProductAnalyticsProduct> {
  return api.patch<ProductAnalyticsProduct>(`/admin/products/${id}`, payload);
}

export function deleteProduct(id: string): Promise<void> {
  return api.delete(`/admin/products/${id}`);
}

export function createCategory(
  payload: CreateCategoryPayload,
): Promise<ProductCategory> {
  return api.post<ProductCategory>('/admin/categories', payload);
}

export function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ProductCategory> {
  return api.patch<ProductCategory>(`/admin/categories/${id}`, payload);
}

export function deleteCategory(id: string): Promise<void> {
  return api.delete(`/admin/categories/${id}`);
}

export async function uploadCategoryImage(
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const data = await api.post<{ url: string }>(
    '/admin/categories/upload-image',
    formData,
  );
  return { url: resolveAssetUrl(data.url) };
}

export async function uploadProductImages(
  files: File[],
): Promise<{ urls: string[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const data = await api.post<{ urls: string[] }>(
    '/admin/products/upload-images',
    formData,
  );
  return { urls: data.urls.map((url) => resolveAssetUrl(url)) };
}
