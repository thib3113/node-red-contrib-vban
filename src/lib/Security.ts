import { Address4, Address6 } from 'ip-address';
import { CustomError } from './CustomError';

export class Security {
    private ipsAllowed: Array<Address4 | Address6> = [];

    constructor(allowedIps: string) {
        //init ipsAllowed from configuration
        this.ipsAllowed = (allowedIps ?? '')
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
                    throw new CustomError(
                        topic,
                        {
                            ip,
                            error
                        },
                        error as Error
                    );
                }
            });
    }

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

    public check(address: string): boolean {
        let ip: Address4 | Address6 = this.parseIp(address);
        return !!this.ipsAllowed.find((ipAllowed) => ip.isInSubnet(ipAllowed));
    }
}
