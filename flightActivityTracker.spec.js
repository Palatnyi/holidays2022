import mocha from 'mocha';
import sinon from 'sinon';
import axios from 'axios';
import assert from 'node:assert';
import TelegramBot from 'node-telegram-bot-api';
import FlightActivityTracker from './flightActivityTracker.js';


describe('FlightActivityTracker v2 test suite', () => {
  let flt;
  let bot;
  let axiosInstance;
  const sandbox = sinon.createSandbox();

  beforeEach('new FlightActivityTracker', () => {
    bot = new TelegramBot(process.env.BOT_TOKEN);
    axiosInstance = axios.create({
      baseURL: 'https://dt.snitch.tk/api/1.0/',
      headers: { 'Dedrone-Auth-Token': process.env.DEDRONE_AUTH_TOKEN }
    });
    flt = new FlightActivityTracker(bot, axiosInstance);
  })

  afterEach(() => {
    sandbox.restore();
    flt = null;
    bot = null;
    axiosInstance = null;
  });

  it('shoud get alert by id', async () => {
    const alertIdTest = `6379736d6d64d44a8f343e46`;
    const data = await flt.getAlertById(alertIdTest);
    assert.equal(data._id, alertIdTest);
  });

  it('shoud NOT get alert by invalid id', async () => {
    const alertIdTest = `invalid_id`;
    const data = await flt.getAlertById(alertIdTest);
    assert.equal(data, undefined);
  });

  it('"findRemoteDevice" should find alert with REMOTE detectionType', async () => {
    const alert = {
      detections: [
        {
          identification: {
            detectionType: 'remote'
          }
        }
      ]
    };

    const remoteDevice = flt.findRemoteDevice(alert);

    assert.equal(remoteDevice.identification.detectionType, 'remote');

  });

  it('"findRemoteDevice" should NOT find alert with REMOTE detectionType', async () => {
    const alert = {
      detections: [
        {
          identification: {
            detectionType: 'drone'
          }
        }
      ]
    };

    const remoteDevice = flt.findRemoteDevice(alert);

    assert.equal(remoteDevice, undefined);

  });


  it('"getPositionDetails" should return latest coordintes', () => {
    const positions = [{
      timestamp: 123,
      geoLocation: {
        coordinates: [1, 2]
      }
    }, {
      timestamp: 456,
      geoLocation: {
        coordinates: [3, 4]
      }
    }];

    const { coordinates, timestamp } = flt.getPositionDetails(positions);

    assert.deepEqual(coordinates, [3, 4]);
    assert.deepEqual(timestamp, 456);

  })


  it('"getAeroscopeSensorData" should return aeroscope data', () => {
    const alert = {
      summary: {
        sensors: [{
          sensorType: 'aeroscope'
        }]
      }
    };

    const aeroscopeData = flt.getAeroscopeSensorData(alert);

    assert.equal(aeroscopeData.sensorType, 'aeroscope');
  });


  it('"getAeroscopeSensorData" should NOT return aeroscope data', () => {
    const alert = {
      summary: {
        sensors: [{
          sensorType: 'radio'
        }]
      }
    };

    const aeroscopeData = flt.getAeroscopeSensorData(alert);

    assert.equal(aeroscopeData, undefined);
  });

  it('"sendMessageToActivatedZone" should send messages to the all chatd from the activatedZone array', async () => {
    const latitude = 4;
    const longitude = 5;
    const activatedZones = [{
      label: 'PPV_Monitor'
    },
    {
      label: 'Kinburg_Monitor'
    }, {
      label: 'OUR_Monitor_Herson'
    },
    {
      label: 'OUR_Kryvyi_Rig'
    }, {
      label: 'Monitor_Herson'
    }, {
      label: 'Monitor_Kinburg'
    }];

    const result = await flt.sendMessageToActivatedZone({
      latitude, longitude, activatedZones, timestamp: Date.now(),
      serialNumber: 4444, modelLabel: 'ololo'
    });

    assert.deepEqual(result, [
      {
        serialNumber: 4444,
        modelLabel: 'ololo',
        zone: 'PPV_Monitor',
        chat_id: '-1001842709527',
      },
      {
        serialNumber: 4444,
        modelLabel: 'ololo',
        zone: 'Kinburg_Monitor',
        chat_id: '-1001842709527',
      },
      {
        serialNumber: 4444,
        modelLabel: 'ololo',
        zone: 'OUR_Monitor_Herson',
        chat_id: '-1001842709527',
      },
      {
        serialNumber: 4444,
        modelLabel: 'ololo',
        zone: 'OUR_Kryvyi_Rig',
        chat_id: '-1001842709527',
      },
      {
        serialNumber: 4444,
        modelLabel: 'ololo',
        zone: 'Monitor_Herson',
        chat_id: '-1001842709527',
      },
      {
        serialNumber: 4444,
        modelLabel: 'ololo',
        zone: 'Monitor_Kinburg',
        chat_id: '-1001842709527',
      }
    ])

  });

});


// describe('FlightActivityTracker test suite', () => {
//   let flt;
//   let bot;
//   const sandbox = sinon.createSandbox();

//   beforeEach('new FlightActivityTracker', () => {
//     bot = new TelegramBot(process.env.BOT_TOKEN);
//     flt = new FlightActivityTracker(bot);
//   })

//   afterEach(() => {
//     sandbox.restore();
//     flt = null;
//   });


//   it('"sendMessages" method should return - "no zones property" string', async () => {
//     const alert = {};
//     const res = await flt.sendMessages(alert);

//     assert.deepEqual(res, { msg: 'no zones property' });

//   });

//   it('"sendMessages" method should return - "no detections property" string', async () => {
//     const alert = {
//       zones: ['zone_1']
//     };

//     const res = await flt.sendMessages(alert);

//     assert.deepEqual(res, { msg: 'no detections property' });
//   });

//   it('"sendMessages" method should return - "no aerospose\'s detections" string', async () => {
//     const alert = {
//       zones: ['zone_1'],
//       detections: [{
//         detectionType: 'remote'
//       }, {
//         detectionType: 'drone'
//       }],
//       affectedSensors: [{
//         aeroscope: {
//           type: '!aeroscope'
//         }
//       }]
//     };

//     const res = await flt.sendMessages(alert);

//     assert.deepEqual(res, { msg: 'no aerospose\'s detections' });
//   });


//   it('"sendMessages" method should NOT return - "no aerospose\'s detections" string', async () => {
//     const alert = {
//       zones: ['zone_1'],
//       detections: [{
//         detectionType: 'remote'
//       }, {
//         detectionType: 'drone'
//       }],
//       affectedSensors: [{
//         aeroscope: {
//           type: 'aeroscope'
//         }
//       }]
//     };

//     const res = await flt.sendMessages(alert);

//     assert.deepEqual(res, { msg: 'no aerospose\'s detections' });
//   });


//   it('"sendMessages" method should  return - "no remote found in the current alert" string', async () => {
//     const alert = {
//       zones: ['zone_1'],
//       detections: [{
//         detectionType: 'drone'
//       }],
//       affectedSensors: {
//         aeroscope: {
//           type: 'aeroscope'
//         },
//         radio: {
//           type: 'ololo'
//         }
//       }
//     };

//     const res = await flt.sendMessages(alert);

//     assert.deepEqual(res, { msg: 'no remote found in the current alert' });
//   });

//   it('"sendMessages" method should  return - "The "positions" array is empty" string', async () => {
//     const alert = {
//       zones: ['zone_1'],
//       detections: [{
//         detectionType: 'drone',
//       }],
//       affectedSensors: {
//         aeroscope: {
//           type: 'aeroscope'
//         },
//         radio: {
//           type: 'ololo'
//         }
//       }
//     };

//     const res = await flt.sendMessages(alert);

//     assert.deepEqual(res, { msg: 'no remote found in the current alert' });
//   });

//   it('"sendMEssages" shoud send two messages to two', async () => {
//     const alert = {
//       zones: [{
//         label: 'PPV_Monitor'
//       },
//       {
//         label: 'Kinburg_Monitor'
//       }],
//       detections: [{
//         detectionType: 'remote',
//         positions: [
//           { latitude: '50.4555779', longitude: '30.5333228,15' }
//         ]
//       }],
//       affectedSensors: {
//         aeroscope: {
//           type: 'aeroscope'
//         },
//         radio: {
//           type: 'radio'
//         }
//       }
//     };

//     const res = await flt.sendMessages(alert);

//     const chat_id = '-1001842709527';
//     const expectedRes = [{
//       chat_id,
//       zone: 'PPV_Monitor'
//     }, {
//       chat_id,
//       zone: 'Kinburg_Monitor'
//     }];

//     assert.deepEqual(res, expectedRes);

//   })

// });