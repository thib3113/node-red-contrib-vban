import { TNodeConfig } from './TNodeConfig';

export type TUDPSecurityNodeConfig = TNodeConfig & {
    allowedIps: string;
};
