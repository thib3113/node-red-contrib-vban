import { VBANNode } from '../lib/VBANNode';
import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { TReceiveMidiOrSerialNode } from '../types/TReceiveMidiOrSerialNode';
import { TReceiveMidiOrSerialNodeConfig } from '../types/TReceiveMidiOrSerialNodeConfig';
import { Receiver } from '../lib/Receiver';
import { ESubProtocol } from 'vban';
import { ENodeStatus } from '../lib/ENodeStatus';

const NODE_NAME = 'vban-receive-midi-or-serial';

class ReceiveMidiOrSerial extends VBANNode<TReceiveMidiOrSerialNode, TReceiveMidiOrSerialNodeConfig> {
    private receiver?: Receiver;
    protected async init(): Promise<void> {
        await super.init();

        if (this.serverConfigured) {
            this.receiver = new Receiver(this.server, {
                subProtocol: ESubProtocol.SERIAL,
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
    registerNode(RED, NODE_NAME, ReceiveMidiOrSerial);
};
