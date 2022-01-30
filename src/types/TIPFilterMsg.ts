import * as RED from 'node-red';
import { RemoteInfo } from 'dgram';

export type TIPFilterMsg = RED.NodeMessageInFlow &
    Partial<{
        payload: {
            sender: RemoteInfo;
        };
    }>;
