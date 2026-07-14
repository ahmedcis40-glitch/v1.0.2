import { Module } from '@nestjs/common';
import { WaveService } from './wave.service';
import { WaveController } from './wave.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WaveController],
  providers: [WaveService],
  exports: [WaveService],
})
export class WaveModule {}
