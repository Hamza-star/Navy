// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { DatabaseProvider } from './database.provider';

@Global() // makes it available everywhere (no need to re-import)
@Module({
  providers: [DatabaseProvider],
  exports: [DatabaseProvider],
})
export class DatabaseModule {}
