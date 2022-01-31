import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TReceiveMidiOrSerialNodeConfig = TVBANNodeConfig & {
    allowedIps: string;
    streamName?: string;
};
