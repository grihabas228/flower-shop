import * as migration_20260403_211340_add_custom_collections from './20260403_211340_add_custom_collections';
import * as migration_20260404_001711 from './20260404_001711';

export const migrations = [
  {
    up: migration_20260403_211340_add_custom_collections.up,
    down: migration_20260403_211340_add_custom_collections.down,
    name: '20260403_211340_add_custom_collections',
  },
  {
    up: migration_20260404_001711.up,
    down: migration_20260404_001711.down,
    name: '20260404_001711'
  },
];
