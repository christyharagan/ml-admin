import { DatabaseClient } from 'marklogic';
export interface RangePathIndex {
    'scalar-type': string;
    'path-expression': string;
    'collation'?: string;
    'range-value-positions'?: boolean;
    'invalid-values'?: string;
}
export interface GeoPathIndex {
    'path-expression': string;
    'invalid-values'?: string;
    'range-value-positions'?: boolean;
    'coordinate-system'?: string;
    'point-format'?: string;
}
export interface RuleSet {
    location: string;
}
export interface DatabaseConfiguration {
    'database-name': string;
    enabled?: boolean;
    'schema-database'?: string;
    'security-database'?: string;
    'triggers-database'?: string;
    forest?: string[];
    'range-path-indexes'?: RangePathIndex[];
    'geospatial-path-indexes'?: GeoPathIndex[];
    'triple-index'?: boolean;
    'collection-lexicon'?: boolean;
    'default-ruleset'?: RuleSet[];
}
export declare function createDatabase(client: DatabaseClient, config: DatabaseConfiguration): Promise<any>;
