import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ContentController } from './content.controller';
import { PublicContentController } from './public-content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContentController, PublicContentController],
  providers: [ContentService],
})
export class ContentModule {}
