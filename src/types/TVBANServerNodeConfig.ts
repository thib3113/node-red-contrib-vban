import { TNodeConfig } from './TNodeConfig';

export type TVBANServerNodeConfig = TNodeConfig & {
    port: number;
    address: string;
};
