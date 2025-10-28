import { Controller, Get } from '@nestjs/common';
import { NodeRedLinkService } from './node_red_link.service';

@Controller('nodered') // ✅ this sets the route
export class NodeRedLinkController {
  constructor(private readonly nodeRedLinkService: NodeRedLinkService) {}

  @Get('navy')
  async fetchData() {
    return this.nodeRedLinkService.fetchDataFromNodeRed();
  }
}
