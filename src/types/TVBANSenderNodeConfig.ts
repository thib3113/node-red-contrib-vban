import { TNodeConfig } from './TNodeConfig';

export type TVBANSenderNodeConfig = TNodeConfig & {
    address?: string;
    port?: string | number;
    streamName?: string;
};
