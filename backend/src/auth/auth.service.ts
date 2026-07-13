import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone, whatsappPhone, consentSMS, consentWhatsApp } = registerDto;

    // Vérifier si l'utilisateur existe déjà par email ou téléphone
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email ou ce numéro de téléphone existe déjà');
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur et son wallet dans une transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          firstName,
          lastName,
          phone,
          whatsappPhone,
          consentSMS: consentSMS ?? true,
          consentWhatsApp: consentWhatsApp ?? true,
        },
      });

      // Créer le CashWallet associé
      await tx.cashWallet.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          balanceTotal: 0.0,
          balanceFrozen: 0.0,
          currency: 'XOF',
          updatedAt: new Date(),
        },
      });

      // Écrire un log d'audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTER',
          details: `Inscription de l'utilisateur ${phone}`,
          ipAddress: '127.0.0.1', // Valeur par défaut simplifiée
        },
      });

      const { password: _, ...result } = user;
      return result;
    });
  }

  async login(loginDto: LoginDto) {
    const { phoneOrEmail, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: phoneOrEmail },
          { phone: phoneOrEmail },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Enregistrer la connexion dans l'audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `Connexion réussie de l'utilisateur ${user.phone}`,
        ipAddress: '127.0.0.1',
      },
    });

    const payload = { sub: user.id, email: user.email, phone: user.phone, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    };
  }
}
