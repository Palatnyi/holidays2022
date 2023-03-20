import _ from 'lodash';
import logger from 'node-color-log';
console.log('ENV:', process.env.CURRENT_ENV);

const chat_id = process.env.POI_Palanok

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
      logger.info('getAlertById - success', data);
    } catch (e) {
      logger.error('error during request alert by ID', e.message);
    }

    return data;
  }

  findRemoteDevice = (alert) => {
    const detections = _.get(alert, 'detections', []);
    return detections.find(detection => {
      return _.get(detection, 'identification.detectionType') === 'remote'
    });
  }

  getPositionDetails = (positions) => {

    const lastPosition = _.chain(positions)
      .last()
      .value();

    return {
      timestamp: _.get(lastPosition, 'timestamp'),
      coordinates: _.get(lastPosition, 'geoLocation.coordinates', {})
    }
  }

  getAeroscopeSensorData = (alert) => {
    return _.chain(alert)
      .get('summary.sensors')
      .find(sensor => sensor.sensorType === 'aeroscope')
      .value()
  }

  getReplyMarkup = ({ latitude, longitude }) => {
    const hasCoordinates = Boolean(latitude) && Boolean(longitude);
    const inline_keyboard = [[
      {
        text: 'Переглянути у Гугл мапі',
        url: `http://www.google.com/maps/place/${latitude},${longitude}`,
        callback_data: 'ololo'
      }
    ]];

    return hasCoordinates ? { reply_markup: { inline_keyboard }, parse_mode: 'HTML' } : undefined;
  }

  sendMessageToActivatedZone = async ({
    latitude,
    longitude,
    timestamp,
    modelLabel,
    serialNumber,
  }) => {
    const result = [];
    const time = new Date(timestamp).toLocaleString('uk', { timeZone: 'Europe/Kiev' });

    try {
      result.push({
        chat_id,
        modelLabel,
        serialNumber,
      });
      await this._bot.sendMessage(
          chat_id,
          `❗️❗️❗️\n <b>Виявлено оператора ворожого БПЛА</b>\n \nЧас: ${time} \nКординати: <b>${latitude} ${longitude}</b>  \nМодель: ${modelLabel || ''} \nСерійний номер: ${serialNumber || ''}`,
          this.getReplyMarkup({ longitude, latitude })
      )
      logger.info(`Coordinates sent to the chat - ${chat_id}`)

    } catch (err) {
      logger.error(`Failed to send message to the chat`);
      console.log(err);
    }

    return result;
  }


  sendMessagesV2 = async (alertId) => {
    logger.bold().info(`new alert: ${alertId}`);

    const alert = await this.getAlertById(alertId);
    if (!alert) {
      logger.info(`alert with - ${alertId} id does not exist`);
      return `alert with - ${alertId} id does not exist`;
    }

    const remoteDevice = this.findRemoteDevice(alert);
    if (!remoteDevice) {
      logger.info('alert does not contain remote device')
      return 'alert does not contain remote device';
    }

    const { positions = [] } = remoteDevice;
    const { coordinates, timestamp } = this.getPositionDetails(positions);
    const label = _.get(remoteDevice, 'identification.label');
    const serialNumber = _.get(remoteDevice, 'identification.serialnumber');
    const [longitude, latitude] = coordinates;


    const result = await this.sendMessageToActivatedZone({
      latitude,
      longitude,
      timestamp,
      serialNumber,
      activatedZones,
      modelLabel: label
    });

    return result;

  }

}

export default FlightActivityTracker;
