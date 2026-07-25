import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Exécute la stratégie JWT si un cookie est présent (peuple req.user),
 * mais ne rejette jamais la requête si le token est absent/invalide.
 * Utilisé pour /auth/me, seule route où "non authentifié" est une réponse
 * valide (pas une erreur).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: any, user: any): TUser {
    return (user || null) as TUser;
  }
}
