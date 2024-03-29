import * as MonoUtils from '@fermuch/monoutils';
import type { GenericEvent } from './events';
import { conf } from "./config";
const read = require('fs').readFileSync;
const join = require('path').join;

function loadScript() {
  // import global script
  const script = read(join(__dirname, '..', 'dist', 'bundle.js')).toString('utf-8');
  eval(script);
}

const complexFence = 'POLYGON ((-50.92296123504639 -29.936118351698703, -50.923025608062744 -29.93659251898045, -50.923991203308105 -29.939000510100893, -50.92437744140625 -29.942105709903213, -50.91386318206787 -29.941994147517157, -50.90613842010498 -29.94215219419381, -50.901761054992676 -29.93836830185822, -50.90914249420166 -29.9331803236537, -50.91546177864075 -29.93216686980655, -50.921781063079834 -29.9336080166756, -50.92291831970215 -29.93559769482562, -50.92296123504639 -29.936118351698703))';
const pointInside = [-29.9380496, -50.9176504];
const pointOutside = [-23.12345, -40.123456];

class MockGPSEvent extends MonoUtils.wk.event.BaseEvent {
  kind = 'sensor-gps' as const;

  constructor(
    private readonly latitude = 1,
    private readonly longitude = 1,
    private readonly accuracy = 1,
    private readonly speed = 1,
  ) {
    super();
  }

  getData() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: 1,
      accuracy: this.accuracy,
      altitudeAccuracy: 1,
      heading: 1,
      speed: this.speed,
    };
  }
}

describe("onInit", () => {
  it('loads the script correctly', () => {
    loadScript();
    messages.emit('onInit');
  })
});



// TODO: re-enable me after migrating!!

// describe("onInit", () => {
//   jest.useFakeTimers('modern');

//   afterEach(() => {
//     // clean listeners
//     messages.removeAllListeners();
//     env.setData('LAST_GPS_UPDATE', null);
//     conf.reload();
//   });

//   it('loads the script correctly', () => {
//     loadScript();
//     messages.emit('onInit');
//   })

//   it('requests for GPS to be enabled', () => {
//     loadScript();
//     messages.emit('onInit');
//     expect(env.data.GPS_REQUESTED).toBe(true);
//   });

//   it('sets GPS configuration', () => {
//     loadScript();
//     messages.emit('onInit');
//     expect(env.data.GPS_TIMEOUT).toBeTruthy();
//     expect(env.data.GPS_MAXIMUM_AGE).toBeTruthy();
//     expect(env.data.GPS_HIGH_ACCURACY).toBeTruthy();
//     expect(env.data.GPS_DISTANCE_FILTER).toBeTruthy();
//     expect(env.data.GPS_USE_SIGNIFICANT_CHANGES).toBeTruthy();
//   });

//   it('emits custom-gps if saveGPS is enabled', () => {
//     getSettings = () => ({
//       saveGPS: true,
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);

//     const saved = (env.project.saveEvent as jest.Mock<any, any>).mock.calls[0][0] as GenericEvent<{}>;
//     expect(saved.kind).toBe('generic');
//     expect(saved.getData().type).toBe('custom-gps');
//   });

//   it('stores CURRENT_GPS_POSITION on ScriptData', () => {
//     // clear if the value is already set
//     env.data.CURRENT_GPS_POSITION = undefined;

//     getSettings = () => ({});
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     expect(env.data.CURRENT_GPS_POSITION).toBeFalsy();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());
//     expect(env.data.CURRENT_GPS_POSITION).toBeTruthy();
//     const data = env.data.CURRENT_GPS_POSITION as Record<string, unknown>;
//     expect(data.accuracy).toBe(1);
//     expect(data.altitude).toBe(1);
//     expect(data.latitude).toBe(1);
//     expect(data.longitude).toBe(1);
//     expect(data.heading).toBe(1);
//     expect(data.speed).toBe(1);
//     expect(data.when).toBeGreaterThan(0);
//   });

//   it('sends only one update every X mins if saveEveryMins is set', () => {
//     getSettings = () => ({
//       saveGPS: true,
//       saveEveryMins: 1 / 60, // one second
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     jest.setSystemTime(new Date('2020-01-01 00:00:00'));
//     messages.emit('onEvent', new MockGPSEvent());
//     messages.emit('onEvent', new MockGPSEvent());
//     messages.emit('onEvent', new MockGPSEvent());
//     messages.emit('onEvent', new MockGPSEvent());
//     messages.emit('onEvent', new MockGPSEvent());
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);
//     jest.setSystemTime(new Date('2020-01-01 00:00:01'));
//     messages.emit('onEvent', new MockGPSEvent());
//     messages.emit('onEvent', new MockGPSEvent());
//     messages.emit('onEvent', new MockGPSEvent());
//     expect(env.data.LAST_GPS_UPDATE).toBeGreaterThan(0);
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);

//     jest.setSystemTime(new Date('2020-01-01 00:01:00'));
//     messages.emit('onEvent', new MockGPSEvent());
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(2);
//   });

//   it('emits GeofenceEvent when entering and exiting geofence if enableGeofences is enabled', () => {
//     getSettings = () => ({
//       enableGeofences: true,
//       geofences: [{
//         name: 'testfence',
//         kind: 'default',
//         wkt: complexFence,
//       }]
//     });

//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };

//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent(pointInside[0], pointInside[1]));

//     expect(colStore['testfence']).toBeTruthy();
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);
//     const call = (env.project.saveEvent as jest.Mock<any, any>).mock.calls[0];
//     expect(call[0].kind).toBe('geofence');
//     expect(call[0].getData().entering).toBe(true);
//     expect(call[0].getData().exiting).toBe(false);

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent(pointOutside[0], pointOutside[1]));

//     expect(colStore['testfence']).toBeFalsy();
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(2);
//     const call2 = (env.project.saveEvent as jest.Mock<any, any>).mock.calls[1];
//     expect(call2[0].kind).toBe('geofence');
//     expect(call2[0].getData().entering).toBe(false);
//     expect(call2[0].getData().exiting).toBe(true);
//   });

//   it('emits GeofenceEvent when entering and exiting geofence if any geofence tag matches', () => {
//     getSettings = () => ({
//       enableGeofences: true,
//       geofences: [{
//         name: 'testfence',
//         kind: 'default',
//         wkt: complexFence,
//         tags: ['foo', 'bar', 'zaz']
//       }]
//     });

//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };

//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn(),
//       usersManager: {
//         users: [{
//           $modelId: 'TEST',
//           tags: ['zaz'],
//         }]
//       }
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent(pointInside[0], pointInside[1]));

//     expect(colStore['testfence']).toBeTruthy();
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);
//     const call = (env.project.saveEvent as jest.Mock<any, any>).mock.calls[0];
//     expect(call[0].kind).toBe('geofence');
//     expect(call[0].getData().entering).toBe(true);
//     expect(call[0].getData().exiting).toBe(false);

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent(pointOutside[0], pointOutside[1]));

//     expect(colStore['testfence']).toBeFalsy();
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(2);
//     const call2 = (env.project.saveEvent as jest.Mock<any, any>).mock.calls[1];
//     expect(call2[0].kind).toBe('geofence');
//     expect(call2[0].getData().entering).toBe(false);
//     expect(call2[0].getData().exiting).toBe(true);
//   });

//   it('does NOT emit GeofenceEvent when entering and exiting geofence if no geofence tag matches', () => {
//     getSettings = () => ({
//       enableGeofences: true,
//       geofences: [{
//         name: 'testfence',
//         kind: 'default',
//         wkt: 'POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))',
//         tags: ['foo', 'bar', 'zaz']
//       }]
//     });

//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };

//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn(),
//       usersManager: {
//         users: [{
//           $modelId: 'TEST',
//           tags: ['some-other-tag'],
//         }]
//       }
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(colStore['testfence']).not.toBeDefined();
//     expect(env.project.saveEvent).not.toHaveBeenCalledTimes(1);

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent(200, 200));

//     expect(colStore['testfence']).not.toBeDefined();
//     expect(env.project.saveEvent).not.toHaveBeenCalledTimes(2);
//   });

//   it('emits SpeedExcessEvent when speed is over the limit if enableSpeedExcess is enabled', () => {
//     getSettings = () => ({
//       enableGeofences: true,
//       geofences: [{
//         name: 'speedfence',
//         kind: 'speedLimit',
//         wkt: 'POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))',
//         speedLimit: 0.42,
//       }]
//     });

//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };

//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);
//     const call = (env.project.saveEvent as jest.Mock<any, any>).mock.calls[0];
//     expect(call[0].kind).toBe('speed-excess');
//     expect(call[0].getData().gps.speed).toBe(1);
//     expect(call[0].getData().speedLimit).toBe(0.42);
//   });

//   it('emits SpeedExcessEvent when speed is over the limit speedLimit is set', () => {
//     getSettings = () => ({
//       speedLimit: 0.42,
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);
//     const call = (env.project.saveEvent as jest.Mock<any, any>).mock.calls[0];
//     expect(call[0].kind).toBe('speed-excess');
//     expect(call[0].getData().name).toBe('default');
//     expect(call[0].getData().gps.speed).toBe(1);
//     expect(call[0].getData().speedLimit).toBe(0.42);
//   });
// });

// describe('impossible values', () => {
//   afterEach(() => {
//     messages.removeAllListeners();
//     conf.reload();
//   });

//   it('does not block normal events when speed is normal', () => {
//     getSettings = () => ({
//       speedLimit: 0.42,
//       impossible: [{
//         tags: [],
//         maxSpeed: 99999,
//       }],
//     });

//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(env.project.saveEvent).toHaveBeenCalled();
//   });

//   it('applies to all gps events when no tag is set', () => {
//     getSettings = () => ({
//       speedLimit: 0.00001,
//       impossible: [{
//         tags: [],
//         maxSpeed: 0.1,
//       }],
//     });

//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: jest.fn(),
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(env.project.saveEvent).not.toHaveBeenCalled();
//   });

//   describe('applies speedlimit only to device tags', () => {
//     beforeAll(() => {
//       getSettings = () => ({
//         speedLimit: 0.00001,
//         impossible: [{
//           tags: ['impossible-tag'],
//           maxSpeed: 0.1,
//         }],
//       });
//     });

//     afterEach(() => {
//       messages.removeAllListeners();
//       conf.reload();
//     });

//     it('does not apply to untagged devices', () => {
//       const colStore = {} as Record<any, any>;
//       const mockCol = {
//         get() {
//           return {
//             data: colStore,
//             get: (k: string) => colStore[k],
//             set: (k: string, v: any) => (colStore[k] = v),
//           }
//         }
//       };
//       (env.project as any) = {
//         collectionsManager: {
//           ensureExists: () => mockCol,
//         },
//         saveEvent: jest.fn(),
//         usersManager: {
//           users: [{
//             $modelId: 'TEST',
//             tags: [],
//           }]
//         }
//       };

//       loadScript();
//       messages.emit('onInit');
//       messages.emit('onEvent', new MockGPSEvent());

//       // only 
//       expect(env.project.saveEvent).toHaveBeenCalled();
//     });

//     it('applies to matching tagged devices', () => {
//       (env.project as any) = {
//         collectionsManager: {
//           ensureExists: jest.fn(),
//         },
//         saveEvent: jest.fn(),
//         usersManager: {
//           users: [{
//             $modelId: 'TEST',
//             tags: ['impossible-tag'],
//           }]
//         }
//       };

//       loadScript();
//       messages.emit('onInit');
//       messages.emit('onEvent', new MockGPSEvent());

//       expect(env.project.saveEvent).not.toHaveBeenCalled();
//     });
//   });
// });

// describe("signal quality filters", () => {
//   afterEach(() => {
//     messages.removeAllListeners();
//     conf.reload();
//   });

//   it("omitNotGPS=true omits signals from NOT the gps", () => {
//     getSettings = () => ({
//       saveGPS: true,
//       omitNotGPS: true,
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent(1, 1, -1));
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(0);
//   });

//   it("maxAccuracy=10 omits signals with higher level of accuracy", () => {
//     getSettings = () => ({
//       saveGPS: true,
//       maxAccuracy: 10
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };

//     loadScript();
//     messages.emit('onInit');

//     // over the limit
//     jest.setSystemTime(new Date('2020-01-01 00:00:00'));
//     messages.emit('onEvent', new MockGPSEvent(1, 1, 11));
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(0);

//     // exactly the limit
//     jest.setSystemTime(new Date('2020-01-01 00:01:00'));
//     messages.emit('onEvent', new MockGPSEvent(1, 1, 10));
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);

//     // under the limit
//     jest.setSystemTime(new Date('2020-01-01 00:02:00'));
//     messages.emit('onEvent', new MockGPSEvent(1, 1, 9));
//     expect(env.project.saveEvent).toHaveBeenCalledTimes(2);
//   });
// });

// describe("pre-alert", () => {
//   afterEach(() => {
//     messages.removeAllListeners();
//     conf.reload();
//   });

//   it('does NOT show pre-alert if speedPreLimit == 0', () => {
//     getSettings = () => ({
//       speedPreLimit: 0,
//       speedLimit: 10,
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };
//     platform.setUrgentNotification = jest.fn();

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(env.project.saveEvent).not.toHaveBeenCalled();
//     expect(platform.setUrgentNotification).not.toHaveBeenCalled();
//   });

//   it('shows pre-alert if speedPreLimit > 0', () => {
//     getSettings = () => ({
//       speedPreLimit: 0.42,
//       speedLimit: 10,
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };
//     platform.setUrgentNotification = jest.fn();

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     // expect(env.project.saveEvent).not.toHaveBeenCalled();
//     expect(platform.setUrgentNotification).toHaveBeenCalledTimes(1);

//     const call = (platform.setUrgentNotification as jest.Mock<any, any>).mock.calls[0];
//     expect(call[0].title).toBe('Perto do límite de velocidade para: Global');
//   });

//   it('shows pre-alert if speedPreLimit > 0, on a geofence', () => {
//     getSettings = () => ({
//       enableGeofences: true,
//       speedPreLimit: 0,
//       speedLimit: 10000,
//       geofences: [{
//         name: 'speedfence',
//         kind: 'speedLimit',
//         wkt: 'POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))',
//         speedLimit: 10,
//         speedPreLimit: 0.42,
//       }]
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };
//     platform.setUrgentNotification = jest.fn();

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     // expect(env.project.saveEvent).not.toHaveBeenCalled();
//     expect(platform.setUrgentNotification).toHaveBeenCalledTimes(1);

//     const call = (platform.setUrgentNotification as jest.Mock<any, any>).mock.calls[0];
//     expect(call[0].title).toBe('Perto do límite de velocidade para: speedfence');
//   });

//   it('does NOT show pre-alert if speedPreLimit == 0, on a geofence', () => {
//     getSettings = () => ({
//       enableGeofences: true,
//       geofences: [{
//         name: 'speedfence',
//         kind: 'speedLimit',
//         wkt: 'POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))',
//         speedLimit: 10,
//         speedPreLimit: 0,
//       }]
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };
//     platform.setUrgentNotification = jest.fn();

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(env.project.saveEvent).not.toHaveBeenCalled();
//     expect(platform.setUrgentNotification).not.toHaveBeenCalled();
//   });

//   it('does NOT show pre-alert if speed reaches speedLimit and surpasses speedPreLimit', () => {
//     getSettings = () => ({
//       enableGeofences: true,
//       geofences: [{
//         name: 'speedfence',
//         kind: 'speedLimit',
//         wkt: 'POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))',
//         speedLimit: 0.42,
//         speedPreLimit: 0.10,
//       }]
//     });
//     const colStore = {} as Record<any, any>;
//     const mockCol = {
//       get() {
//         return {
//           data: colStore,
//           get: (k: string) => colStore[k],
//           set: (k: string, v: any) => (colStore[k] = v),
//         }
//       }
//     };
//     (env.project as any) = {
//       collectionsManager: {
//         ensureExists: () => mockCol,
//       },
//       saveEvent: jest.fn()
//     };
//     platform.setUrgentNotification = jest.fn();

//     loadScript();
//     messages.emit('onInit');
//     messages.emit('onEvent', new MockGPSEvent());

//     expect(env.project.saveEvent).toHaveBeenCalledTimes(1);
//     expect(platform.setUrgentNotification).not.toHaveBeenCalled();
//   });
// });