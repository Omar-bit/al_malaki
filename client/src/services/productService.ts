import type {
  CreateCategoryPayload,
  CreateProductPayload,
  ProductAnalyticsProduct,
  ProductCategory,
  UpdateCategoryPayload,
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

export async function getPublicProducts(): Promise<ProductAnalyticsProduct[]> {
  const response = await fetch(`${API_BASE_URL}/public/products`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ProductAnalyticsProduct[];
}

export async function getPublicCategories(): Promise<ProductCategory[]> {
  const response = await fetch(`${API_BASE_URL}/public/categories`, {
    method: 'GET',
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

export async function updateProduct(
  id: string,
  payload: Partial<CreateProductPayload>,
): Promise<ProductAnalyticsProduct> {
  const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'PATCH',
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

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }
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

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ProductCategory> {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ProductCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }
}

export async function uploadCategoryImage(
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(
    `${API_BASE_URL}/admin/categories/upload-image`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  const data = (await response.json()) as { url: string };
  return {
    url: data.url.startsWith('http')
      ? data.url
      : `${API_BASE_URL}${data.url}`,
  };
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
