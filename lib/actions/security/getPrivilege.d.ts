import { DatabaseClient } from 'marklogic';
export interface Meta {
}
export interface Relations {
}
export interface RelatedViews {
}
export interface PrivilegeInfo {
    id: string;
    name: string;
    meta: Meta;
    relations: Relations;
    'related-views': RelatedViews;
}
export declare function getRole(client: DatabaseClient, name: string): Promise<PrivilegeInfo>;
