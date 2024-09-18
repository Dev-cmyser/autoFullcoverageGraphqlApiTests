import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class LoginUserDto {
  @Field(() => String, { description: 'Учетные данные' })
  @IsString()
  @IsNotEmpty()
  credentials: string;

  @Field(() => String, { description: 'Пароль' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
