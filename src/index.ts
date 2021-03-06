import * as MonoUtils from "@fermuch/monoutils";
import wellknown, { GeoJSONGeometry, GeoJSONPolygon } from 'wellknown';
import geoPointInPolygon from 'geo-point-in-polygon';
import { CollectionDoc } from "@fermuch/telematree";
import { currentLogin, myID } from "@fermuch/monoutils";
import { setUrgentNotification } from "./utils";

export type GeofenceConfig = {
  name: string;
  kind: 'default' | 'speedLimit';
  wkt: string;
  speedLimit?: number;
  tags?: string[];
}

// based on settingsSchema @ package.json
export type Config = {
  saveGPS: boolean;
  saveEveryMins: number;
  enableGeofences: boolean;
  geofences: GeofenceConfig[];
  speedLimit: number;

  highAccuracy: boolean;
  schedule: {day: string[]; startTime: string; endTime: string}[];
  warnUserOverspeed: boolean;
};
const conf = new MonoUtils.config.Config<Config>();

const ACTION_OK_OVERSPEED = 'gps-overspeed:ok' as const;

declare class GPSSensorEvent extends MonoUtils.wk.event.BaseEvent {
  kind: "sensor-gps";
  getData(): {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
    altitudeAccuracy: number;
    heading: number;
    speed: number;
  };
}

export class GenericEvent<T> extends MonoUtils.wk.event.BaseEvent {
  kind = "generic";
  type: string;
  payload: T;
  metadata: { [key: string]: string | number | boolean };

  constructor(type: string, data: T, metadata: { [key: string]: string | number | boolean } = {}) {
    super();
    this.type = type;
    this.payload = data;
    this.metadata = metadata;
  }

  getData(): {
    type: string;
    metadata: {
      [key: string]: string | number | boolean;
    };
    payload: T;
  } {
    return {
      type: this.type,
      metadata: this.metadata,
      payload: this.payload,
    };
  }
}

export class GeofenceEvent extends MonoUtils.wk.event.BaseEvent {
  kind = 'geofence' as const;
  private name: string;
  private entering: boolean;
  private since: number | null = null;
  private position: {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
    altitudeAccuracy: number;
    heading: number;
    speed: number;
  }

  constructor(
    name: string,
    entering: boolean,
    position: {
      latitude: number;
      longitude: number;
      altitude: number;
      accuracy: number;
      altitudeAccuracy: number;
      heading: number;
      speed: number;
    },
    since: number | null,
  ) {
    super();
    this.name = name;
    this.entering = entering;
    this.position = position;
    this.since = since;
  }

  getData(): unknown {
    return {
      name: this.name,
      when: Date.now(),
      deviceId: MonoUtils.myID(),
      login: MonoUtils.currentLogin(),
      since: this.since,
      totalSecondsInside: this.since ? Math.floor((Date.now() - this.since) / 1000) : null,
      entering: this.entering,
      exiting: !this.entering,
      position: this.position
    }
  }
}

class SpeedExcessEvent extends MonoUtils.wk.event.BaseEvent {
  kind = 'speed-excess' as const;
  private gpsData: ReturnType<GPSSensorEvent['getData']>;
  private name: string;
  private speedLimit: number;

  constructor(name: string, ev: ReturnType<GPSSensorEvent['getData']>, speedLimit: number) {
    super();
    this.name = name;
    this.gpsData = ev;
    this.speedLimit = speedLimit;
  }

  getData() {
    return {
      deviceId: MonoUtils.myID(),
      login: MonoUtils.currentLogin(),
      when: Date.now(),
      gps: this.gpsData,
      speedLimit: this.speedLimit,
      name: this.name,
    }
  }
}

function anyTagMatches(tags: string[]): boolean {
  // we always match if there are no tags
  if (!tags || tags.length === 0) return true;

  const userTags = env.project?.logins?.find((login) => login.key === currentLogin())?.tags || [];
  const deviceTags = env.project?.usersManager?.users?.find?.((u) => u.$modelId === myID())?.tags || [];
  const allTags = [...userTags, ...deviceTags];

  return tags.some((t) => allTags.includes(t));
}

messages.on('onInit', function () {
  platform.log('GPS script started');

  // config for GPS requests
  env.setData('GPS_TIMEOUT', 1000 * 120);
  env.setData('GPS_MAXIMUM_AGE', 1000 * 120);
  env.setData('GPS_HIGH_ACCURACY', conf.get('highAccuracy', true));
  env.setData('GPS_DISTANCE_FILTER', 5);
  env.setData('GPS_USE_SIGNIFICANT_CHANGES', true);

  // set schedule if it exists
  if (conf.get('schedule', []).length > 0) {
    const schedule = conf.get('schedule', []).reduce((acc, sch) => {
      acc.push(
        `${sch.day.join(',')} ${sch.startTime}-${sch.endTime}`
      )
      return acc;
    }, [] as string[])
    env.setData('GPS_SCHEDULE', schedule);
  } else {
    env.setData('GPS_SCHEDULE', undefined);
  }

  // request GPS activation
  env.setData('GPS_REQUESTED', true);
  // NOTE: some versions of the monoflow app need to have the GPS_REQUESTED downcased...
  env.setData('gps_requested', true);
});

type GeofenceCol = {
  insideSince: number | null;
  [geofenceName: string]: number | null;
}

function getCol(): CollectionDoc<GeofenceCol> | undefined {
  const col = env.project?.collectionsManager.ensureExists<GeofenceCol>('geofence', 'Geofence');
  return col.get(MonoUtils.myID());
}

function onSpeedExcess(ev: GPSSensorEvent, geofence?: GeofenceConfig) {
  // setUrgentNotification

  const speed = (ev?.gps?.speed || 0) * 3.6;
  const speedLimit = geofence?.speedLimit || conf.get('speedLimit', 0) || 0;
  platform.log(`Speed limit reached: ${speed} km/h (limit: ${speedLimit} km/h)`);
  env.project?.saveEvent(
    new SpeedExcessEvent(
      geofence?.name || 'default',
      ev.getData(),
      speedLimit
    )
  );

  if (conf.get('warnUserOverspeed', false)) {
    setUrgentNotification({
      title: 'L??mite de velocidade',
      color: '#d4c224',
      message: 'Foi detectado um excesso de velocidade',
      urgent: true,
      actions: [{
        action: ACTION_OK_OVERSPEED,
        name: 'OK',
        payload: {},
      }]
    })
  }
}

MonoUtils.wk.event.subscribe<GPSSensorEvent>('sensor-gps', (ev) => {
  // Store GPS
  if (conf.get('saveGPS', false)) {
    // this event is re-built like this to keep backwards compatibility
    const event = MonoUtils.wk.event.regenerateEvent(new GenericEvent('custom-gps', {
      ...ev.getData(),
      // speeds is deprecated, but we still want to support it
      speeds: [] as number[],
    }, {
      deviceId: MonoUtils.myID(),
      login: MonoUtils.currentLogin() || false,
    }));

    const saveEvery = conf.get('saveEveryMins', 0);
    const lastGpsUpdate = Number(env.data.LAST_GPS_UPDATE || '0') || 0;
    if (saveEvery === 0 || (Date.now() - lastGpsUpdate) > saveEvery * 60 * 1000) {
      env.setData('LAST_GPS_UPDATE', Date.now());
      env.project?.saveEvent(event);
    }
  }

  const speedLimit = conf.get('speedLimit', 0);
  if (speedLimit > 0) {
    const speed = ev.getData().speed * 3.6;
    if (speed > speedLimit) {
      onSpeedExcess(ev);
    }
  }

  if (!conf.get('enableGeofences', false)) {
    return;
  }

  // check geofences
  const geofences = conf.get('geofences', []);
  const lat = ev.getData().latitude;
  const lon = ev.getData().longitude;
  const speed = ev.getData().speed * 3.6;
  
  for (const geofence of geofences) {
    let geojson: GeoJSONGeometry | undefined;
    try {
      geojson = wellknown.parse(geofence.wkt);
    } catch (e) {
      platform.log(`Error while checking geofence ${geofence.name}: ${e.message}`);
      continue;
    }

    if (geojson.type !== 'Polygon') {
      platform.log(`Geofence ${geofence.name} is not a polygon`);
      continue;
    }

    const matchesOurDevice = anyTagMatches(geofence.tags || []);
    if (!matchesOurDevice) {
      continue;
    }

    const wasInside: number | null = getCol()?.data[geofence.name] || null;
    const isInside = geoPointInPolygon([lon, lat], geojson.coordinates[0]) as boolean;

    if (isInside && !wasInside) {
      platform.log(`${geofence.name} is now inside`);
      getCol()?.set(geofence.name, Date.now());
      env.project?.saveEvent(new GeofenceEvent(geofence.name, true, ev.getData(), null));
    } else if (!isInside && wasInside) {
      platform.log(`${geofence.name} is now outside`);
      getCol()?.set(geofence.name, null);
      env.project?.saveEvent(new GeofenceEvent(geofence.name, false, ev.getData(), wasInside));
    }

    if (geofence.kind === 'speedLimit') {
      if (speed > geofence.speedLimit) {
        onSpeedExcess(ev, geofence);
      }
    }
  }
});

messages.on('onCall', (actId, _payload) => {
  if (actId !== ACTION_OK_OVERSPEED) {
    return;
  }

  setUrgentNotification(null);
})