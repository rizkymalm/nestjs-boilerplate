import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  @MinLength(3)
  username: string;

  @IsNotEmpty({ message: 'Phone Number is required' })
  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsNotEmpty({ message: 'Role is required' })
  role: Types.ObjectId;
}
