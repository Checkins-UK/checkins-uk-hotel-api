import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ZentrumhubController } from './controllers/hotel.api.controller';
import { ReviewController } from './controllers/review.api.controller';
import { ZentrumhubService } from './services/hotel.api.service';
import { ReviewService } from './services/review.api.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'checkins-uk-database.mysql.database.azure.com',
      port: 3306,
      username: 'aadmin',
      password: 'Amila123$',
      database: 'scuttlr',
      entities: [],
      synchronize: true,
    }),
    ConfigModule.forRoot(),
  ],
  controllers: [ZentrumhubController , ReviewController],
  providers: [ZentrumhubService , ReviewService],
})
export class AppModule {}
