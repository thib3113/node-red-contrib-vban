import { Node } from '../lib/Node';
import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { TUDPSecurityNode } from '../types/TUDPSecurityNode';
import { TUDPSecurityNodeConfig } from '../types/TUDPSecurityNodeConfig';
import { Address4, Address6 } from 'ip-address';
import { TUDPSecurityMsg } from '../types/TUDPSecurityMsg';
import { NodeMessage } from '@node-red/registry';

class UDPSecurity extends Node<TUDPSecurityNode, TUDPSecurityNodeConfig> {
    private ipsAllowed: Array<Address4 | Address6> = [];

    private parseIp(ip: string) {
        try {
            //check if it's a valid IPv4
            return new Address4(ip);
        } catch (e) {
            //e is not instance of AddressError
            if ((e as { name: string }).name === 'AddressError') {
                //maybe it's a valid IPv6
                return new Address6(ip);
            } else {
                throw e;
            }
        }
    }

    protected async init(): Promise<void> {
        await super.init();

        //init ipsAllowed from configuration
        this.ipsAllowed = (this.definition.allowedIps ?? '')
            .replace(/\s+/g, '')
            .replace(/;/g, ',')
            .split(',')
            .map((i) => i.trim())
            //remove empty strings
            .filter((i) => !!i)
            .map((ip) => {
                try {
                    return this.parseIp(ip);
                } catch (error) {
                    const topic = `ip "${ip}" seems to doesn't be an IPv4 or an IPv6`;
                    this.node.error(topic, {
                        topic,
                        payload: {
                            ip,
                            error
                        }
                    });
                    throw error;
                }
            });

        this.node.on('input', (msg, send) => {
            const sender = (msg as TUDPSecurityMsg).payload?.sender;

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

            //check if we can parse the ip
            let ip: Address4 | Address6;
            try {
                ip = this.parseIp(sender.address);
            } catch (e) {
                const topic = `fail to parse "${sender.address}", seems to doesn't be an IPv4 or an IPV6`;
                sendError(topic);
                this.node.error(e);
            }

            if (!this.ipsAllowed.find((ipAllowed) => ip.isInSubnet(ipAllowed))) {
                sendError(`ip ${sender.address} seems not allowed`);
                return;
            }

            this.send([msg]);
        });
    }
}

module.exports = (RED: REDRegistry.NodeAPI) => {
    registerNode(RED, 'vban-udp-security', UDPSecurity);
};
