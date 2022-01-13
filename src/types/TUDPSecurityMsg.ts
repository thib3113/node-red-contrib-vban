import * as RED from 'node-red';
import { RemoteInfo } from 'dgram';

export type TUDPSecurityMsg = RED.NodeMessageInFlow &
    Partial<{
        payload: {
            sender: RemoteInfo;
        };
    }>;
