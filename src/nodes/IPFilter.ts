import { Node } from '../lib/Node';
import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { TIPFilterNode } from '../types/TIPFilterNode';
import { TIPFilterNodeConfig } from '../types/TIPFilterNodeConfig';
import { TIPFilterMsg } from '../types/TIPFilterMsg';
import { NodeMessage } from '@node-red/registry';
import { Security } from '../lib/Security';

const NODE_NAME = 'vban-ip-filter';

class IPFilter extends Node<TIPFilterNode, TIPFilterNodeConfig> {
    private security?: Security;
    protected async init(): Promise<void> {
        await super.init();

        this.security = new Security(this.definition.allowedIps);

        this.node.on('input', (msg, send) => {
            const sender = (msg as TIPFilterMsg).payload?.sender;

            const sendError = (error: string) => {
                const errorMessage: NodeMessage = {};

                // @ts-ignore force adding error
                errorMessage.error = error;

                this.send([null, errorMessage], send);
            };

            //first try to parse sender
            if (!sender) {
                sendError('fail to get sender from payload');
                return;
            }

            try {
                if (!this.security?.check(sender.address)) {
                    sendError(`ip ${sender.address} seems not allowed`);
                    return;
                }
            } catch (e) {
                const topic = `fail to parse "${sender.address}", seems to doesn't be an IPv4 or an IPV6`;
                sendError(topic);
                this.node.error(e);
            }

            this.send([msg]);
        });
    }
}

module.exports = (RED: REDRegistry.NodeAPI) => {
    registerNode(RED, NODE_NAME, IPFilter);
};
