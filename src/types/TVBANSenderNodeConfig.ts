import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TVBANSenderNodeConfig = TVBANNodeConfig & {
    address?: string;
    port?: string | number;
    streamName?: string;
};
