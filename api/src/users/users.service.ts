// api/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUser } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Ya lo usas en validateUser
  async findByEmailOrUsername(identifier: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
  }

  // ✅ Necesario para changePassword
  async findById(id: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({ where: { id } });
  }

  // Ya lo llamas tras validar login
  async updateLoginMeta(id: string) {
    await this.prisma.adminUser.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  // ✅ Actualiza hash y tokenVersion para invalidar refresh tokens antiguos
  async updatePassword(id: string, passwordHash: string) {
    await this.prisma.adminUser.update({
      where: { id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }
}
