import _ from 'lodash';
import logger from 'node-color-log';
console.log('ENV:', process.env.CURRENT_ENV);

const chats_ids_to_zones = process.env.CURRENT_ENV === 'TEST' ? {
  'PPV_Monitor': '-1001842709527',
  'Kinburg_Monitor': '-1001842709527'
} : {
  'PPV_Monitor': '-1001854428561',
  'Kinburg_Monitor': '-1001854428561'
};



class FlightActivityTracker {
  constructor(bot, axios) {
    this._bot = bot;
    this._axios = axios;
  }

  isAeroscopeAffected = (affectedSensors) => {
    return !!Object.values(affectedSensors).find(({ type }) => type === 'aeroscope');
  }

  getAlertById = async (alertId) => {
    let data;
    try {
      const response = await this._axios.get(`alerts/${alertId}`);
      data = response.data;
    } catch (e) {
      logger.error('error during request aalert by ID', e.message);
    }

    return data;
  }

  findRemoteDevice = (alert) => {
    const detections = _.get(alert, 'detections', []);
    return detections.find(detection => {
      return _.get(detection, 'identification.deviceType') === 'remote'
    });
  }


  getFreshCoordinates = (positions) => {
    return _.chain(positions)
      .last()
      .get('geoLocation.coordinates')
      .value();
  }

  getAeroscopeSensorData = (alert) => {
    return _.chain(alert)
      .get('summary.sensors')
      .find(sensor => sensor.type === 'aeroscope')
      .value()
  }

  sendMessageToActivatedZone = async ({ activatedZones, longitude, latitude }) => {
    const result = [];
    for (let zone of activatedZones) {
      const { label } = zone;
      const chat_id = chats_ids_to_zones[label]

      if (chat_id) {

        try {

          await this._bot.sendMessage(
            chat_id,
            `${latitude} ${longitude}`
          )

          logger.info(`Coordinates sent to the chat - ${chat_id}`)
          result.push({
            chat_id,
            zone: label,
          });

        } catch (e) {
          logger.error(`Failed to send message to the zone: ${label}`, err);
        }

      }
    };

    return result;
  }


  sendMessagesV2 = async (alertId) => {

    const alert = await this.getAlertById(alertId);
    if (!alert) {
      logger.info(`alert with - ${alertId} id does not exist`);
      return `alert with - ${alertId} id does not exist`;
    }

    const { activatedZones = [] } = alert;
    if (!activatedZones.length) {
      logger.info('NO zones were affected');
      return 'NO zones were affected';
    }

    const remoteDevice = findRemoteDevice(alert);
    if (!remoteDevice) {
      logger.info('alert does not contain remote device')
      return 'alert does not contain remote device';
    }

    const { positions = [] } = remoteDevice;
    if (!positions.length) {
      logger.info('positions is absent for remote device');
      return 'positions is absent for remote device';
    }


    const aeroscopeData = this.getAeroscopeSensorData(alert);
    if (!aeroscopeData) {
      logger.info('aeroscope have not been involved into detection');
      return 'aeroscope have not been involved into detection';
    }


    const [longitude, latitude] = this.getFreshCoordinates(positions);

    const result = await sendMessageToActivatedZone({ longitude, latitude, activatedZones });

    return result


  }


  sendMessages = async (data) => {
    const { zones = [], detections = [], affectedSensors = {} } = data;

    if (!zones.length) {
      logger.warn('The <b>"zones"</b> property is empty');
      return { msg: 'no zones property' }
    }

    if (!detections.length) {
      logger.warn('"The <b>detections</b>" property is empty');
      return { msg: 'no detections property' }
    }

    //TEMPORARY
    if (!this.isAeroscopeAffected(affectedSensors)) {
      logger.warn('Aeroscope sensor have not been affected');
      return { msg: 'no aerospose\'s detections' };
    }

    const detection = detections.find(det => {
      return det.detectionType === 'remote'
    });

    if (!detection) {
      logger.warn('No remote detectionType found.');
      return { msg: 'no remote found in the current alert' }
    }

    const { positions = [] } = detection;

    if (!positions.length) {
      logger.warn('The "positions" array is empty');
      return { msg: 'The "positions" array is empty' }
    }

    const latestPosition = _.last(positions);
    const { latitude, longitude } = latestPosition;

    console.log(chats_ids_to_zones)

    const result = [];
    for (let zone of zones) {
      const { label } = zone;
      const chat_id = chats_ids_to_zones[label]

      if (chat_id) {

        try {

          await this._bot.sendMessage(
            chat_id,
            `${latitude} ${longitude}`
          )

          logger.info(`Coordinates sent to the chat - ${chat_id}`)
          result.push({
            chat_id,
            zone: label,
          });

        } catch (e) {
          logger.error(`Failed to send message to the zone: ${label}`, err);
        }

      }
    };

    return result;

  }

}

export default FlightActivityTracker;