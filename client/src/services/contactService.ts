import type {
  ContactMessage,
  ContactMessageReply,
  CreateContactMessagePayload,
  CreateReplyPayload,
  UpdateContactMessageStatusPayload,
} from '../types/contact';
import { api, API_BASE_URL } from './apiClient';

export function createContactMessage(
  payload: CreateContactMessagePayload,
): Promise<ContactMessage> {
  return api.post<ContactMessage>('/contact-messages', payload);
}

export function getMyContactMessages(): Promise<ContactMessage[]> {
  return api.get<ContactMessage[]>('/contact-messages/my');
}

export function getAllContactMessages(): Promise<ContactMessage[]> {
  return api.get<ContactMessage[]>('/contact-messages/admin/all');
}

export function getContactMessageById(id: string): Promise<ContactMessage> {
  return api.get<ContactMessage>(`/contact-messages/${id}`);
}

export function createReply(
  id: string,
  payload: CreateReplyPayload,
): Promise<ContactMessageReply> {
  return api.post<ContactMessageReply>(
    `/contact-messages/${id}/replies`,
    payload,
  );
}

export function createAdminMessagesStream(): EventSource {
  return new EventSource(`${API_BASE_URL}/contact-messages/admin/stream`, {
    withCredentials: true,
  });
}

export function createUserMessagesStream(): EventSource {
  return new EventSource(`${API_BASE_URL}/contact-messages/stream`, {
    withCredentials: true,
  });
}

export function updateContactMessageStatus(
  id: string,
  payload: UpdateContactMessageStatusPayload,
): Promise<ContactMessage> {
  return api.patch<ContactMessage>(`/contact-messages/${id}/status`, payload);
}
