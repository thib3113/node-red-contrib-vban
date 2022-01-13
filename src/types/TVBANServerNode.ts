import * as RED from 'node-red';
import { VBANServer } from 'vban';

export type TVBANServerNode = RED.Node & {
    server: VBANServer;
    startVBANServer: () => void;
    startVBANServerPromise?: Promise<void>;
};
