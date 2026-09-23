import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@photography/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { toPublicOrder } from './order.mapper';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'My order history (paginated)' })
  listMine(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.ordersService.listMine(userId, query);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] All orders (paginated)' })
  adminList(@Query() query: PaginationQueryDto) {
    return this.ordersService.adminList(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my orders (invoice data)' })
  async getOne(@Param() { id }: UuidParamDto, @CurrentUser('id') userId: string) {
    return toPublicOrder(await this.ordersService.getOwned(id, userId));
  }

  @Get(':id/invoice.pdf')
  @RawResponse()
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download a PDF invoice for one of my orders' })
  async invoice(
    @Param() { id }: UuidParamDto,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const order = await this.ordersService.getOwned(id, userId);
    const pdf = await this.invoiceService.generate(order);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${order.invoiceNumber}.pdf"`,
    );
    res.send(pdf);
  }
}
