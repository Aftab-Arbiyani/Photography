import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const STRONG_PASSWORD = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password-reset token from the emailed link' })
  @IsJWT()
  token!: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(STRONG_PASSWORD, {
    message: 'Password must contain upper, lower case letters and a number',
  })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(72)
  currentPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(STRONG_PASSWORD, {
    message: 'Password must contain upper, lower case letters and a number',
  })
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email-verification token from the emailed link' })
  @IsJWT()
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
