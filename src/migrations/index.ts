import * as migration_20260403_211340_add_custom_collections from './20260403_211340_add_custom_collections';
import * as migration_20260404_001711 from './20260404_001711';
import * as migration_20260404_131918_add_search_and_redirects_plugins from './20260404_131918_add_search_and_redirects_plugins';

export const migrations = [
  {
    up: migration_20260403_211340_add_custom_collections.up,
    down: migration_20260403_211340_add_custom_collections.down,
    name: '20260403_211340_add_custom_collections',
  },
  {
    up: migration_20260404_001711.up,
    down: migration_20260404_001711.down,
    name: '20260404_001711',
  },
  {
    up: migration_20260404_131918_add_search_and_redirects_plugins.up,
    down: migration_20260404_131918_add_search_and_redirects_plugins.down,
    name: '20260404_131918_add_search_and_redirects_plugins'
  },
];
