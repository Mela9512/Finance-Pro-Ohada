import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    this.resend = key ? new Resend(key) : null;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY absent — email non envoyé (destinataire: ${to}, sujet: ${subject})`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Échec d'envoi email à ${to}: ${(err as Error).message}`);
    }
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    return this.send(
      to,
      'Réinitialisation de votre mot de passe FinancePro OHADA',
      `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
       <p><a href="${resetUrl}">Cliquez ici pour définir un nouveau mot de passe</a> (valable 1 heure).</p>
       <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    );
  }

  sendInvite(to: string, companyName: string, inviteUrl: string): Promise<void> {
    return this.send(
      to,
      `Invitation à rejoindre ${companyName} sur FinancePro OHADA`,
      `<p>Vous avez été invité(e) à rejoindre <strong>${companyName}</strong> sur FinancePro OHADA.</p>
       <p><a href="${inviteUrl}">Cliquez ici pour créer votre compte</a> (invitation valable 7 jours).</p>`,
    );
  }
}
