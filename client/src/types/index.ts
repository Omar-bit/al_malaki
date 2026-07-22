export interface Product {
  id: string;
  name: string;
  image: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export type {
  AuthCredentials,
  AuthResponse,
  AuthUser,
  RegisterPayload,
  RegisterResponse,
  RequestRegisterOtpPayload,
  RequestRegisterOtpResponse,
  VerifyRegisterOtpPayload,
  UpdateProfilePayload,
  UpdateProfileResponse,
} from './auth';


export type {
  AcceptAdminInvitationPayload,
  AcceptAdminInvitationResponse,
  AdminInvitation,
  AdminInvitationStatus,
  AdminTeamMember,
  CreateAdminInvitationPayload,
  CreateAdminInvitationResponse,
  DeleteAdminInvitationResponse,
  TeamRole,
} from './admin';

export type { ProductAnalyticsProduct, ProductCategory } from './product';

export type {
  PromoCode,
  PromoCodeStats,
  CreatePromoCodePayload,
  UpdatePromoCodePayload,
} from './promo';

export type {
  Order,
  OrderStatus,
  OrderItem,
  CreateOrderPayload,
  CreateOrderItemPayload,
  PaymentMethod
} from './order';

export type {
  ContactMessage,
  MessageStatus,
  CreateContactMessagePayload,
  UpdateContactMessageStatusPayload
} from './contact';

export type {
  Notification,
  NotificationListFilters,
  NotificationStatusFilter,
  NotificationStreamEvent,
  NotificationType,
} from './notification';

export type {
  InfluencerTrackingItem,
  InfluencerTrackingStats,
  CreateInfluencerTrackingPayload,
  InfluencerTrackingFilters,
} from './influencer';
