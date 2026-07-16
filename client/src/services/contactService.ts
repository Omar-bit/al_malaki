import type {
  ContactMessage,
  CreateContactMessagePayload,
  UpdateContactMessageStatusPayload,
} from '../types/contact';
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

export async function createContactMessage(
  payload: CreateContactMessagePayload,
): Promise<ContactMessage> {
  const response = await fetch(`${API_BASE_URL}/contact-messages`, {
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

  return (await response.json()) as ContactMessage;
}

export async function getMyContactMessages(): Promise<ContactMessage[]> {
  const response = await fetch(`${API_BASE_URL}/contact-messages/my`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ContactMessage[];
}

export async function getAllContactMessages(): Promise<ContactMessage[]> {
  const response = await fetch(`${API_BASE_URL}/contact-messages/admin/all`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ContactMessage[];
}

export async function getContactMessageById(id: string): Promise<ContactMessage> {
  const response = await fetch(`${API_BASE_URL}/contact-messages/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as ContactMessage;
}

export async function updateContactMessageStatus(
  id: string,
  payload: UpdateContactMessageStatusPayload,
): Promise<ContactMessage> {
  const response = await fetch(`${API_BASE_URL}/contact-messages/${id}/status`, {
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

  return (await response.json()) as ContactMessage;
}
