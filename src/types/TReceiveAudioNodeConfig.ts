import { TVBANNodeConfig } from './TVBANNodeConfig';

export type TReceiveAudioNodeConfig = TVBANNodeConfig & {
    allowedIps: string;
    streamName?: string;
};
