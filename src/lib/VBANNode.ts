import * as REDRegistry from '@node-red/registry';
import { TVBANNodeConfig } from '../types/TVBANNodeConfig';
import { ENodeStatus } from './ENodeStatus';
import { TSendMessage } from '../types/TSendMessage';
import { VBANServer } from 'vban';
import { TVBANServerNode } from '../types/TVBANServerNode';
import { Node } from './Node';

export class VBANNode<
    TNode extends REDRegistry.Node<TCredentials> = any,
    TNodeDefinition extends TVBANNodeConfig = TVBANNodeConfig,
    TCredentials = any
> extends Node<TNode, TNodeDefinition, TCredentials> {
    get server(): VBANServer {
        if (!this._server) {
            throw new Error(`can't retrieve _server before init`);
        }
        return this._server;
    }
    get serverConfigured(): boolean {
        return this._server != undefined;
    }
    private _server?: VBANServer;

    protected async init(): Promise<void> {
        await super.init();

        if (!this.definition.VBANServerNodeId) {
            this.setStatus(ENodeStatus.ERROR, 'VBAN server not configured');
            return;
        }

        const VBANServerNode = this.nodeRED.nodes.getNode(this.definition.VBANServerNodeId) as TVBANServerNode;

        if (!VBANServerNode) {
            this.setStatus(ENodeStatus.ERROR, 'fail to get server configuration');
            return;
        }

        const { server } = VBANServerNode;
        if (!server) {
            this.setStatus(ENodeStatus.ERROR, 'fail to get server configuration');
            return;
        }

        this._server = server;

        this.setStatus(ENodeStatus.PENDING, 'starting VBAN server');

        try {
            this.server.on('error', (err) => {
                this.node.error(err);
                this.setStatus(ENodeStatus.ERROR, err.message);
            });

            this.server.on('listening', () => {
                if (this.lastStatus?.status != ENodeStatus.ERROR) {
                    const address = this.server?.address();
                    this.setStatus(ENodeStatus.READY, `listening on ${address?.address}:${address?.port}`);
                }
            });

            VBANServerNode.startVBANServer();
        } catch (e: any) {
            this.setStatus(ENodeStatus.ERROR, e.message);
            return;
        }
    }

    protected send(msg: TSendMessage, sendFn?: (msg: TSendMessage) => void) {
        (sendFn || this.node.send.bind(this.node))(msg);
    }
}
