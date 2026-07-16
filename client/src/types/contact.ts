export type MessageStatus = 'UNREAD' | 'READ' | 'RESPONDED';

export interface ContactMessage {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateContactMessagePayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  message: string;
}

export interface UpdateContactMessageStatusPayload {
  status: MessageStatus;
}
