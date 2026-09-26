import { Controller, Get } from '@nestjs/common';
import { ContentService, ContentResponse } from './content.service';

@Controller('public')
export class PublicContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('content')
  async listContent(): Promise<ContentResponse> {
    return this.contentService.listContent();
  }
}
