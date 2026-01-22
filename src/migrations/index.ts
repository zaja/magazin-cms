import * as migration_20260121_001930 from './20260121_001930';
import * as migration_20260122_091203_add_header_categories_and_subitems from './20260122_091203_add_header_categories_and_subitems';

export const migrations = [
  {
    up: migration_20260121_001930.up,
    down: migration_20260121_001930.down,
    name: '20260121_001930',
  },
  {
    up: migration_20260122_091203_add_header_categories_and_subitems.up,
    down: migration_20260122_091203_add_header_categories_and_subitems.down,
    name: '20260122_091203_add_header_categories_and_subitems'
  },
];
