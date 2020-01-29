import squel from 'squel';
import { execQuery } from './db';

export function create(data) {
    let query = squel.insert()
        .into('events')
        .setFields(data)
        ;

    return execQuery(query).then((results) => {
        return results.insertId;
    })
        .catch((err) => {
            console.log('eventModel:create:', err)
        });
}

export function update(event_id, data) {
    let query = squel.update()
        .table('events')
        .setFields(data)
        .where('id = ?', event_id)
        ;

    return execQuery(query).then((results) => {
        return results;
    })
        .catch((err) => {
            console.log('eventModel:create:', err)
        });
}

export function getEventPair(event_id, user_id) {
    let query = squel.select()
        .from('history', 'h')
        .field('h.*')
        .join(
            'events',
            'e',
            'h.event_id = e.id'
        )
        .field('e.is_closed')
        .where('h.event_id = ?', event_id)
        .where('h.user_a_id = ? OR h.user_b_id = ?', user_id, user_id)
        ;

    return execQuery(query)
        .then((history_rows) => {
            return history_rows[0];
        })
        .catch((err) => {
            console.log('eventModel:getEventPair:', err)
        });
}

export function getEventById(event_id) {
    let query = squel.select()
        .from('events')
        .where('id = ?', event_id)
        ;

    return execQuery(query)
        .then((result) => { return result[0]; })
        .catch((err) => {
            console.log('eventModel:getEventById:', err)
        });
}

export function setEventClosed(event_id) {
    let query = squel.update()
        .table('events')
        .set('is_closed', 'Y')
        .where('id = ?', event_id)
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('eventModel:setEventClosed:', err)
        });
}

export function getLastChannelEventId(channel_id) {
    let query = squel.select()
        .field('MAX(id)', 'last_event_id')
        .from('events')
        .where('channel_id = ? ', channel_id)
        ;
    return execQuery(query)
        .then((result) => {
            return result[0].last_event_id;
        })
        .catch((err) => {
            console.log('eventModel:getLastChannelEventId:', err)
        });
}

export function getLastChannelEvent(channel_id) {
    let sub_query = squel.select()
        .field('MAX(id)')
        .from('events')
        .where('channel_id = ? ', channel_id)
        ;

    let query = squel.select()
        .from('events')
        .where('id = ?', sub_query)
        ;

        console.log(query.toString());
    return execQuery(query)
        .then((result) => {
            return result[0];
        })
        .catch((err) => {
            console.log('eventModel:getLastChannelEvent:', err)
        });
}
