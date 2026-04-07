import { Controller, Post, Req, Headers } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { Public } from '../../common/decorators/public.decorator'

@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post('webhook/wompi')
  @Public()
  wompiWebhook(
    @Req() req: any,
    @Headers('x-wompi-signature') sig: string,
  ) {
    return this.service.handleWompiWebhook(req.body, req.rawBody || '', sig || '')
  }

  @Post('webhook/epayco')
  @Public()
  epaycoWebhook() {
    return { received: true }
  }
}
