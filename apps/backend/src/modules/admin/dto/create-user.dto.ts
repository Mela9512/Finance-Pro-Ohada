import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsIn(['ADMIN', 'COMPTABLE', 'GESTIONNAIRE', 'LECTEUR'])
  role: 'ADMIN' | 'COMPTABLE' | 'GESTIONNAIRE' | 'LECTEUR';
}
