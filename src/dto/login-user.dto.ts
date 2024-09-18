import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class LoginUserDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  credentials: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  password: string;
}
