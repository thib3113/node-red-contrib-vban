import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TSendMidiOrSerialNodeConfig = TVBANNodeConfig & {
    streamName: string;
    address: string;
    port: string | number;
};
