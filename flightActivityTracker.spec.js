import mocha from 'mocha';
import sinon from 'sinon';
import assert from 'node:assert';
import FlightActivityTracker from './flightActivityTracker.js';

describe('FlightActivityTracker test suite', () => {
  let flt;
  const sandbox = sinon.createSandbox();

  beforeEach('new FlightActivityTracker', () => {
    flt = new FlightActivityTracker();
  })

  afterEach(() => {
    sandbox.restore();
    flt = null;
  });


  it('"sendMessages" method should return - "no zones property" string', async () => {
    const alert = {};
    const res = await flt.sendMessages(alert);

    assert.deepEqual(res, { msg: 'no zones property' });

  });

  it('"sendMessages" method should return - "no detections property" string', async () => {
    const alert = {
      zones: ['zone_1']
    };

    const res = await flt.sendMessages(alert);

    assert.deepEqual(res, { msg: 'no detections property' });
  });

  it('"sendMessages" method should return - "no aerospose\'s detections" string', async () => {
    const alert = {
      zones: ['zone_1'],
      detections: [{
        detectionType: 'remote'
      }, {
        detectionType: 'drone'
      }],
      affectedSensors: [{
        aeroscope: {
          type: '!aeroscope'
        }
      }]
    };

    const res = await flt.sendMessages(alert);

    assert.deepEqual(res, { msg: 'no aerospose\'s detections' });
  });


  it('"sendMessages" method should NOT return - "no aerospose\'s detections" string', async () => {
    const alert = {
      zones: ['zone_1'],
      detections: [{
        detectionType: 'remote'
      }, {
        detectionType: 'drone'
      }],
      affectedSensors: [{
        aeroscope: {
          type: 'aeroscope'
        }
      }]
    };

    const res = await flt.sendMessages(alert);

    assert.deepEqual(res, { msg: 'no aerospose\'s detections' });
  });


  it('"sendMessages" method should  return - "no remote found in the current alert" string', async () => {
    const alert = {
      zones: ['zone_1'],
      detections: [{
        detectionType: 'drone'
      }],
      affectedSensors: {
        aeroscope: {
          type: 'aeroscope'
        },
        radio: {
          type: 'ololo'
        }
      }
    };

    const res = await flt.sendMessages(alert);

    assert.deepEqual(res, { msg: 'no remote found in the current alert' });
  });

  it('"sendMessages" method should  return - "The "positions" array is empty" string', async () => {
    const alert = {
      zones: ['zone_1'],
      detections: [{
        detectionType: 'drone',
      }],
      affectedSensors: {
        aeroscope: {
          type: 'aeroscope'
        },
        radio: {
          type: 'ololo'
        }
      }
    };

    const res = await flt.sendMessages(alert);

    assert.deepEqual(res, { msg: 'no remote found in the current alert' });
  });

  it('"sendMEssages" shoud send two messages to two', async () => {
    const alert = {
      zones: [{
        label: 'PPV_Monitor'
      },
      {
        label: 'Kinburg_Monitor'
      }],
      detections: [{
        detectionType: 'remote',
        positions: [
          { latitude: '50.4555779', longitude: '30.5333228,15' }
        ]
      }],
      affectedSensors: {
        aeroscope: {
          type: 'aeroscope'
        },
        radio: {
          type: 'radio'
        }
      }
    };

    const res = await flt.sendMessages(alert);

    const chat_id = '-1001842709527';
    const expectedRes = [{
      chat_id,
      zone: 'PPV_Monitor'
    }, {
      chat_id,
      zone: 'Kinburg_Monitor'
    }];

    assert.deepEqual(res, expectedRes);

  })

});