import { NodeAPI } from 'node-red';
import { TechnicalNode } from '../lib/TechnicalNode';
import { TVBANServerNode } from '../types/TVBANServerNode';
import { registerNode } from '../lib/registerNode';
import { EServicePINGApplicationType, EServicePINGFeatures, VBANServer } from 'vban';
import { TVBANServerNodeConfig } from '../types/TVBANServerNodeConfig';

class VBANServerNode extends TechnicalNode<TVBANServerNode, TVBANServerNodeConfig> {
    protected async init(): Promise<void> {
        await super.init();
        //prepare VBAN Server
        this.node.server = new VBANServer({
            application: {
                color: {
                    red: 255,
                    blue: 0,
                    green: 0
                },
                applicationName: 'Node-RED VBAN',
                applicationType: EServicePINGApplicationType.SERVER,
                features: [EServicePINGFeatures.MIDI, EServicePINGFeatures.SERIAL, EServicePINGFeatures.TXT]
            }
        });

        this.node.startVBANServer = async () => {
            if (this.node.startVBANServerPromise) {
                await this.node.startVBANServerPromise;
            }
            if (!this.node.server.isListening) {
                this.node.startVBANServerPromise = new Promise((res) => {
                    this.node.server.bind(Number(this.definition.port) || 6980, this.definition.address ?? '0.0.0.0', res);
                });

                //remove promise after use
                this.node.startVBANServerPromise.finally(() => (this.node.startVBANServerPromise = undefined));
            }
        };

        this.node.on('close', async (_removed: boolean, done: () => void) => {
            try {
                // This node has been disabled/deleted
                // kill server
                await new Promise((res) => {
                    this.node.server.close(() => res(''));
                });
            } catch (e: any) {
                this.node.error(e.message);
            } finally {
                done();
            }
        });
    }
}

module.exports = (RED: NodeAPI) => {
    registerNode(RED, 'vban-server', VBANServerNode);
};
