import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Role } from '../generated/prisma';

export interface AdminTeamMemberResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  verifiedEmail: boolean;
  createdAt: Date;
}

export interface CreateInvitationResponse {
  message: string;
  expiresAt: Date;
}

export type AdminInvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface AdminInvitationResponse {
  id: string;
  email: string;
  role: Role;
  status: AdminInvitationStatus;
  invitedByName: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface AcceptInvitationResponse {
  message: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async listTeamMembers(): Promise<AdminTeamMemberResponse[]> {
    return this.prismaService.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.VENDOR],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        verifiedEmail: true,
        createdAt: true,
      },
    });
  }

  async createInvitation(
    inviterId: string,
    dto: CreateAdminInvitationDto,
  ): Promise<CreateInvitationResponse> {
    const normalizedEmail = this.normalizeEmail(dto.email);

    if (dto.role === Role.CUSTOMER) {
      throw new BadRequestException(
        'Only admin or vendor invitations are allowed',
      );
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const inviter = await this.prismaService.user.findUnique({
      where: { id: inviterId },
      select: { firstName: true, lastName: true },
    });

    const inviterName = inviter
      ? `${inviter.firstName} ${inviter.lastName}`.trim()
      : 'AL MALAKI';

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.getInviteTtlMs());

    await this.prismaService.userInvitation.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        role: dto.role,
        tokenHash,
        invitedById: inviterId,
        expiresAt,
      },
      update: {
        role: dto.role,
        tokenHash,
        invitedById: inviterId,
        expiresAt,
        acceptedAt: null,
      },
    });

    const inviteUrl = this.buildInviteUrl(token, normalizedEmail);
    const expiresInHours = Math.max(
      1,
      Math.round(this.getInviteTtlMs() / (60 * 60 * 1000)),
    );

    await this.mailService.sendAdminInvitationEmail({
      to: normalizedEmail,
      inviteUrl,
      invitedByName: inviterName,
      roleLabel: this.getRoleLabel(dto.role),
      expiresInHours,
    });

    this.logger.log(`Admin invitation sent to ${normalizedEmail}`);

    return {
      message: 'Invitation sent successfully',
      expiresAt,
    };
  }

  async listInvitations(): Promise<AdminInvitationResponse[]> {
    const invitations = await this.prismaService.userInvitation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return invitations.map((invitation) => {
      const invitedByName =
        `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.trim();

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: this.getInvitationStatus(invitation),
        invitedByName,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        createdAt: invitation.createdAt,
      };
    });
  }

  async getVendorDashboardStats(): Promise<{
    ordersToday: number;
    topClients: number;
    newMessages: number;
    activePromos: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersToday, topClients, activePromos] = await Promise.all([
      this.prismaService.order.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prismaService.user.count({
        where: { role: Role.CUSTOMER },
      }),
      this.prismaService.promoCode.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    // Try to count contact messages if the model exists
    let newMessages = 0;
    try {
      newMessages = await (this.prismaService as any).contactMessage.count({
        where: { read: false },
      });
    } catch {
      newMessages = 0;
    }

    return { ordersToday, topClients, newMessages, activePromos };
  }

  async deleteInvitation(invitationId: string): Promise<{ message: string }> {
    const invitation = await this.prismaService.userInvitation.findUnique({
      where: { id: invitationId },
      select: { id: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prismaService.userInvitation.delete({
      where: { id: invitationId },
    });

    return {
      message: 'Invitation deleted successfully',
    };
  }

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponse> {
    const tokenHash = this.hashToken(dto.token);

    const invitation = await this.prismaService.userInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.acceptedAt) {
      throw new UnauthorizedException('Invalid or expired invitation');
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invitation has expired');
    }

    const normalizedEmail = this.normalizeEmail(invitation.email);
    const passwordHash = await hash(dto.password, 12);
    const phoneNumber = dto.phoneNumber?.trim() ?? null;

    await this.prismaService.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        await transaction.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber,
            passwordHash,
            role: invitation.role,
            verifiedEmail: true,
          },
        });
      } else {
        await transaction.user.create({
          data: {
            email: normalizedEmail,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber,
            passwordHash,
            role: invitation.role,
            verifiedEmail: true,
          },
        });
      }

      await transaction.userInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });

    return {
      message: 'Invitation accepted successfully',
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getInviteTtlMs(): number {
    const rawValue = this.configService.get<string>('ADMIN_INVITE_TTL_HOURS');
    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 48 * 60 * 60 * 1000;
    }

    return parsedValue * 60 * 60 * 1000;
  }

  private buildInviteUrl(token: string, email: string): string {
    const baseUrl = this.getInviteBaseUrl();
    const separator = baseUrl.includes('?') ? '&' : '?';

    return `${baseUrl}${separator}token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  }

  private getInviteBaseUrl(): string {
    const configured = this.configService
      .get<string>('ADMIN_INVITE_URL_BASE')
      ?.trim();

    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    return `${this.getClientOrigin()}/invite/accept`;
  }

  private getClientOrigin(): string {
    const clientOrigin =
      this.configService.get<string>('CLIENT_ORIGIN') ??
      'http://localhost:5173';
    const firstOrigin =
      clientOrigin.split(',')[0]?.trim() || 'http://localhost:5173';

    return firstOrigin.replace(/\/+$/, '');
  }

  private getRoleLabel(role: Role): string {
    if (role === Role.ADMIN) {
      return 'Admin';
    }

    if (role === Role.VENDOR) {
      return 'Vendor';
    }

    return 'Team member';
  }

  private getInvitationStatus(invitation: {
    acceptedAt: Date | null;
    expiresAt: Date;
  }): AdminInvitationStatus {
    if (invitation.acceptedAt) {
      return 'ACCEPTED';
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return 'EXPIRED';
    }

    return 'PENDING';
  }
}
