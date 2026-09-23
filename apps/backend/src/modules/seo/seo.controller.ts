import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SeoService } from './seo.service';

@ApiTags('seo')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Public()
  @Get('sitemap')
  @ResponseMessage('Sitemap entries')
  @ApiOperation({
    summary:
      'Sitemap URL entries (published photos/albums/collections + static) for the frontend sitemap.xml',
  })
  sitemap() {
    return this.seoService.getSitemap();
  }

  @Public()
  @RawResponse()
  @Get('rss.xml')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  @ApiOperation({ summary: 'RSS 2.0 feed of the latest published photos' })
  async rss(@Res() res: Response) {
    const xml = await this.seoService.getRssFeed();
    res.send(xml);
  }
}
