import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType({ description: 'Данные для регистрации' })
export class RegisterUserDto {
  @Field(() => String, { description: 'Имя' })
  firstName: string;

  @Field(() => String, { description: 'Фамилия' })
  lastName: string;

  @Field(() => String, { description: 'Почта' })
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'Телефон' })
  phone: string;

  @Field(() => String, { description: 'Пароль' })
  password: string;

  @Field(() => String, { description: 'Подтверждение пароля' })
  confirmPassword: string;
}
