import { DatabaseClient } from 'marklogic';
export interface HostConfiguration {
    'host-name': string;
}
export declare function createHost(client: DatabaseClient, config: HostConfiguration): Promise<any>;
