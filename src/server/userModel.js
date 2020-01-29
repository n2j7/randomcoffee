"use strict";

import squel from 'squel';
import { execQuery, execPlainQuery } from './db';
import { getConfig } from './config';
import { getChannelSettings } from './channelModel';
import { dbDatetime } from './utils';

export function updateUserSettings(data) {
    const squelMysql = squel.useFlavour('mysql');
    let query = squelMysql.insert()
        .into('users')
        .setFields(data)
        ;

    Object.keys(data).map((field) => {
        if (field == 'user_id') return;
        if (field == 'channel_id') return;
        query.onDupUpdate(`${field}=VALUES(${field})`)
    })

    return execQuery(query).then((results) => {
        return results;
    })
        .catch((err) => {
            console.log('userModel:updateUserSettings:', err)
        });
}

export function getUserSettings(user_id, channel_id) {
    let query = squel.select()
        .from('users')
        .where('user_id = ?', user_id)
        .where('channel_id = ?', channel_id)
        ;

    return execQuery(query)
        .then((row) => {
            if (row.length) {
                return row[0];
            }
            return {};
        })
        .catch((err) => {
            console.log('userModel:getUserSettings:', err)
        });
}

export function getUnavailable(channel_id) {
    let query = squel.select()
        .from('users')
        .field('user_id')
        .where('is_available = ?', 'N')
        .where('channel_id = ?', channel_id)
        ;

    return execQuery(query).then((results) => {
        return results.map(user => user.user_id);
    })
        .catch((err) => {
            console.log('userModel:getUnavailable:', err)
        });
}

export function getAutoOk(channel_id) {
    let query = squel.select()
        .from('users')
        .field('user_id')
        .where('is_auto_ok = ?', 'Y')
        .where('is_available = ?', 'Y') // seelct only available users
        .where('channel_id = ?', channel_id)
        ;

    return execQuery(query).then((results) => {
        return results.map(user => user.user_id);
    })
        .catch((err) => {
            console.log('userModel:getAutoOk:', err)
        });
}

export function getHistory(channel_id) {
    let query = squel.select()
        .from('history')
        .fields(['user_a_id', 'user_b_id'])
        .where('channel_id = ?', channel_id)
        .where('is_a_ok = ?', 'Y')
        .where('is_b_ok = ?', 'Y')
        ;

    return execQuery(query).then((results) => {
        return results.reduce(
            (acc, data) => {
                if (!acc[data.user_a_id]) acc[data.user_a_id] = [];
                if (!acc[data.user_b_id]) acc[data.user_b_id] = [];
                acc[data.user_a_id].push(data.user_b_id);
                acc[data.user_b_id].push(data.user_a_id);
                return acc;
            },
            {}
        );
    })
        .catch((err) => {
            console.log('userModel:getHistory:', err)
        });
}

export function addHistory(data_list) {
    let query = squel.insert()
        .into('history')
        .setFieldsRows(data_list)
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('userModel:addHistory:', err)
        });
}

export function getUserChannelHistory(user_id, channel_id) {
    let query = squel.select()
        .from('history')
        .fields(['id', 'user_a_id', 'user_b_id'])
        .where('channel_id = ?', channel_id)
        .where('is_a_ok = ?', 'Y')
        .where('is_b_ok = ?', 'Y')
        .where('user_a_id = ? OR user_b_id = ?', user_id, user_id)
        ;

    return execQuery(query).then((results) => {
        return results.reduce(
            (acc, data) => {
                if (data.user_a_id != user_id) {
                    acc.push(data.user_a_id);
                }
                else {
                    acc.push(data.user_b_id);
                }
                return acc;
            },
            []
        );
    })
        .catch((err) => {
            console.log('userModel:getUserChanneHistory:', err)
        });
}

export function addExtra(data_list) {
    let query = squel.insert()
        .into('extra')
        .setFieldsRows(data_list)
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('userModel:updateUserSettings:', err)
        });
}

export function getExtraUsers(channel_id) {
    let query = squel.select()
        .from('extra')
        .fields(['user_id'])
        .where('channel_id = ?', channel_id)
        .group('user_id') // due to user can leave and enter again a lot of time
        ;

    return execQuery(query).then((results) => {
        return results.map(u => u.user_id);
    })
        .catch((err) => {
            console.log('userModel:getExtraUsers:', err)
        });
}

export function removeFromExtra(channel_id, users_list) {
    let query = squel.delete()
        .from('extra')
        .where('channel_id = ?', channel_id)
        .where('user_id IN ?', users_list)
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('userModel:removeFromExtra:', err)
        });
}

export function removeAllExtra(channel_id) {
    let query = squel.delete()
        .from('extra')
        .where('channel_id = ?', channel_id)
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('userModel:removeAllExtra:', err)
        });
}

export function updateUserState(history_row, user_id, state = 'Y') {
    const user_date_col = history_row.user_a_id == user_id ? 'a_date' : 'b_date';
    let query = squel.update()
        .table('history')
        .set(
            history_row.user_a_id == user_id ? 'is_a_ok' : 'is_b_ok',
            state
        )
        .set(`${user_date_col} = CURRENT_TIMESTAMP()`)
        .where('id = ?', history_row.id)
        ;
    //console.log('userModel:updateUserState', query.toString());
    return execQuery(query)
        .catch((err) => {
            console.log('userModel:updateUserState:', err)
        });
}

/**
 * Check that user is admin at specified channel
 * @param {Number} user_id 
 * @param {Number} channel_id 
 * @returns {Boolean}
 */
export async function isAdmin(user_id, channel_id) {
    const CONFIG = getConfig();
    if (CONFIG.super_users.indexOf(user_id) != -1) {
        return true;
    };
    const settings = await getChannelSettings(channel_id);

    if (!settings.admins) {
        return false;
    }

    return settings.admins.indexOf(user_id) != -1;
}

export function getLongPauseList(channel_id) {
    let margin_date = new Date();
    margin_date.setDate(margin_date.getDate() - 14);

    let query = squel.select()
        .from('users')
        .fields(['user_id', 'avail_date', 'cdate'])
        .where('is_available = ?', 'N')
        .where('channel_id = ?', channel_id)
        .where(
            squel.expr()
                .or('avail_date <= ?', dbDatetime(margin_date))
                .or('avail_date IS NULL')
        )
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('userModel:getLongPauseList:', err)
        });
}


export function startReport() {
    let query = "\
        CREATE TEMPORARY TABLE IF NOT EXISTS myReportUsers (\
            `user_id` varchar(20) NOT NULL,\
            `name` varchar(250) NOT NULL DEFAULT '',\
            `y_cnt` int(11) NOT NULL DEFAULT 0,\
            `n_cnt` int(11) NOT NULL DEFAULT 0,\
            `p_cnt` int(11) NOT NULL DEFAULT 0,\
            `is_active` int(11) NOT NULL DEFAULT 0,\
            PRIMARY KEY (`user_id`)\
        )\
    ";

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:startReport:', err)
        });
}

export function clearReport() {
    let query = "TRUNCATE myReportUsers";

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:clearReport:', err)
        });
}

export function reportDataRemoveDoublicates() {
    let query = `
        select 
            user_a_id, 
            count(id) as cnt, 
            event_id, 
            group_concat(is_a_ok) as answers,
            max(id) as last_id 
        from history 
        where (user_b_id = "light") 
        group by user_a_id, event_id 
        having cnt>1;
    `;

    return execPlainQuery(query)
        .then((data) => {
            let rmlist = [];
            let calc_cnt = 0;
            data.map((row)=>{
                let unique_vals = row.answers.split(',').filter((val, ind, arr) => {return arr.indexOf(val)===ind});
                if (unique_vals.length != 1) {
                    console.log('trouble with row!', "User", row.user_a_id, "Event", row.event_id);
                    return ;
                }
                calc_cnt += row.cnt-1;
                rmlist.push(`(user_a_id="${row.user_a_id}" AND user_b_id="light" AND event_id=${row.event_id} AND id!=${row.last_id})`)
            });
            console.log('calculated', calc_cnt);
            return rmlist;
        })
        .then((rl)=>{
            if (!rl.length) { return 0; }
            return execPlainQuery(`DELETE FROM history WHERE 1=0 OR ${rl.join(' OR ')}`);
        })
        .then((row)=>{
            console.log('row', row);
        })
        .catch((err) => {
            console.log('userModel:reportDataRemoveDoublicates:', err)
        });
}

export function reportDataRemoveLateAnswers() {
    // let query = `
    //     select 
    //         h.id, 
    //         h.user_a_id, 
    //         h.a_date, 
    //         e.cdate, 
    //         timediff(h.a_date,e.cdate) as td
    //     from history as h 
    //     join events as e on h.event_id = e.id 
    //     where h.user_b_id="light" 
    //         and h.a_date > DATE_ADD(e.cdate, INTERVAL 51 HOUR)
    // `;

    let query = `
        delete h
        from history as h 
        join events as e on h.event_id = e.id 
        where h.user_b_id="light" 
            and h.a_date > DATE_ADD(e.cdate, INTERVAL 51 HOUR)
    `;

    return execPlainQuery(query)
        .then((data) => {
            console.log('late answers', data);
        })
        .catch((err) => {
            console.log('userModel:reportDataRemoveDoublicates:', err)
        });
}

export function reportFillYA(channel) {
    console.log('fillA', channel);
    // user_b_id=="light" when user place answer on form about participating
    // event_id==0 when this row is imported from channel history
    let query = `
        INSERT INTO myReportUsers(user_id, y_cnt)
        select user_a_id, count(id) as y_cnt
            from history
            where is_a_ok='Y'
                and (user_b_id="light" OR event_id=0)
                and channel_id = "${channel}"
            group by user_a_id
        ON DUPLICATE KEY UPDATE
            y_cnt = y_cnt + VALUES(y_cnt)
    `;

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:reportFillYA:', err)
        });
}

export function reportFillYB(channel) {
    console.log('fillB', channel);
    // event_id==0 when this row is imported from channel history
    // this case ONLY for imported rows that's why there are strong rule "and event_id == 0"
    let query = `
        INSERT INTO myReportUsers(user_id, y_cnt)
        select user_b_id, count(id) as y_cnt
            from history
            where is_b_ok='Y'
                and event_id=0
                and channel_id = "${channel}"
            group by user_b_id
        ON DUPLICATE KEY UPDATE
            y_cnt = y_cnt + VALUES(y_cnt)
    `;

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:reportFillYB:', err)
        });
}

export function reportFillN(channel) {
    console.log('fillN', channel);
    // user_b_id=="light" when user place answer on form about participating
    let query = `
        INSERT INTO myReportUsers(user_id, n_cnt)
        select user_a_id, count(id) as n_cnt
            from history
            where is_a_ok='N'
                and user_b_id="light"
                and channel_id = "${channel}"
            group by user_a_id
        ON DUPLICATE KEY UPDATE
            n_cnt = n_cnt + VALUES(n_cnt)
    `;

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:reportFillNA:', err)
        });
}

export function reportFillPA(channel) {
    console.log('fillPA', channel);
    let query = `
        INSERT INTO myReportUsers(user_id, p_cnt)
        select user_a_id, count(id) as p_cnt
            from history 
            where is_a_ok='Y' 
                and is_b_ok='Y' 
                and channel_id = "${channel}"
            group by user_a_id
        ON DUPLICATE KEY UPDATE
            p_cnt = p_cnt + VALUES(p_cnt)
    `;

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:reportFillPA:', err)
        });
}

export function reportFillPB(channel) {
    console.log('fillPB', channel);
    let query = `
        INSERT INTO myReportUsers(user_id, p_cnt)
        select user_b_id, count(id) as p_cnt
            from history 
            where is_a_ok='Y' 
                and is_b_ok='Y' 
                and channel_id = "${channel}"
            group by user_b_id
        ON DUPLICATE KEY UPDATE
            p_cnt = p_cnt + VALUES(p_cnt)
    `;

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:reportFillPB:', err)
        });
}

export function getReportData() {

    let query = squel.select()
        .from('myReportUsers')
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('userModel:getReportData:', err)
        });
}

export function dropReport() {
    let query = "DROP myReportUsers";

    return execPlainQuery(query)
        .catch((err) => {
            console.log('userModel:dropReport:', err)
        });
}
