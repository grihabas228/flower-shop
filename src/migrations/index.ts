import * as migration_20260403_211340_add_custom_collections from './20260403_211340_add_custom_collections';
import * as migration_20260404_001711 from './20260404_001711';
import * as migration_20260404_131918_add_search_and_redirects_plugins from './20260404_131918_add_search_and_redirects_plugins';
import * as migration_20260406_211500_rename_zone_name_to_zone_type from './20260406_211500_rename_zone_name_to_zone_type';
import * as migration_20260407_120000_delivery_zones_intervals from './20260407_120000_delivery_zones_intervals';
import * as migration_20260407_140000_seed_missing_zones from './20260407_140000_seed_missing_zones';

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
  {
    up: migration_20260406_211500_rename_zone_name_to_zone_type.up,
    down: migration_20260406_211500_rename_zone_name_to_zone_type.down,
    name: '20260406_211500_rename_zone_name_to_zone_type',
  },
  {
    up: migration_20260407_120000_delivery_zones_intervals.up,
    down: migration_20260407_120000_delivery_zones_intervals.down,
    name: '20260407_120000_delivery_zones_intervals',
  },
  {
    up: migration_20260407_140000_seed_missing_zones.up,
    down: migration_20260407_140000_seed_missing_zones.down,
    name: '20260407_140000_seed_missing_zones',
  },
];
