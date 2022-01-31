import * as RED from 'node-red';

export type TSendSerialMsg = RED.NodeMessageInFlow &
    Partial<{
        payload:
            | Buffer
            | {
                  packet?: {
                      data: Buffer;
                  };
              };
    }>;
