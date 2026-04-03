import * as migration_20260403_211340_add_custom_collections from './20260403_211340_add_custom_collections';

export const migrations = [
  {
    up: migration_20260403_211340_add_custom_collections.up,
    down: migration_20260403_211340_add_custom_collections.down,
    name: '20260403_211340_add_custom_collections'
  },
];
