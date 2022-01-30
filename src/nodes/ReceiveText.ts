import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { TReceiveTextNode } from '../types/TReceiveTextNode';
import { TReceiveTextNodeConfig } from '../types/TReceiveTextNodeConfig';
import { Receiver } from '../lib/Receiver';
import { ENodeStatus } from '../lib/ENodeStatus';
import { VBANNode } from '../lib/VBANNode';
import { ESubProtocol } from 'vban';

const NODE_NAME = 'vban-receive-text';

class ReceiveText extends VBANNode<TReceiveTextNode, TReceiveTextNodeConfig> {
    private receiver?: Receiver;
    protected async init(): Promise<void> {
        await super.init();

        if (this.serverConfigured) {
            this.receiver = new Receiver(this.server, {
                subProtocol: ESubProtocol.TEXT,
                allowedIps: this.definition.allowedIps,
                streamName: this.definition.streamName
            });
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
    registerNode(RED, NODE_NAME, ReceiveText);
};
