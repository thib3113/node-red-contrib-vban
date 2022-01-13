import { TVBANReceiverNode } from '../types/TVBANReceiverNode';
import { TVBANReceiverNodeConfig } from '../types/TVBANReceiverNodeConfig';
import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { VBANNode } from '../lib/VBANNode';

class VBANReceiver extends VBANNode<TVBANReceiverNode, TVBANReceiverNodeConfig> {
    protected async init(): Promise<void> {
        await super.init();

        this.server.on('message', (packet, sender) => {
            this.send({
                payload: {
                    packet,
                    sender
                }
            });
        });
    }
}

module.exports = (RED: REDRegistry.NodeAPI) => {
    registerNode(RED, 'vban-receiver', VBANReceiver);
};
