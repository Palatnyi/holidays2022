import lodash from 'lodash';
import logger from 'node-color-log'
import TelegramBot from 'node-telegram-bot-api';
console.log('ENV:', process.env.currentEnv);


const chats_ids_to_zones = process.env.currentEnv === 'TEST' ? {
  'PPV_Monitor': '-1001842709527',
  'Kinburg_Monitor': '-1001842709527'
} : {
  'PPV_Monitor': '-1001854428561',
  'Kinburg_Monitor': '-1001854428561'
};

const bot = new TelegramBot('5972043094:AAFmve7rOT-SZGu8BABR5C8nwKUcxPN_Tow')

class FlightActivityTracker {
  isAeroscopeAffected = (affectedSensors) => {
    return !!Object.values(affectedSensors).find(({ type }) => type === 'aeroscope');
  }

  sendMessages = async (data) => {
    const { zones = [], detections = [], affectedSensors = {} } = data;
    const { last } = lodash;

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

    const latestPosition = last(positions);
    const { latitude, longitude } = latestPosition;

    const result = [];
    console.log(chats_ids_to_zones)

    for (let zone of zones) {
      const { label } = zone;
      const chat_id = chats_ids_to_zones[label]

      if (chat_id) {

        try {

          await bot.sendMessage(
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