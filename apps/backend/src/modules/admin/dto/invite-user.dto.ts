import { IsEmail, IsIn } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsIn(['ADMIN', 'COMPTABLE', 'GESTIONNAIRE', 'LECTEUR'])
  role: 'ADMIN' | 'COMPTABLE' | 'GESTIONNAIRE' | 'LECTEUR';
}
