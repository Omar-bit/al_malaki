import type {
  CreateCategoryPayload,
  CreateProductPayload,
  ProductAnalyticsProduct,
  ProductCategory,
} from '../types/product';
import { ApiError } from './authService';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

type ApiErrorPayload = {
  message?: string | string[];
  code?: string;
};

async function parseError(
  response: Response,
): Promise<{ message: string; code?: string }> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;

    const code =
      typeof payload.code === 'string' && payload.code.trim().length > 0
        ? payload.code.trim()
        : undefined;

    if (Array.isArray(payload.message)) {
      return {
        message: payload.message.join(', '),
        code,
      };
    }

    if (typeof payload.message === 'string') {
      return {
        message: payload.message,
        code,
      };
    }
  } catch {
    // No-op: fallback when response body is not JSON.
  }

  return {
    message: 'Request failed. Please try again.',
  };
}

export async function getProducts(): Promise<ProductAnalyticsProduct[]> {
  const response = await fetch(`${API_BASE_URL}/admin/products`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ProductAnalyticsProduct[];
}

export async function getCategories(): Promise<ProductCategory[]> {
  const response = await fetch(`${API_BASE_URL}/admin/categories`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ProductCategory[];
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<ProductAnalyticsProduct> {
  const response = await fetch(`${API_BASE_URL}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ProductAnalyticsProduct;
}

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<ProductCategory> {
  const response = await fetch(`${API_BASE_URL}/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ProductCategory;
}

export async function uploadProductImages(
  files: File[],
): Promise<{ urls: string[] }> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_BASE_URL}/admin/products/upload-images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  const data = (await response.json()) as { urls: string[] };

  // Convert relative URLs to absolute URLs
  return {
    urls: data.urls.map((url) => {
      if (url.startsWith('http')) return url;
      return `${API_BASE_URL}${url}`;
    }),
  };
}
