import { Args, Resolver, Mutation } from '@nestjs/graphql';
import { LoginResponse } from './entities/login-user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthorizationResponse } from './entities/authorization.entity';
import { RegisterUserDto } from './dto/register-user.dto';

@Resolver()
export class AppResolver {
  @Mutation(() => LoginResponse)
  login(@Args('dto') dto: LoginUserDto): LoginResponse {
    console.log(dto);

    return {
      access: '',
      refresh: '',
      username: '',
    };
  }

  @Mutation(() => AuthorizationResponse)
  registration(@Args('dto') dto: RegisterUserDto): AuthorizationResponse {
    console.log(dto);

    return {
      accessToken: '',
      refreshToken: '',
    };
  }

  @Mutation(() => AuthorizationResponse)
  refresh(@Args('refreshToken') refreshToken: string): AuthorizationResponse {
    console.log(refreshToken);

    return {
      accessToken: '',
      refreshToken: '',
    };
  }
}
