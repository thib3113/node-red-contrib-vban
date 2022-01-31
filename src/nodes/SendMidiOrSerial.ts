import { VBANNode } from '../lib/VBANNode';
import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { TSendMidiOrSerialNode } from '../types/TSendMidiOrSerialNode';
import { TSendMidiOrSerialNodeConfig } from '../types/TSendMidiOrSerialNodeConfig';
import { IPacket, Sender } from '../lib/Sender';
import { ENodeStatus } from '../lib/ENodeStatus';
import { NodeMessageInFlow } from 'node-red';
import { ESerialStreamType, ESubProtocol } from 'vban';
import { TSendSerialMsg } from '../types/TSendSerialMsg';

const NODE_NAME = 'vban-send-midi-or-serial';

class SendMidiOrSerial extends VBANNode<TSendMidiOrSerialNode, TSendMidiOrSerialNodeConfig> {
    private sender?: Sender;

    protected async init(): Promise<void> {
        await super.init();

        if (this.serverConfigured) {
            this.sender = new Sender(this.server);

            this.setListener();
        } else {
            this.setStatus(ENodeStatus.ERROR, 'VBAN server not configured');
        }
    }

    setListener() {
        this.node.on('input', (msg: NodeMessageInFlow, _send, done) => {
            try {
                const payload = (msg as TSendSerialMsg).payload;
                let packet: Partial<IPacket> = {};
                let data;
                if (Buffer.isBuffer(payload)) {
                    data = payload;
                } else if (payload?.packet?.data && Buffer.isBuffer(payload?.packet?.data)) {
                    packet = payload?.packet;
                    data = packet.data;
                } else {
                    throw new Error('fail to found data from payload');
                }
                this.sender?.send(
                    {
                        bps: packet.bps,
                        channelsIdents: packet.channelsIdents,
                        formatBit: packet.formatBit,
                        streamType: packet.streamType ?? ESerialStreamType.VBAN_SERIAL_GENERIC,
                        subProtocol: ESubProtocol.SERIAL,
                        data,
                        streamName: this.definition.streamName
                    },
                    {
                        address: this.definition.address,
                        port: Number(this.definition.port)
                    }
                );
            } catch (e) {
                if (e instanceof Error) {
                    this.node.error(e.message, { payload: { payload: msg.payload, error: e } });
                    this.setStatus(ENodeStatus.ERROR, e.message);
                    done(e);
                } else {
                    throw e;
                }
            }
        });
    }
}

module.exports = (RED: REDRegistry.NodeAPI) => {
    registerNode(RED, NODE_NAME, SendMidiOrSerial);
};
