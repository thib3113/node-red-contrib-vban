import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TIPFilterNodeConfig = TVBANNodeConfig & {
    allowedIps: string;
};
