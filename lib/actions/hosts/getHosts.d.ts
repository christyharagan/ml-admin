import { DatabaseClient } from 'marklogic';
export interface Meta {
    uri: string;
    'current-time': string;
    'elapsed-time': {
        units: string;
        value: number;
    };
}
export interface Relations {
}
export interface RelatedViews {
}
export interface ListItem {
    uriref: string;
    roleref: string;
    idref: string;
    nameref: string;
}
export interface ListItems {
    'list-count': {
        units: string;
        value: number;
    };
    'list-item': ListItem[];
}
export interface HostsInfo {
    'host-default-list': HostInfo;
}
export interface HostInfo {
    meta: Meta;
    relations: Relations;
    'related-views': RelatedViews;
    'list-items': ListItems;
}
export declare function getHosts(client: DatabaseClient): Promise<HostsInfo>;
