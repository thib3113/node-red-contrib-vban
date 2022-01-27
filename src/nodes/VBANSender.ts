import * as REDRegistry from '@node-red/registry';
import { registerNode } from '../lib/registerNode';
import { VBANNode } from '../lib/VBANNode';
import { ENodeStatus } from '../lib/ENodeStatus';
import { NodeMessageInFlow } from 'node-red';
import {
    EFormatBit,
    ESerialStreamType,
    ESubProtocol,
    ETextEncoding,
    ISerialBitMode,
    VBANPacket,
    VBANSerialPacket,
    VBANTEXTPacket
} from 'vban';
import { TVBANSenderNode } from '../types/TVBANSenderNode';
import { TVBANSenderNodeConfig } from '../types/TVBANSenderNodeConfig';

export type TSubProtocol = 'AUDIO' | 0 | 'SERIAL' | 1 | 'TXT' | 2 | 'SERVICE' | 3 | ESubProtocol;

export type TStreamTypeStr = 'GENERIC' | 'MIDI';

export interface IPacket {
    subProtocol: TSubProtocol;
    streamName: string;
    sr?: number;
    frameCounter?: number;
    data?: Buffer;
    //serial specifics
    bitMode?: ISerialBitMode;
    channelsIdents?: number;
    bps?: number;
    formatBit?: EFormatBit;
    streamType?: TStreamTypeStr | ESerialStreamType;
    //text specifics
    text?: string;
    encoding?: ETextEncoding;
    //TODO add AUDIO and SERVICE
}

class VBANSender extends VBANNode<TVBANSenderNode, TVBANSenderNodeConfig> {
    protected async init(): Promise<void> {
        await super.init();

        if (this.serverConfigured) {
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

    private getSerialStreamType(streamType?: ESerialStreamType | TStreamTypeStr): ESerialStreamType {
        if (!streamType && streamType !== 0) {
            throw new Error('streamType is needed');
        }

        if (Number(streamType) && ESerialStreamType[Number(streamType)]) {
            return streamType as ESerialStreamType;
        } else {
            switch (streamType) {
                case 'GENERIC':
                case ESerialStreamType.VBAN_SERIAL_GENERIC:
                    return ESerialStreamType.VBAN_SERIAL_GENERIC;
                case 'MIDI':
                case ESerialStreamType.VBAN_SERIAL_MIDI:
                    return ESerialStreamType.VBAN_SERIAL_MIDI;
                default:
                    throw new Error(`unknown stream type ${streamType}`);
            }
        }
    }

    private constructVBANObject(packet: Partial<IPacket> & { streamName: string; subProtocol: TSubProtocol }): VBANPacket {
        let returnPacket: VBANPacket;
        switch (typeof packet.subProtocol === 'string' ? packet.subProtocol?.toUpperCase() : packet.subProtocol) {
            case 'AUDIO':
            case 0:
            case ESubProtocol.AUDIO:
                throw new Error(`"${packet.subProtocol}" NOT YET IMPLEMENTED`);
                break;
            case 'SERIAL':
            case 1:
            case ESubProtocol.SERIAL:
                if (!packet.data) {
                    throw new Error('data are mandatory');
                }

                returnPacket = new VBANSerialPacket(
                    {
                        streamName: packet.streamName,
                        formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
                        streamType: this.getSerialStreamType(packet.streamType),
                        bps: packet.bps as number,
                        bitMode: packet.bitMode as ISerialBitMode,
                        sr: packet.sr as number,
                        channelsIdents: packet.channelsIdents as number
                    },
                    packet.data
                );

                break;
            case 'TXT':
            case 2:
            case ESubProtocol.TEXT:
                returnPacket = new VBANTEXTPacket(
                    {
                        formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
                        streamName: packet.streamName,
                        streamType: packet.encoding ?? ETextEncoding.VBAN_TXT_UTF8
                    },
                    packet.text
                );
                break;
            case 'SERVICE':
            case 3:
            case ESubProtocol.SERVICE:
                throw new Error(`"${packet.subProtocol}" NOT YET IMPLEMENTED`);
                break;
            default:
                throw new Error(`unknown subProtocol "${packet.subProtocol}"`);
        }

        return returnPacket;
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
            const newPacket = this.constructVBANObject(packet as IPacket);
            this.server.send(newPacket, Number(destination.port as number), destination.address);
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
    registerNode(RED, 'vban-sender', VBANSender);
};
