import { Test, TestingModule } from '@nestjs/testing';
import { TimestampUpdateController } from './timestamp-update.controller';
import { TimestampUpdateService } from './timestamp-update.service';

describe('TimestampUpdateController', () => {
  let controller: TimestampUpdateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimestampUpdateController],
      providers: [TimestampUpdateService],
    }).compile();

    controller = module.get<TimestampUpdateController>(TimestampUpdateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
