import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { VBANNode } from '../lib/VBANNode';
import { ENodeStatus } from '../lib/ENodeStatus';
import { NodeMessageInFlow } from 'node-red';
import { TVBANSenderNode } from '../types/TVBANSenderNode';
import { TVBANSenderNodeConfig } from '../types/TVBANSenderNodeConfig';
import { IPacket, Sender } from '../lib/Sender';

const NODE_NAME = 'vban-sender';

class VBANSender extends VBANNode<TVBANSenderNode, TVBANSenderNodeConfig> {
    private sender?: Sender;
    protected async init(): Promise<void> {
        await super.init();

        if (this.serverConfigured) {
            this.sender = new Sender(this.server);

            this.node.on('input', (msg) => {
                const { payload } = msg as NodeMessageInFlow & {
                    payload?: {
                        packet: Partial<IPacket>;
                        to: {
                            address?: string;
                            port?: string | number;
                        };
                    };
                };
                this.sendVBANPacket(payload);
            });
        } else {
            this.setStatus(ENodeStatus.ERROR, 'VBAN server not configured');
        }
    }

    private sendVBANPacket(payload?: {
        packet?: Partial<IPacket>;
        to?: {
            address?: string;
            port?: string | number;
        };
    }) {
        if (!payload || !payload.packet) {
            const text = 'no payload.packet received';
            this.node.error(text, { payload });
            this.setStatus(ENodeStatus.ERROR, text);
            return;
        }

        const destination: {
            address?: string;
            port?: string | number;
        } = payload.to ?? { address: this.definition.address, port: this.definition.port };
        if (!destination || !destination.address || !destination.port) {
            const text = 'destination seems to be missing, or not correctly configured';
            this.node.error(text, {
                payload
            });
            this.setStatus(ENodeStatus.ERROR, text);
            return;
        }

        const { packet } = payload;
        if (!packet.subProtocol) {
            const text = 'packet need to contain a subProtocol';
            this.node.error(text, {
                payload: packet
            });
            this.setStatus(ENodeStatus.ERROR, text);
            return;
        }
        if (!packet.streamName && this.definition.streamName) {
            packet.streamName = this.definition.streamName;
        } else if (!packet.streamName) {
            const text = 'packet need to contain a streamName';
            this.node.error(text, {
                payload: packet
            });
            this.setStatus(ENodeStatus.ERROR, text);
            return;
        }

        try {
            this.sender?.send(packet as IPacket, {
                address: destination.address,
                port: Number(destination.port)
            });
        } catch (e) {
            if (e instanceof Error) {
                this.node.error(e.message, {
                    payload: packet
                });
                this.setStatus(ENodeStatus.ERROR, e.message);
            } else {
                throw e;
            }
        }
    }
}

module.exports = (RED: REDRegistry.NodeAPI) => {
    registerNode(RED, NODE_NAME, VBANSender);
};
