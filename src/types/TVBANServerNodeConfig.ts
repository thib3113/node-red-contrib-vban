import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TVBANServerNodeConfig = TVBANNodeConfig & {
    port: number;
    address: string;
    allowedIPs?: string;
    autoReplyToPing?: boolean;
};
