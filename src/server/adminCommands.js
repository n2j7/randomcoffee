import { getBotClient, getAllChannelMembers } from './slack_web';
import {
    updateChannelSettings,
    getChannelSettings,
    addChannelAdmin,
    removeChannelAdmin,
    getChannelEventState,
    createChannelSettings,
    updateChannelReason,
} from './channelModel';
import {
    registerSchedule,
    getScheduledJobRunTime
} from './schedule';
import { match } from "./matcher";
import {
    getUnavailable,
    getHistory,
    addHistory,
    addExtra,
    removeAllExtra,
    getExtraUsers,
    removeFromExtra,
    getAutoOk,
    getLongPauseList,
} from './userModel';
import {
    create as createEvent,
    update as updateEvent,
    setEventClosed,
    getLastChannelEventId,
    getEventById,
    getLastChannelEvent,
} from './eventModel';
import {
    sendUserNoticeAboutCreatedPair,
    askUserLightAvailability,
    sendUserFinallyLostLightAnswer,
    askLongPauseBreak,
} from './userCommands';
import { dbDatetime } from './utils';
import { getConfig } from './config';


export function adminInterface({ channel_id }) {
    const answer = {
        fallback: "Админ панель",
        text: "Админ панель",
        attachments: [
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "run",
                        text: "Start round",
                        type: "button",
                        value: "light",
                    },
                    {
                        name: "extra",
                        text: "Match users",
                        type: "button",
                        value: "light",
                    },
                    {
                        name: "close",
                        text: "Close round",
                        type: "button",
                        value: "light",
                    },
                ]
            },
            /*{
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "extra",
                        text: "Потеряшки RUN",
                        type: "button",
                        value: "real",
                    },
                    {
                        name: "extra",
                        text: "Потеряшки TEST",
                        type: "button",
                        value: "test",
                    },
                ]
            },*/
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "pause_list",
                        text: "Кто на паузе?",
                        type: "button",
                        value: "show",
                    },
                ]
            },
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "settings",
                        text: "Настройки",
                        type: "button",
                        value: "show",
                    },
                ]
            },
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "cancel",
                        text: "Cancel",
                        type: "button",
                        value: "remove",
                    },
                ]
            },
        ],
        as_user: true,
    };

    return answer;
}

export function adminSettingsInterface() {
    const answer = {
        fallback: "Админ панель",
        text: "Админ панель",
        attachments: [
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "schedule",
                        text: "Расписание",
                        type: "button",
                        value: "view",
                    },
                    {
                        name: "admins",
                        text: "Админы",
                        type: "button",
                        value: "view",
                    },
                    {
                        name: "---",
                        text: "Тексты",
                        type: "button",
                        value: "view",
                    },
                ]
            },
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "init",
                        text: "Init",
                        type: "button",
                        value: "action",
                    },
                    {
                        name: "stop",
                        text: "Приостановка",
                        type: "button",
                        value: "dialog",
                    },
                    {
                        name: "history",
                        text: "Импорт истории",
                        type: "button",
                        value: "dialog",
                    },
                ]
            },
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "cancel",
                        text: "Cancel",
                        type: "button",
                        value: "remove",
                    },
                ]
            },
        ],
        as_user: true,
    };

    return answer;
}

export function scheduleView({ channel_id, user_id }) {
    const web = getBotClient();
    getChannelSettings(channel_id)
        .then((settings) => {
            return web.chat.postEphemeral({
                channel: channel_id,
                user: user_id,
                text: [
                    `Часовой пояс: \`${settings.timezone}\``,
                    `Запуск раунда: \`${settings.schedule}\``,
                    `Матчинг: \`${settings.extra_schedule}\``,
                    `Завершение раунда: \`${settings.close_schedule}\``,
                    "```",
                    "* * * * * *",
                    "| | | | | └- День недели (0-6) [Воскресенье=0]",
                    "| | | | └--- Месяц (0-11)",
                    "| | | └----- День (1-31)",
                    "| | └------- Час (0-23)",
                    "| └--------- Минута (0-59)",
                    "└----------- Секунда (0-59) [!Внимание, такого нет в обычном Cron-e]",
                    "7 = конкретное значение (цифра может быть любой)",
                    "* = любое значение",
                    "*/2 = каждое второе значение",
                    "1-10 = в каждое значение диапазона",
                    "1,5 = в каждое значение последовательности",
                    "```",
                    "Почитать https://ru.wikipedia.org/wiki/Cron",
                    "https://www.npmjs.com/package/cron",
                ].join("\n"),
                as_user: true,
                attachments: [
                    {
                        callback_id: "admin_form",
                        title: null,
                        actions: [
                            {
                                "name": "schedule",
                                "text": "Редактировать",
                                "type": "button",
                                "value": "edit",
                            },
                            {
                                name: "cancel",
                                text: "X",
                                type: "button",
                                value: "remove",
                            },
                        ]
                    },
                ]
            })
        })
        .then((r) => {
            console.log('Show current channel schedule', r);
        })
        .catch((err) => {
            console.log('ERROR: failed to show current channel schedule', err)
        });
}

export function openScheduleDialog({ channel_id, trigger_id }) {
    const web = getBotClient();
    getChannelSettings(channel_id)
        .then((settings) => {
            return web.dialog.open({
                trigger_id: trigger_id,
                dialog: {
                    callback_id: "dialog-schedule",
                    title: "Расписание",
                    submit_label: "Отправить",
                    notify_on_cancel: false,
                    elements: [
                        {
                            type: "text",
                            label: "Запуск нового раунда",
                            name: "schedule_line",
                            value: settings.schedule,
                            placeholder: "0 0 9 * * 1 = каждый понедельник в 9:00:00",
                            hint: "Начинается с секунд, а не минут как в стандартном CRON! Подробнее: https://www.npmjs.com/package/cron",
                        },
                        {
                            type: "text",
                            label: "Запуск матчера",
                            name: "extra_schedule_line",
                            value: settings.extra_schedule,
                            placeholder: "0 0 10-18 * * 1-3 = каждый час, каждый рабочий день с 10 до 18",
                            hint: "Начинается с секунд, а не минут как в стандартном CRON! Подробнее: https://www.npmjs.com/package/cron",
                        },
                        {
                            type: "text",
                            label: "Финализация раунда",
                            name: "close_schedule_line",
                            value: settings.close_schedule,
                            placeholder: "0 0 12 * * 3 = каждую среду в 12:00:00",
                            hint: "Начинается с секунд, а не минут как в стандартном CRON! Подробнее: https://www.npmjs.com/package/cron",
                        },
                        {
                            type: "text",
                            label: "Часовой пояс",
                            name: "timezone",
                            value: settings.timezone,
                            placeholder: "Задай часовой пояс для срабатывания",
                            hint: "Таймзона срабатывания расписания, посмотреть можно тут: http://momentjs.com/timezone/",
                        },
                    ],
                }
            });
        })
        .then((resp) => {
            console.log('Schedule dialog was opened', resp.body);
        })
        .catch((err) => {
            console.log('ERROR: failed to open Schedule dialog', err);
            if (err.data && err.data.response_metadata && err.data.response_metadata.messages) {
                console.log(err.data.response_metadata.messages);
                console.log('========================================');
            }
        });
}

export async function onScheduleEdit(payload) {
    const web = getBotClient();
    //payload.submission
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
    console.log('SCHEDULE DIALOG');
    console.log(payload);
    const schedule = payload.submission.schedule_line;
    const extra_schedule = payload.submission.extra_schedule_line;
    const close_schedule = payload.submission.close_schedule_line;
    const timezone = payload.submission.timezone;

    const settings = await getChannelSettings(payload.channel.id);
    const channel_in_db = !!settings.id;

    const channel_info = await web.conversations.info({ channel: payload.channel.id })
        .then((r) => {
            if (r.ok !== true) {
                console.log('ERROR! While fetching group info', r);
                return null;
            }
            return r.channel;
        })
        .catch((err) => {
            console.log(payload.channel.id, ' is not found! ', err);
            return null;
        });;
    console.log('Channel info', channel_info);

    try {
        if (!channel_info) {
            throw "Can't get info about channel!";
        }

        registerSchedule({
            channel_id: payload.channel.id,
            job_name: 'start',
            schedule,
            timezone,
            job_cb: () => {
                randomLightMatch({
                    channel_id: payload.channel.id,
                    user_id: payload.user.id,
                    test_run: false,
                })
            }
        });

        registerSchedule({
            channel_id: payload.channel.id,
            job_name: 'extra',
            schedule: extra_schedule,
            timezone,
            job_cb: () => {
                extraLightMatch({
                    channel_id: payload.channel.id,
                    user_id: payload.user.id,
                    test_run: false,
                });
            }
        });

        registerSchedule({
            channel_id: payload.channel.id,
            job_name: 'close',
            schedule: close_schedule,
            timezone,
            job_cb: () => {
                closeLightEvent({
                    channel_id: payload.channel.id,
                    user_id: payload.user.id,
                });
            }
        });

        const new_channel_settings = {
            channel_id: payload.channel.id,
            name: channel_info.name,
            is_group: channel_info.is_group ? 'Y' : 'N',
            schedule,
            extra_schedule,
            close_schedule,
            timezone,
        };

        if (channel_in_db) {
            await updateChannelSettings(
                settings.id,
                new_channel_settings
            );
        }
        else {
            await createChannelSettings(
                new_channel_settings
            );
        }

        web.chat.postEphemeral({
            channel: payload.channel.id,
            user: payload.user.id,
            text: "Расписание изменено!",
            as_user: true,
            attachments: [
                {
                    callback_id: "user_form",
                    title: null,
                    actions: [
                        {
                            "name": "cancel",
                            "text": "X",
                            "type": "button",
                            "value": "cancel",
                        },
                    ]
                },
            ]
        })
    }
    catch (e) {
        console.log('ERROR: while save schedule form:', e);
        web.chat.postEphemeral({
            channel: payload.channel.id,
            user: payload.user.id,
            text: `Ошибка! Расписание *НЕ* изменено! ${e}`,
            as_user: true,
            attachments: [
                {
                    callback_id: "user_form",
                    title: null,
                    actions: [
                        {
                            "name": "cancel",
                            "text": "X",
                            "type": "button",
                            "value": "cancel",
                        },
                    ]
                },
            ]
        })
            .then((r) => {
                console.log('Schedule change error message was sent', r);
            })
            .catch((err) => {
                console.log('ERROR: failed to send schedule edit error message', err)
            });
    }
}

export function openHistoryParseDialog(trigger_id) {
    const web = getBotClient();
    web.dialog.open({
        trigger_id: trigger_id,
        dialog: {
            callback_id: "dialog-history",
            title: "History parse",
            submit_label: "Отправить",
            notify_on_cancel: true,
            elements: [
                {
                    type: "textarea",
                    label: "История",
                    name: "history_raw",
                    placeholder: "формат как выплевывали боты, попытаемся спарсить как есть :)",
                    hint: "Введи историю встреч для парсинга",
                },
            ],
        }
    })
        .then((resp) => {
            console.log('History dialog was opened', resp.body);
        })
        .catch((err) => {
            console.log('ERROR: failed to open history dialog', err);
            if (err.data && err.data.response_metadata && err.data.response_metadata.messages) {
                console.log(err.data.response_metadata.messages);
                console.log('========================================');
            }
        });
}

export function onHistoryParseContentCome(payload) {
    const web = getBotClient();
    //payload.submission
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
    console.log('HISTORY DIALOG');
    console.log(payload);
    const raw_data = payload.submission.history_raw;
    const rows = raw_data.split("\n");

    web.users.list({})
        .then((r) => {
            if (r.ok != true) {
                throw "bad response ok!=ok";
            }
            return r.members
        })
        .then((users_data_list) => {
            return users_data_list.reduce(
                (acc, user) => {
                    acc[user.name] = user.id;
                    if (user.profile.display_name) {
                        acc[user.profile.display_name] = user.id; // user alias
                    }
                    if (user.profile.real_name) {
                        acc[user.profile.real_name] = user.id; // user alias
                    }
                    return acc;
                },
                {}
            )
        })
        .then((user_name_map) => {
            let err_lines = [];
            const resolved = rows.map((row) => {
                if (!row) return; // skip empty lines
                // detect version
                const old_msg_format = !(row.match(/[а-я]/i));
                let m;
                if (old_msg_format) {
                    m = row.match(/[^@]+@([^,]+),[^@]+@([^,]+)/i);
                    m && console.log('old', m[1], m[2]);
                }
                else {
                    m = row.match(/[^@]+@([^а-я]+)[^@]+@(.+)/i);
                    m && console.log('new', m[1], m[2]);
                }
                if (!m) {
                    console.log('WARNING: cannot parse line:', row);
                    err_lines.push(row);
                    return;
                }
                const user_a = user_name_map[m[1].trim()];
                if (!user_a) {
                    console.log('WARNING: cannot get user:', m[1], row);
                    err_lines.push(row);
                    return;
                }
                const user_b = user_name_map[m[2].trim()];
                if (!user_b) {
                    console.log('WARNING: cannot get user:', m[2], row);
                    err_lines.push(row);
                    return;
                }
                return [user_a, user_b];

            }).filter(l => l != null);
            console.log('=====================');
            return {
                err: err_lines,
                rows: resolved,
            };
        })
        .then((pairs_data) => {
            const ins_data = pairs_data.rows.map(([a, b]) => {
                return {
                    channel_id: payload.channel.id,
                    user_a_id: a,
                    user_b_id: b,
                    is_a_ok: 'Y',
                    is_b_ok: 'Y',
                    event_id: 0, // have no event_id due to history
                }
            });
            if (!ins_data.length) {
                return pairs_data; // nothing to insert
            }
            return addHistory(ins_data)
                .then((r) => {
                    console.log('DB insertion complete with id:', r);
                    return pairs_data;
                })
                .catch((err) => { console.log('history insertion error', err); })
                ;
        })
        .then((r) => {
            web.chat.postEphemeral({
                channel: payload.channel.id,
                user: payload.user.id,
                text: `Обработано ${r.rows.length} строк. Ошибок парсинга: ${r.err.length}\n` + r.err.join('\n'),
                as_user: true,
            })
                .then((resp) => {
                    console.log('Admin history parse response was sent');
                })
                .catch((err) => {
                    console.log('ERROR: failed to send history parse response', err)
                });
        })
        .catch((err) => { console.log('Slack USERS.LIST', err); })
        ;

    return '';// empty string for no answer
}

export async function displayAdmins({ channel_id, user_id }) {
    const web = getBotClient();
    const CONFIG = getConfig();
    const super_admins = CONFIG.super_users.map((u) => {
        return {
            callback_id: "admin_form",
            title: null,
            color: "#F9564F",
            text: `<@${u}> [super]`,
        };
    });

    const ch_settings = await getChannelSettings(channel_id);

    let local_admins = [];
    if (ch_settings && ch_settings.admins) {
        local_admins = ch_settings.admins.map((u) => {
            return {
                callback_id: "admin_form",
                title: null,
                color: "#7B1E7A",
                text: `<@${u}>`,
                actions: [
                    {
                        name: "rm_admin",
                        text: "Разжаловать!",
                        type: "button",
                        value: u,
                    },
                ]
            };
        });
    }

    await web.chat.postEphemeral({
        channel: channel_id,
        user: user_id,
        text: null,
        as_user: true,
        attachments: [
            ...super_admins,
            ...local_admins,
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        name: "add_admin",
                        text: "Добавить",
                        type: "button",
                        value: "true",
                    },
                    {
                        name: "cancel",
                        text: "Cancel",
                        type: "button",
                        value: "remove",
                    },
                ]
            },
        ]
    });
}

export function showAdminSelectDialog({ channel_id, trigger_id }) {
    const web = getBotClient();
    web.dialog.open({
        trigger_id: trigger_id,
        dialog: {
            callback_id: "dialog-add-admin",
            title: "Добавление админа",
            submit_label: "Добавить",
            notify_on_cancel: false,
            elements: [
                {
                    type: "select",
                    data_source: "users",
                    label: "Пользователь",
                    name: "new_admin",
                    placeholder: "Выбери нового админа",
                    hint: "Этот человек сможет пользоватся админским меню и любой командой бота в канале!",
                },
            ],
        }
    });
}

export function onAdminAdd(payload) {
    const web = getBotClient();
    const new_admin_id = payload.submission.new_admin;

    addChannelAdmin(payload.channel.id, new_admin_id)
        .then(() => {
            console.log('Channel admins was updated after creating new one');
            web.chat.postEphemeral({
                channel: payload.channel.id,
                user: payload.user.id,
                text: `Пользователь <@${new_admin_id}> добавлен как администратор канала!`,
                as_user: true,
                attachments: [
                    {
                        callback_id: "user_form",
                        title: null,
                        actions: [
                            {
                                "name": "cancel",
                                "text": "X",
                                "type": "button",
                                "value": "cancel",
                            },
                        ]
                    },
                ]
            })
                .then((resp) => {
                    console.log('New admin creation message was sent');
                })
                .catch((err) => {
                    console.log('ERROR: failed to send new admin creation message', err)
                });
        })
        .catch((err) => {
            console.log('ERROR: can\'t update channel admin data', err)
        });
}

export function removeAdmin({ channel_id, user_id, target }) {
    const web = getBotClient();

    removeChannelAdmin(channel_id, target)
        .then(() => {
            console.log('Channel admins was updated after deleting someone');
            web.chat.postEphemeral({
                channel: channel_id,
                user: user_id,
                text: `Пользователь <@${target}> удален из администраторов канала!`,
                as_user: true,
                attachments: [
                    {
                        callback_id: "user_form",
                        title: null,
                        actions: [
                            {
                                "name": "cancel",
                                "text": "X",
                                "type": "button",
                                "value": "cancel",
                            },
                        ]
                    },
                ]
            })
                .then((resp) => {
                    console.log('Admin deletion message was sent');
                })
                .catch((err) => {
                    console.log('ERROR: failed to send admin deletion message', err)
                });
        })
        .catch((err) => {
            console.log('ERROR: can\'t update channel admin data during deleting', err)
        });
}

export async function randomLightMatch({ channel_id, user_id, test_run }) {
    const web = getBotClient();
    const pub_channel = test_run ? user_id : channel_id;

    const settings = await getChannelSettings(channel_id);

    if (settings.is_turned_off == 'Y') {
        return false; // channel is disabled by bot owner over SQL request (saved for history)
    }

    if (settings.stop_reason) {
        await web.chat.postMessage({
            channel: pub_channel,
            text: [
                `${test_run ? '*ТЕСТОВЫЙ ЗАПУСК*' : ''}`,
                settings.stop_reason,
            ].join("\n"),
        })
            .then((resp) => {
                console.log('Reason update message was sent');
            })
            .catch((err) => {
                console.log('ERROR: failed to send reason updaten message', err)
            })
            ;

        return false;
    }

    let members_pr = getAllChannelMembers(channel_id);

    let users_pr = web.users.list({})
        .then((r) => {
            if (r.ok != true) {
                throw "bad response ok!=ok";
            }
            return r.members
        })
        .then((users_data_list) => {
            return users_data_list.reduce(
                (acc, user) => {
                    acc[user.id] = {
                        id: user.id,
                        deleted: user.deleted,
                        is_restricted: user.is_restricted,
                        is_ultra_restricted: user.is_ultra_restricted,
                        is_bot: user.is_bot,
                    };
                    return acc;
                },
                {}
            )
        })
        .catch((err) => { console.log('Slack USERS.LIST', err); })
        ;

    const unavail_pr = getUnavailable(channel_id);
    const users_auto_ok_pr = getAutoOk(channel_id);

    Promise.all([users_pr, members_pr, unavail_pr, users_auto_ok_pr])
        .then(([users, members, unavail_list, users_ok_list]) => {
            console.log('unavailable list', unavail_list);
            const del_users_list = [];
            const restricted_users_list = [];

            const active_members = members.filter((member) => {
                if (unavail_list.indexOf(member) != -1) {// filter unavailable users
                    return false;
                }
                const user = users[member];
                if (!user) {
                    return false;
                }

                // bot is a member of a group but does not take part of this
                if (user.is_bot) {
                    return false;
                }

                if (user.deleted) {
                    del_users_list.push(user);
                    return false;
                }

                if (user.is_restricted || user.is_ultra_restricted) {
                    restricted_users_list.push(user);
                    return true;// this is guests users in a channel
                }
                return true;
            }).filter(u => (u && u != ''));

            // only ask users!
            // pairs will be inserted after matching
            createEvent({ channel_id })
                .then((event_id) => {
                    console.log('New event was created', event_id);
                    removeAllExtra(channel_id)
                        .then((r) => {
                            console.log('Extra table was cleared for channel', channel_id, r);
                        })
                        .catch((err) => {
                            console.log('ERROR: failed to clear extra table for channel', channel_id, err)
                        });

                    const i18n_for_invites = (n) => {
                        n = n > 100 ? n % 100 : n;
                        n = n > 20 ? n % 10 : n;
                        if (n == 1) return 'приглашение';
                        if (n > 1 && n <= 4) return 'приглашения';
                        return 'приглашений';
                    };

                    web.chat.postMessage({
                        channel: pub_channel,
                        text: [
                            `${test_run ? '*ТЕСТОВЫЙ ЗАПУСК*' : ''}`,
                            "Начинаем новую неделю randomcoffee!",
                            `В этот раз мы отправили ${active_members.length} ${i18n_for_invites(active_members.length)}.`,
                            "Первые пары будут сформированы в 9:30",
                        ].join("\n"),
                        as_user: true,
                    })
                        .then((resp) => {
                            console.log('New run message was posted into channel', pub_channel, resp);
                            updateEvent(
                                event_id,
                                {
                                    upd_channel_id: resp.channel,
                                    ts: resp.ts,
                                }
                            )
                                .then(() => {
                                    console.log('Event was updated with data for future updates');
                                    if (test_run) {
                                        askUserLightAvailability(user_id, channel_id, event_id, 1);
                                        return;
                                    }
                                    active_members.map((u) => {
                                        if (users_ok_list.indexOf(u) == -1) {
                                            askUserLightAvailability(u, channel_id, event_id, 0);
                                        }
                                    });

                                    if (users_ok_list.length) {
                                        addExtra(users_ok_list.map((user_id) => {
                                            return {
                                                channel_id,
                                                user_id
                                            }
                                        }));
                                        // add to history due to this users has already answered with Y
                                        addHistory(users_ok_list.map((user_id) => {
                                            return {
                                                channel_id: channel_id,
                                                user_a_id: user_id,
                                                user_b_id: 'light', // this is marker for light algo history
                                                is_a_ok: 'Y',
                                                is_b_ok: 'N', // forever N for have no affects on real list or history
                                                a_date: dbDatetime(new Date()),
                                                event_id: event_id,
                                            };
                                        }));
                                    }
                                })
                                .catch((err) => {
                                    console.log('ERROR: can\'t update event data', err)
                                });
                        })
                        .catch((err) => {
                            console.log('ERROR: failed to post message to channel', err)
                        });
                })
                .catch((err) => {
                    console.log('ERROR: failed to clear extra table for channel', channel_id, err)
                });
        })
        .catch((err) => {
            console.log('Pairs creation error', err);
            // res.send([
            // 	"Ошибуля, над поправить :beetle: ",
            // 	err.toString()
            // ].join(''));
        });

    return true;
}

export function extraLightMatch({ channel_id, user_id, test_run }) {
    // get last event
    // get users from extra list
    // get history for users
    // match users from extra list

    const extra_users_pr = getExtraUsers(channel_id);
    const history_pr = getHistory(channel_id);
    const event_pr = getLastChannelEvent(channel_id);

    Promise.all([extra_users_pr, history_pr, event_pr])
        .then(([extra_users, history, event_data]) => {

            // do nothing if event is closed or not found
            if (!event_data || event_data.is_closed == 'Y') {
                return; // wrong matcher run (by cron or by hands in wrong time) 
            }

            // lost users will not be removed from extra list
            const { pairs } = match(extra_users, history);

            // insert pairs into DB and delete users from extra
            if (pairs.length) {
                let extra_rm_list = [];
                addHistory(pairs.map(([user_a, user_b]) => {
                    extra_rm_list.push(user_a, user_b);
                    return {
                        channel_id: channel_id,
                        user_a_id: user_a,
                        user_b_id: user_b,
                        is_a_ok: 'Y',
                        is_b_ok: 'Y',
                        a_date: dbDatetime(new Date()),
                        b_date: dbDatetime(new Date()),
                        event_id: event_data.id,
                    }
                }))
                    .then((r) => {
                        console.log('Extra Pairs was inserted into DB', pairs);
                        removeFromExtra(channel_id, extra_rm_list)
                            .then((r) => {
                                console.log('Extra paired users was deleted from extra table', r);
                                updateChannelMessageForLightEvent(channel_id, event_data.id);
                                pairs.map(([user_a, user_b]) => {
                                    if (!test_run || user_id == user_a) { // care about test run
                                        sendUserNoticeAboutCreatedPair(
                                            user_a,
                                            channel_id,
                                            { user_a_id: user_a, user_b_id: user_b }
                                        );
                                    }
                                    if (!test_run || user_id == user_b) { // care about test run
                                        sendUserNoticeAboutCreatedPair(
                                            user_b,
                                            channel_id,
                                            { user_a_id: user_a, user_b_id: user_b }
                                        );
                                    }
                                });
                            })
                            .catch((err) => {
                                console.log('ERROR: failed to delete extra paired users', err)
                            });
                    })
                    .catch((err) => {
                        console.log('ERROR: failed to insert matched extra pairs into DB', err)
                    });
            }
            else {
                console.log('Can\'t pair current users but have to update channel message');
                updateChannelMessageForLightEvent(channel_id, event_data.id);
            }

        })
        .catch((err) => {
            console.log('Extra pairs creation error', err);
        });

    return { text: null, delete_original: true };
}

export function updateChannelMessageForLightEvent(channel_id, event_id) {
    const web = getBotClient();

    const event_pr = getEventById(event_id);
    const event_state_pr = getChannelEventState(channel_id, event_id);
    const extra_users_pr = getExtraUsers(channel_id);

    Promise.all([event_pr, event_state_pr, extra_users_pr])
        .then(([event, state_rows, extra_list]) => {
            if (!event) {
                console.log('ERROR: can\'t fetch event by id', event_id);
                return;
            }

            if (!event.upd_channel_id) {
                console.log('ERROR: event has no upd_channel_id field', event_id, event);
                return;
            }

            if (!event.ts) {
                console.log('ERROR: event has no ts field', event_id, event);
                return;
            }

            let stats = state_rows.reduce(
                (acc, itm) => {
                    if (itm.is_a_ok == 'Y' && itm.is_b_ok == 'Y') {
                        // both have already answered Y
                        acc.push([itm.user_a_id, itm.user_b_id]);
                    }
                    return acc;
                },
                []
            );

            if (!stats || stats.length == 0) {
                // @TODO: we have a trouble when after first extra run there are no one pair created
                console.log('Should not update before first extra run, but requested!', channel_id);
                return;
            }

            const users_pairs = stats.map(([user_a, user_b], ind) => {
                return [
                    new String(ind + 1).padStart(3, ' ').concat('.'),
                    '<@' + user_a + '>',
                    'и',
                    '<@' + user_b + '>',
                ].join(' ');
            });

            const start_phrase = (event.is_closed == 'N')
                ? "На текущий момент подтвердили участие и сформировались в пары:"
                : "На этой неделе были сформированы пары:"
                ;

            const next_run = getScheduledJobRunTime({ channel_id, job_name: 'extra' });
            const next_run_str = next_run
                ? next_run.format('HH:mm')
                : ':disappointed2:';

            const ready_users_str = extra_list.length > 0
                ? `Уже подтвердили свою готовность: ${extra_list.length}`
                : ""
                ;

            const final_footer = (event.is_closed == 'N')
                ? `Следующие пары будут сформированы в ${next_run_str}. ${ready_users_str}`
                : [
                    "Продолжим в следующий понедельник!",
                    "",
                    "<https://goo.gl/forms/ibIfS5BU2VPEKez73|Нашелся баг или хочешь поделиться обратной связью, просьбой, идеей>",
                ].join("\n")
                ;

            web.chat.update({
                channel: event.upd_channel_id,
                ts: event.ts,
                as_user: true,
                unfurl_links: false,
                text: [
                    start_phrase,
                    "",
                    users_pairs.join("\n") || ":disappointed2:",
                    "",
                    final_footer,
                ].join("\n"),
            })
                .then((data) => {
                    console.log('Channel light message was updated', channel_id, data);
                })
                .catch((err) => {
                    console.log('ERROR: failed to update channel light message', channel_id, err);
                });
        })
        .catch((err) => {
            console.log('ERROR: failed to get data for update channel light message', err);
        });
}

export function closeLightEvent({ channel_id, user_id }) {
    getLastChannelEventId(channel_id)
        .then((event_id) => {
            console.log('Last channel event id', channel_id, event_id);
            setEventClosed(event_id)
                .then((close_result) => {
                    console.log('Event was closed', channel_id, event_id);
                    updateChannelMessageForLightEvent(channel_id, event_id);

                    // notify finally lost users
                    getExtraUsers(channel_id)
                        .then((finally_lost) => {
                            removeAllExtra(channel_id);
                            finally_lost.map((u) => {
                                sendUserFinallyLostLightAnswer(u, channel_id);
                            });
                            console.log('Channel light message was updated', channel_id, finally_lost);
                        })
                        .catch((err) => {
                            console.log('ERROR: failed to get finally lost users', channel_id, err);
                        });
                })
                .catch((err) => {
                    console.log('ERROR: failed to close event', event_id, err);
                });
        })
        .catch((err) => {
            console.log('ERROR: failed to get last channel event id', channel_id, err);
        });
}

export async function showUsersOnLongPause({ channel_id }) {
    const on_pause_list = await getLongPauseList(channel_id);
    const users_formatted = on_pause_list.map((user) => {
        const status_date_str = user.avail_date || `небывалых времен, возможно с ${user.cdate}`;
        return `<@${user.user_id}> на паузе c ${status_date_str}`
    });

    return {
        text: [
            "В канале есть следующие пользователи, находящиеся на паузе больше 2 недель:",
            ...users_formatted,
            "",
            "Cпросить их, возможно они забыли, что находятся на паузе? (Уведомления будут отправлены пользователям находящимся на паузе больше 2 недель)"
        ].join("\n"),
        attachments: [
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        "name": "ask_long_pause_users",
                        "text": "Спросить пользователей",
                        "type": "button",
                        "value": "do",
                    },
                    {
                        "name": "cancel",
                        "text": "Отмена",
                        "type": "button",
                        "value": "cancel",
                    },
                ]
            },
        ],
    };
}

export async function notifyLongPauseUsears({ channel_id }) {
    const web = getBotClient();
    const settings = await getChannelSettings(channel_id);

    const members = await getAllChannelMembers(channel_id);

    if (!members) {
        return {
            text: 'Невозможно получить список пользователей группы'
        }
    }

    let on_pause_list = await getLongPauseList(channel_id);
    let counter = 0;
    on_pause_list = on_pause_list.filter(u => members.indexOf(u.user_id) !== -1);
    on_pause_list.map(({ user_id, avail_date, cdate }) => {
        if (!avail_date) {
            avail_date = new Date(cdate);
            if ((Date.now() - avail_date.getTime()) < 14 * 24 * 60 * 60) {
                return;
            }
        }
        counter++;
        askLongPauseBreak({ user_id, channel_id });
    });

    return {
        text: [
            `Запросы о снятии с паузы разосланы! Всего: ${counter}`,
        ].join("\n"),
        attachments: [
            {
                callback_id: "admin_form",
                title: null,
                actions: [
                    {
                        "name": "cancel",
                        "text": "X",
                        "type": "button",
                        "value": "cancel",
                    },
                ]
            },
        ],
    };
}

export async function showStopDialog(trigger_id, channel_id) {
    const web = getBotClient();

    const settings = await getChannelSettings(channel_id);

    return web.dialog.open({
        trigger_id: trigger_id,
        dialog: {
            callback_id: "dialog-stop",
            title: "Приостановка раундов",
            submit_label: "Отправить",
            notify_on_cancel: true,
            elements: [
                {
                    type: "textarea",
                    name: "reason",
                    optional: true,
                    label: "Причина",
                    max_length: 512,
                    value: settings.stop_reason,
                    placeholder: "Это сообщение будет показано пользователям вместо старта нового раунда в канале.",
                    hint: "удалите причину, если хотите возобновить раунды",
                },
            ],
        }
    })
        .then((resp) => {
            console.log('Stop dialog was opened', resp.body);
        })
        .catch((err) => {
            console.log('ERROR: failed to open stop dialog', err);
            if (err.data && err.data.response_metadata && err.data.response_metadata.messages) {
                console.log(err.data.response_metadata.messages);
                console.log('========================================');
            }
        });
}

export function onStopReasonCome(payload) {
    const web = getBotClient();
    const reason = payload.submission.reason;

    updateChannelReason(payload.channel.id, reason)
        .then(() => {
            web.chat.postEphemeral({
                channel: payload.channel.id,
                user: payload.user.id,
                text: `Причина приостановки раундов установлена в:\n ${reason}`,
                as_user: true,
                attachments: [
                    {
                        callback_id: "user_form",
                        title: null,
                        actions: [
                            {
                                "name": "cancel",
                                "text": "X",
                                "type": "button",
                                "value": "cancel",
                            },
                        ]
                    },
                ]
            })
                .then((resp) => {
                    console.log('Reason update message was sent');
                })
                .catch((err) => {
                    console.log('ERROR: failed to send reason updaten message', err)
                });
        })
        .catch((err) => {
            console.log('ERROR: failed to update Channel Stop Reason', err)
        })
        ;
}

export async function initChannelInDb({ channel_id, user_id }) {
    const web = getBotClient();
    const settings = await getChannelSettings(channel_id);

    const info = await web.conversations.info({ channel: channel_id });
    console.log('Channel info', info);

    settings.name = info.channel.name;
    settings.is_group = info.channel.is_group ? 'Y' : 'N';

    if (!settings.id) {
        settings.schedule = "0 0 9 1 1 1";
        settings.extra_schedule = '0 0 9 1 1 1';
        settings.close_schedule = '0 0 9 1 1 1';
        settings.timezone = 'Europe/Kiev';
        settings.admins = [];
        // insert
        await createChannelSettings(settings);
    }
    else {
        await updateChannelSettings(channel_id, settings);
    }


    web.chat.postEphemeral({
        channel: channel_id,
        user: user_id,
        text: `Канал инициализирован`,
        as_user: true,
        attachments: [
            {
                callback_id: "user_form",
                title: null,
                actions: [
                    {
                        "name": "cancel",
                        "text": "Убрать",
                        "type": "button",
                        "value": "cancel",
                    },
                ]
            },
        ]
    })
        .then((resp) => {
            console.log('Channel init message was sent');
        })
        .catch((err) => {
            console.log('ERROR: failed to send channel init message', err)
        });
}
