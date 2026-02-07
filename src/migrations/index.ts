import * as migration_20260121_001930 from './20260121_001930';
import * as migration_20260122_091203_add_header_categories_and_subitems from './20260122_091203_add_header_categories_and_subitems';
import * as migration_20260206_183719 from './20260206_183719';
import * as migration_20260207_115354 from './20260207_115354';
import * as migration_20260207_121924 from './20260207_121924';

export const migrations = [
  {
    up: migration_20260121_001930.up,
    down: migration_20260121_001930.down,
    name: '20260121_001930',
  },
  {
    up: migration_20260122_091203_add_header_categories_and_subitems.up,
    down: migration_20260122_091203_add_header_categories_and_subitems.down,
    name: '20260122_091203_add_header_categories_and_subitems',
  },
  {
    up: migration_20260206_183719.up,
    down: migration_20260206_183719.down,
    name: '20260206_183719',
  },
  {
    up: migration_20260207_115354.up,
    down: migration_20260207_115354.down,
    name: '20260207_115354',
  },
  {
    up: migration_20260207_121924.up,
    down: migration_20260207_121924.down,
    name: '20260207_121924'
  },
];
