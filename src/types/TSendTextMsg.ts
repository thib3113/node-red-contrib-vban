import * as RED from 'node-red';

export type TSendTextMsg = RED.NodeMessageInFlow &
    Partial<{
        payload:
            | string
            | number
            | {
                  packet?: {
                      text: string;
                  };
              };
    }>;
