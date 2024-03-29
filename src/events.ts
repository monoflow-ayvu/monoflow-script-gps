import * as MonoUtils from "@fermuch/monoutils";

export declare class SpeedEvent extends MonoUtils.wk.event.BaseEvent {
  kind: 'sensor-speed';

  getData(): {
    speed: number;
    accuracy?: number;
  }
}

export interface PositionUpdate {
  _pending: number;
  accuracy: number;
  altitude: number;
  bearing: number;
  bearingAccuracyDegrees: number;
  geofences: Record<string, boolean>;
  hasSpeedAccuracy: boolean;
  latitude: number;
  longitude: number;
  provider: string;
  speed: number;
  speedAccuracy: number;
  time: number;
  verticalAccuracyMeters: number;
}

export declare class PositionEvent extends MonoUtils.wk.event.BaseEvent {
  kind: "sensor-gps";
  getData(): PositionUpdate & {
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

export class SpeedExcessEvent extends MonoUtils.wk.event.BaseEvent {
  kind = 'speed-excess' as const;
  private gpsData: ReturnType<PositionEvent['getData']>;
  private name: string;
  private speedLimit: number;

  constructor(name: string, ev: ReturnType<PositionEvent['getData']>, speedLimit: number) {
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

export class SpeedPreExcessEvent extends MonoUtils.wk.event.BaseEvent {
  kind = 'speed-pre-excess' as const;
  private gpsData: ReturnType<PositionEvent['getData']>;
  private name: string;
  private speedLimit: number;

  constructor(name: string, ev: ReturnType<PositionEvent['getData']>, speedLimit: number) {
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