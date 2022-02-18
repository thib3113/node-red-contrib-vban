import {
    EFormatBit,
    ESerialStreamType,
    ESubProtocol,
    ETextEncoding,
    ISerialBitMode,
    VBANAudioPacket,
    VBANPacket,
    VBANSerialPacket,
    VBANServer,
    VBANTEXTPacket
} from 'vban';
import { CustomError } from './CustomError';

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
    //TODO add SERVICE

    //audio
    nbSample?: number;
    nbChannel?: number;
    bitResolution?: number;
    codec?: number;
}

export class Sender {
    constructor(readonly server: VBANServer) {}

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

    private getSubProtocol(pSubProtocol: TSubProtocol): ESubProtocol {
        const subProtocol = typeof pSubProtocol === 'string' ? pSubProtocol?.toUpperCase() : pSubProtocol;
        switch (subProtocol) {
            case 'AUDIO':
            case 0:
            case ESubProtocol.AUDIO:
                return ESubProtocol.AUDIO;
            case 'SERIAL':
            case 1:
            case ESubProtocol.SERIAL:
                return ESubProtocol.SERIAL;
            case 'TXT':
            case 2:
            case ESubProtocol.TEXT:
                return ESubProtocol.TEXT;
            case 'SERVICE':
            case 3:
            case ESubProtocol.SERVICE:
                return ESubProtocol.SERVICE;
            default:
                throw new Error(`unknown subProtocol "${pSubProtocol}"`);
        }
    }

    private constructVBANObject(packet: Partial<IPacket> & { streamName: string; subProtocol: TSubProtocol }): VBANPacket {
        let returnPacket: VBANPacket;
        switch (this.getSubProtocol(packet.subProtocol)) {
            case ESubProtocol.AUDIO:
                //do the checks
                if (!packet.data) {
                    throw new Error('data are mandatory');
                }

                returnPacket = new VBANAudioPacket(
                    { bitResolution: 0, codec: 0, nbChannel: 0, nbSample: 0, sr: 0, ...packet },
                    packet.data
                );
                break;
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
                        //add default bitMode
                        bitMode: packet.bitMode ?? {
                            stop: 1,
                            start: false,
                            parity: false,
                            multipart: false
                        },
                        channelsIdents: packet.channelsIdents as number
                    },
                    packet.data
                );

                break;
            case ESubProtocol.TEXT:
                returnPacket = new VBANTEXTPacket(
                    {
                        formatBit: EFormatBit.VBAN_DATATYPE_BYTE8,
                        streamName: packet.streamName,
                        encoding: packet.encoding ?? ETextEncoding.VBAN_TXT_UTF8
                    },
                    packet.text
                );
                break;
            case ESubProtocol.SERVICE:
                throw new Error(`"${packet.subProtocol}" NOT YET IMPLEMENTED`);
                break;
            default:
                throw new Error(`unknown subProtocol "${packet.subProtocol}"`);
        }

        return returnPacket;
    }

    public send(
        packet: IPacket,
        to: {
            address: string;
            port: number;
        }
    ) {
        if (!packet.subProtocol && packet.subProtocol !== ESubProtocol.AUDIO) {
            const text = 'packet need to contain a subProtocol';
            throw new CustomError(text, { packet });
        }

        if (!packet.streamName) {
            const text = 'packet need to contain a streamName';
            throw new CustomError(text, { packet });
        }

        const newPacket = this.constructVBANObject(packet);
        this.server.send(newPacket, to.port, to.address);
    }
}
