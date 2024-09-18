import { Module } from '@nestjs/common';
import { AppResolver } from './app.resolver';
import { GraphQLModule } from '@nestjs/graphql';

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
