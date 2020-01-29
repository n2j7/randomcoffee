import squel from 'squel';
import { execQuery } from './db';

const _CHANNELS_SETTINGS_CACHE = {};
const _channel_default_settings = {
    schedule: '',
    extra_schedule: '',
    close_schedule: '',
    timezone: '',
    admins: '[]'
};

function packAdmins(data) {
    if (!data.admins) {
        return data;
    }
    const new_obj = Object.assign({}, data);// do not modify base object
    new_obj.admins = JSON.stringify(new_obj.admins)
    return new_obj;
}

function unpackAdmins(data) {
    if (!data.admins) {
        return data;
    }
    try {
        data.admins = JSON.parse(data.admins) || [];
    }
    catch (err) {
        data.admins = [];
    }
    return data;
}

export function updateChannelSettings(id, data) {
    let query = squel.update()
        .table('channels')
        .setFields(packAdmins(data))
        .where('id = ?', id);

    return execQuery(query)
        .then((resp) => {
            cacheChannelSettings(data);
            return data;
        })
        .catch((err) => {
            console.log('channelModel:updateChannelSettings:', err);
        });
}

export function createChannelSettings(data) {
    let query = squel.insert()
        .into('channels')
        .setFields(packAdmins(data))
        ;

    return execQuery(query)
        .then((results) => {
            cacheChannelSettings(Object.assign(
                {
                    id: results.insertId,
                    admins: [],
                },
                data,
            ));
            return results.insertId;
        })
        .catch((err) => {
            console.log('channelModel:createChannelSettings:', err);
        });
}

export function getChannelsList() {
    let query = squel.select()
        .from('channels')
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('channelModel:getChannelsList:', err)
        });
}

export function getChannelEventState(channel_id, event_id) {
    let query = squel.select()
        .from('history')
        .where('channel_id = ?', channel_id)
        .where('event_id = ?', event_id)
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('channelModel:getChannelEventState:', err)
        });
}

export function getLastEventChannelPairsForExtra(channel_id) {
    let sub_query = squel.select()
        .field('MAX(id)')
        .from('events')
        .where('channel_id = ? ', channel_id)
        ;
    let query = squel.select()
        .from('history', 'h')
        .join(
            'events',
            'e',
            'h.event_id = e.id'
        )
        .fields(['h.user_a_id', 'h.user_b_id', 'h.is_a_ok', 'h.is_b_ok'])
        .where('h.channel_id = ?', channel_id)
        .where('h.event_id = ?', sub_query)
        .where('e.is_closed = ?', 'N')
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('channelModel:getLastEventChannelPairsForExtra:', err)
        });
}

export function getChannelCachedSettings(channel_id) {
    const now_ts = Date.now();
    if (
        _CHANNELS_SETTINGS_CACHE[channel_id]
        && (now_ts - _CHANNELS_SETTINGS_CACHE[channel_id].ts) < 3600000 // one hour
    ) {
        return _CHANNELS_SETTINGS_CACHE[channel_id].data;
    }
    // return undefined othervise
}

export function cacheChannelSettings(data) {
    const prev = _CHANNELS_SETTINGS_CACHE[data.channel_id];
    if (prev) {
        data = Object.assign(prev.data, data);
    }
    _CHANNELS_SETTINGS_CACHE[data.channel_id] = {
        ts: Date.now(),
        data: data
    };
}

export function getChannelSettings(channel_id) {
    const cached_settings = getChannelCachedSettings(channel_id);
    if (cached_settings) {
        return Promise.resolve(cached_settings);
    }

    let query = squel.select()
        .from('channels')
        .where('channel_id = ?', channel_id)
        ;

    return execQuery(query)
        .then((results) => {
            let ch_settings = results.length
                ? results[0]
                : Object.assign(
                    { channel_id },
                    _channel_default_settings
                );

            ch_settings = unpackAdmins(ch_settings);

            // cache only existing in DB records
            if (ch_settings.id) {
                cacheChannelSettings(ch_settings);
            }

            return ch_settings;
        })
        .catch((err) => {
            console.log('channelModel:getChannelSettings:', err)
        });
}

export async function addChannelAdmin(channel_id, user_id) {
    const settings = await getChannelSettings(channel_id);

    if (settings.admins.indexOf(user_id) != -1) {
        return Promise.resolve();
    }

    settings.admins = [...settings.admins, user_id];// first one is a MAIN admin

    if (settings.id) {
        return updateChannelSettings(settings.id, settings);
    }

    return createChannelSettings(settings);
}

export async function removeChannelAdmin(channel_id, user_id) {
    const settings = await getChannelSettings(channel_id);

    if (settings.admins.indexOf(user_id) == -1) {
        return Promise.resolve();
    }

    settings.admins = settings.admins.filter((u) => (u != user_id));

    if (settings.id) {
        return updateChannelSettings(settings.id, settings);
    }

    return createChannelSettings(settings);
}
