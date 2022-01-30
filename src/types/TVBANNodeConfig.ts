import * as RED from 'node-red';

export type TVBANNodeConfig = RED.NodeDef & {
    VBANServerNodeId: string;
};
