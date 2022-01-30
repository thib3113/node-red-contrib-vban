import { VBANNode } from '../lib/VBANNode';
import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { TSendTextNode } from '../types/TSendTextNode';
import { TSendTextNodeConfig } from '../types/TSendTextNodeConfig';
import { TSendTextMsg } from '../types/TSendTextMsg';
import { ENodeStatus } from '../lib/ENodeStatus';
import { Sender } from '../lib/Sender';
import { ESubProtocol } from 'vban';

const NODE_NAME = 'vban-send-text';

class SendText extends VBANNode<TSendTextNode, TSendTextNodeConfig> {
    private sender?: Sender;
    protected async init(): Promise<void> {
        await super.init();

        if (this.serverConfigured) {
            this.sender = new Sender(this.server);

            this.node.on('input', (msg, _send, done) => {
                try {
                    const payload = (msg as TSendTextMsg).payload;
                    let text = '';
                    if (typeof payload === 'string' || typeof payload === 'number') {
                        text = payload.toString();
                    } else if (typeof payload?.packet?.text === 'string') {
                        text = payload?.packet?.text;
                    } else {
                        throw new Error('fail to found text from payload');
                    }
                    this.sender?.send(
                        {
                            subProtocol: ESubProtocol.TEXT,
                            text,
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
}

module.exports = (RED: REDRegistry.NodeAPI) => {
    registerNode(RED, NODE_NAME, SendText);
};
