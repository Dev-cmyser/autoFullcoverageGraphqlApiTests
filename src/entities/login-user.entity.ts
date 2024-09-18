import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  refresh: string;
  @Field(() => String)
  access: string;
  @Field(() => String)
  username: string;
}
