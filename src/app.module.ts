import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      playground: false,
      autoSchemaFile: {
        path: 'dist/subgraph.graphql',
        federation: 2,
      },
      sortSchema: false,
      introspection: true,
      include: [],
    }),
  ],
  providers: [AppResolver],
})
export class AppModule {}
