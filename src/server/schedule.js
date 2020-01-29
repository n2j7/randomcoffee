import { CronJob } from 'cron';
import { getChannelsList } from './channelModel';
import { getConfig } from './config';
import {
    randomLightMatch,
    extraLightMatch,
    closeLightEvent
} from './adminCommands';

let cron_pool = {};
let bot_runned_in_channels =[];
const CONFIG = getConfig()

export function registerSchedule({ channel_id, job_name, schedule, timezone, job_cb }) {
    const job = new CronJob(
        schedule,
        job_cb,
        () => { console.log(`CRON job for channel_id ${channel_id} complete!`); },
        false,// do not start job
        timezone
    );
    job.start();

    // cancel previous job
    if (cron_pool[`${channel_id}${job_name}`]) {
        cron_pool[`${channel_id}${job_name}`].stop();
    }
    cron_pool[`${channel_id}${job_name}`] = job;
}

export function initScheduleOnStartup() {
    getChannelsList()
        .then((channels) => {
            channels.map((settings) => {
                bot_runned_in_channels.push(settings.channel_id);
                if (settings.schedule) {
                    registerSchedule({
                        channel_id: settings.channel_id,
                        job_name: 'start',
                        schedule: settings.schedule,
                        timezone: settings.timezone,
                        job_cb: () => {
                            randomLightMatch({
                                channel_id: settings.channel_id,
                                user_id: CONFIG.super_users[0], // main app admin
                                test_run: false,
                            })
                        }
                    });
                    console.log(`New START registered for ${settings.channel_id}: ${settings.schedule} at ${settings.timezone}`);
                }

                if (settings.extra_schedule) {
                    registerSchedule({
                        channel_id: settings.channel_id,
                        job_name: 'extra',
                        schedule: settings.extra_schedule,
                        timezone: settings.timezone,
                        job_cb: () => {
                            extraLightMatch({
                                channel_id: settings.channel_id,
                                user_id: CONFIG.super_users[0], // main app admin
                                test_run: false,
                            });
                        }
                    });
                    console.log(`New EXTRA registered for ${settings.channel_id}: ${settings.extra_schedule} at ${settings.timezone}`);
                }

                if (settings.close_schedule) {
                    registerSchedule({
                        channel_id: settings.channel_id,
                        job_name: 'close',
                        schedule: settings.close_schedule,
                        timezone: settings.timezone,
                        job_cb: () => {
                            closeLightEvent({
                                channel_id: settings.channel_id,
                                user_id: CONFIG.super_users[0], // main app admin
                            });
                        }
                    });
                    console.log(`New CLOSE registered for ${settings.channel_id}: ${settings.close_schedule} at ${settings.timezone}`);
                }
            })
        })
        .catch((err) => {
            console.error('ERROR: schedule load error!', err);
        })
        ;
}

export function getScheduledJobRunTime({channel_id, job_name}) {
    if (cron_pool[`${channel_id}${job_name}`]) {
        return cron_pool[`${channel_id}${job_name}`].nextDates();
    }
    // undefined otherwise
}

export function isChannelRegistered(target) {
    return bot_runned_in_channels.indexOf(target) != -1;
}
