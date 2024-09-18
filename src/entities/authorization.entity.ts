import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthorizationResponse {
  @Field(() => String)
  accessToken: string;

  @Field(() => String)
  refreshToken: string;
}
