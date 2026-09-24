import { Injectable } from '@nestjs/common';
import * as geoip from 'fast-geoip';

@Injectable()
export class GeoLocationService {
  async getLocation(ip: string) {
    const targetIp = ip === '::1' || ip === '127.0.0.1' ? '24.48.0.1' : ip;
    const geo = await geoip.lookup(targetIp);
    if (!geo) {
      return { error: 'Location not found' };
    }

    return {
      country: geo.country,
      city: geo.city,
      timezone: geo.timezone,
      ll: geo.ll,
    };
  }
}
