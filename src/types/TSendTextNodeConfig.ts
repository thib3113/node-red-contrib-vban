import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TSendTextNodeConfig = TVBANNodeConfig & {
    streamName: string;
    address: string;
    port: string | number;
};
