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
    console.log(process.env.BASE_URL ,'process.env.BASE_URL');
    axiosInstance = axios.create({
      baseURL: process.env.BASE_URL,
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
    const alertIdTest = `6415cc5fff8a76240c477181`;
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


  it.skip('"getAeroscopeSensorData" should return aeroscope data', () => {
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


  it.skip('"getAeroscopeSensorData" should NOT return aeroscope data', () => {
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

    const result = await flt.sendMessageToActivatedZone({
      latitude, longitude, timestamp: Date.now(),
      serialNumber: 4444, modelLabel: 'ololo'
    });

    assert.deepEqual(result, [
      {
        serialNumber: 4444,
        modelLabel: 'ololo',
        chat_id: process.env.POI_Palanok,
      },
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