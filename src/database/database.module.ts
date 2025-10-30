import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = configService.get<string>('POSTGRES_PORT');

        return {
          type: 'postgres',
          host: configService.get<string>('POSTGRES_HOST'),
          port: port ? parseInt(port, 10) : 5432,
          username: configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('POSTGRES_DB'),
          autoLoadEntities: true,
          synchronize: true,
          dropSchema: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
