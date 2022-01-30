import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TReceiveTextNodeConfig = TVBANNodeConfig & {
    allowedIps: string;
    streamName?: string;
};
