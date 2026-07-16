import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  id: number;
  @IsString()
  @MinLength(3)
  name: string;
  @IsEmail()
  email: string;
}
