import { TVBANReceiverNode } from '../types/TVBANReceiverNode';
import { TVBANReceiverNodeConfig } from '../types/TVBANReceiverNodeConfig';
import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { VBANNode } from '../lib/VBANNode';
import { ENodeStatus } from '../lib/ENodeStatus';
import { Receiver } from '../lib/Receiver';

const NODE_NAME = 'vban-receiver';

class VBANReceiver extends VBANNode<TVBANReceiverNode, TVBANReceiverNodeConfig> {
    private receiver?: Receiver;
    protected async init(): Promise<void> {
        await super.init();

        if (this.serverConfigured) {
            this.receiver = new Receiver(this.server);
            this.receiver.on('message', (packet, sender) => {
                this.send({
                    payload: {
                        packet,
                        sender
                    }
                });
            });
        } else {
            this.setStatus(ENodeStatus.ERROR, 'VBAN server not configured');
        }
    }
}

module.exports = (RED: REDRegistry.NodeAPI) => {
    registerNode(RED, NODE_NAME, VBANReceiver);
};
