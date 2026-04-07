import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'

@WebSocketGateway({ namespace: '/orders', cors: { origin: '*' } })
export class OrdersGateway implements OnGatewayInit {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(OrdersGateway.name)

  afterInit(server: Server) {
    this.logger.log('OrdersGateway iniciado')
  }

  @SubscribeMessage('join-restaurant')
  handleJoinRestaurant(
    @MessageBody() data: { restaurantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`restaurant:${data.restaurantId}`)
    client.emit('joined', { room: `restaurant:${data.restaurantId}` })
  }

  @SubscribeMessage('join-order-tracking')
  handleJoinOrderTracking(
    @MessageBody() data: { orderId: string; customerToken: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`order:${data.orderId}`)
    client.emit('joined', { room: `order:${data.orderId}` })
  }

  emitNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('order:new', order)
  }

  emitOrderUpdated(restaurantId: string, orderId: string, order: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('order:updated', order)
    this.server.to(`order:${orderId}`).emit('order:updated', order)
  }
}
