import { Module } from '@nestjs/common';
import { PawaPayService } from './pawapay.service';
import { PawaPayController } from './pawapay.controller';

@Module({
  controllers: [PawaPayController],
  providers: [PawaPayService],
  exports: [PawaPayService],
})
export class PawaPayModule {}
