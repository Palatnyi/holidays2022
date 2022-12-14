import _ from 'lodash';
import logger from 'node-color-log';
console.log('ENV:', process.env.CURRENT_ENV);

const chats_ids_to_zones = process.env.CURRENT_ENV === 'TEST' ? {
  'PPV_Monitor': -1001842709527,
  'Kinburg_Monitor': -1001842709527,
  'OUR_Monitor_Herson': -1001842709527,
  'OUR_Kryvyi_Rig': -1001842709527,
  'Monitor_Herson': -1001842709527,
  'Monitor_Kinburg': -1001842709527
} : {
  'PPV_Monitor': process.env.PPV_MONITOR,
  'Kinburg_Monitor': process.env.KINGBURG_MONITOR,
  'OUR_Monitor_Herson': process.env.OUR_MONITOR_HERSON,
  'OUR_Kryvyi_Rig': process.env.OUR_KRYVYI_RIG,
  'Monitor_Herson': process.env.MONITOR_HERSON,
  'Monitor_Kinburg': process.env.MONITOR_KINBURG
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
      coordinates: _.get(lastPosition, 'geoLocation.coordinates')
    }
  }

  getAeroscopeSensorData = (alert) => {
    return _.chain(alert)
      .get('summary.sensors')
      .find(sensor => sensor.sensorType === 'aeroscope')
      .value()
  }

  getReplyMarkup = ({ latitude, longitude }) => {
    const reply_markup = [[
      {
        text: 'Переглянути у Гугл мапі',
        url: `http://www.google.com/maps/place/${latitude},${longitude}`,
        callback_data: 'ololo'
      }
    ]];

    return reply_markup;
  }

  sendMessageToActivatedZone = async ({
    latitude,
    longitude,
    timestamp,
    modelLabel,
    serialNumber,
    activatedZones,
  }) => {
    const result = [];
    for (let zone of activatedZones) {
      const { label } = zone;
      const chat_id = chats_ids_to_zones[label] + '';
      const time = new Date(timestamp).toLocaleString('uk', { timeZone: 'Europe/Kiev' });

      if (chat_id) {
        try {
          await this._bot.sendMessage(
            chat_id,
            `❗️❗️❗️\n <b>Виявлено оператора ворожого БПЛА</b>\n \nЧас: ${time} \nКординати: <b>${latitude} ${longitude}</b>  \nМодель: ${modelLabel || ''} \nСерійний номер: ${serialNumber || ''} \nЗона виявлення: ${label}`,
            {
              reply_markup: { inline_keyboard: this.getReplyMarkup({ longitude, latitude }) },
              parse_mode: 'HTML'
            }
          )

          logger.info(`Coordinates sent to the chat - ${chat_id}`)
          result.push({
            chat_id,
            modelLabel,
            zone: label,
            serialNumber,
          });

        } catch (err) {
          logger.error(`Failed to send message to the zone: ${label}`);
          console.log(err);
        }

      }
    };

    return result;
  }


  sendMessagesV2 = async (alertId) => {
    logger.bold().info(`new alert: ${alertId}`);

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

    const remoteDevice = this.findRemoteDevice(alert);
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