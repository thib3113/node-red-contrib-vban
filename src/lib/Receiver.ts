import { ESubProtocol, VBANPacketTypes, VBANServer } from 'vban';
import { Security } from './Security';
import { EventEmitter } from 'events';
import { RemoteInfo } from 'dgram';

export interface ReceiverEvents {
    error: (err: Error) => void;
    message: (packet: VBANPacketTypes, sender: RemoteInfo) => void;
}

export declare interface Receiver {
    on<U extends keyof ReceiverEvents>(event: U, listener: ReceiverEvents[U]): this;

    emit<U extends keyof ReceiverEvents>(event: U, ...args: Parameters<ReceiverEvents[U]>): boolean;
}

export class Receiver extends EventEmitter {
    private readonly security?: Security;
    private readonly subProtocolFilter?: Array<ESubProtocol>;
    private readonly streamName?: string;

    constructor(
        readonly server: VBANServer,
        opts: { allowedIps?: string; subProtocol?: ESubProtocol | Array<ESubProtocol>; streamName?: string } = {}
    ) {
        super();
        if (opts.allowedIps) {
            this.security = new Security(opts.allowedIps);
        }
        if (opts.subProtocol) {
            this.subProtocolFilter = Array.isArray(opts.subProtocol) ? opts.subProtocol : [opts.subProtocol];
        }
        if (opts.streamName) {
            this.streamName = opts.streamName;
        }

        this.server.on('message', this.messageHandler);
    }

    messageHandler = (packet: VBANPacketTypes, sender: RemoteInfo) => {
        try {
            if (this.subProtocolFilter && !this.subProtocolFilter.includes(packet.subProtocol)) {
                return;
            }
            if (this.security && !this.security.check(sender.address)) {
                return;
            }
            if (this.streamName && this.streamName != packet.streamName) {
                return;
            }

            this.emit('message', packet, sender);
        } catch (e) {
            this.emit('error', e as Error);
        }
    };
}
