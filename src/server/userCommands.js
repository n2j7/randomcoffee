import {
    getBotClient,
    getWebClient,
    getBotUserId
} from './slack_web';
import {
    getUserSettings,
    updateUserSettings,
    getUserChannelHistory,
    addExtra,
    addHistory,
} from './userModel';
import { getEventById } from './eventModel';
import { dbDatetime } from './utils';
import { updateChannelMessageForLightEvent } from './adminCommands';
import { isChannelRegistered } from './schedule';

export function helpMessage({ channel_id, user_id }) {
    return {
        text: [
            ":coffee: - это должно тебе помочь!",
            "Нет?",
            "Тогда возможно тебе станет легче от осознания того, что этот текст видишь только ты!",
            ":life-is-pain:"
        ].join("\n")
    };
}

export function userInterface({ channel_id, user_id }) {
    const web = getBotClient();

    getUserSettings(user_id, channel_id)
        .then((user_data) => {
            const { is_available = "Y", is_auto_ok = "N" } = user_data;
            const txt = (is_available == "Y")
                ? "Ты *участвуешь* в подборе пар"
                : "Ты на паузе и *не участвуешь* в подборе пар"
                ;
            const btn_txt = (is_available == "Y")
                ? "Не участвовать"
                : "Вернуться в строй"
                ;
            const btn_act = (is_available == "Y")
                ? "N"
                : "Y"
                ;
            const btn_style = (is_available == "Y")
                ? "danger"
                : "primary"
                ;
            const autook_state_str = (is_auto_ok == 'Y')
                ? "включен"
                : "выключен"
                ;

            let answer = {
                fallback: "Настройки Random Coffee",
                text: "<https://bit.ly/2xMNo9F|FAQ>",
                unfurl_links: false,
                attachments: [
                    {
                        callback_id: "user_form",
                        //color: "#e37f68",
                        text: txt,
                        mrkdwn_in: ["text"],
                        actions: [
                            {
                                "name": "set_avail",
                                "text": btn_txt,
                                "type": "button",
                                "value": btn_act,
                                "style": btn_style
                            },

                        ]
                    },
                    {
                        callback_id: "user_form",
                        text: `Режим автоподтверждения *${autook_state_str}*!`,
                        mrkdwn_in: ["text"],
                        actions: [
                            {
                                "name": "autook",
                                "text": is_auto_ok == 'Y' ? "Выключить" : "Включить",
                                "type": "button",
                                "value": is_auto_ok == 'Y' ? "N" : "Y",
                            },

                        ]
                    },
                    {
                        callback_id: "user_form",
                        title: null,
                        actions: [
                            {
                                "name": "my_history",
                                "text": "Посмотреть свою историю",
                                "type": "button",
                                "value": "show",
                            },
                        ]
                    },
                    {
                        callback_id: "user_form",
                        //color: "#e37f68",
                        title: null,
                        actions: [
                            {
                                "name": "cancel",
                                "text": "Скрыть настройки",
                                "type": "button",
                                "value": "remove",
                            },
                        ]
                    },
                ],
                as_user: true,
            };

            web.chat.postEphemeral(Object.assign({
                channel: channel_id,
                user: user_id, // usefull for postEphemeral
                as_user: true,
            }, answer))
                .then((resp) => {
                    console.log('User settings response was sent');
                })
                .catch((err) => {
                    console.log('ERROR: failed to show user settings', err)
                });
        });

    return '';
}

export function updateAvailability({ user_id, channel_id, value }) {
    const web = getBotClient();

    web.users.info({ user: user_id })
        .then((r) => {
            if (r.ok != true) {
                throw "bad response ok!=ok";
            }
            return r.user;
        })
        .catch((err) => { console.log('Slack USER.INFO', err); })
        .then((user_data) => {
            updateUserSettings({
                user_id,
                channel_id,
                is_available: value,
                avail_date: dbDatetime(new Date()),
                name: user_data.name,
                is_bot: user_data.is_bot ? "Y" : "N",
            })
                .then(() => {
                    web.chat.postEphemeral({
                        channel: channel_id,
                        user: user_id, // usefull for postEphemeral
                        text: `Настройки сохранены! Теперь ты *${value == 'Y' ? 'снова в строю' : 'на паузе'}*.`,
                        as_user: true,
                        attachments: [
                            {
                                callback_id: "user_form",
                                title: null,
                                actions: [
                                    {
                                        "name": "cancel",
                                        "text": "Ок!",
                                        "type": "button",
                                        "value": "cancel",
                                    },

                                ]
                            },
                        ],
                    })
                        .then((resp) => {
                            console.log('User settings accept response was sent');
                        })
                        .catch((err) => {
                            console.log('ERROR: failed to accept user settings', err)
                        });
                })
                ;
        })
        ;

    return {
        fallback: "RandomCoffee Action",
        text: null,
        delete_original: true
    };
}

export function getUserHistory({ user_id, channel_id }) {
    const web = getBotClient();
    getUserChannelHistory(user_id, channel_id)
        .then((user_history_list) => {
            web.chat.postEphemeral({
                channel: channel_id,
                user: user_id,
                text: [
                    "История твоих :coffee: - встреч в этом канале:",
                    user_history_list.map((u, i) =>
                        new String(i + 1).concat('.').padStart(3, ' ').concat(' <@', u, '>')
                    ).join("\n") || "у тебя все еще впереди :star-struck: :coffee: :+1:"
                ].join("\n"),
                as_user: true,
                attachments: [
                    {
                        callback_id: "user_form",
                        title: null,
                        actions: [
                            {
                                "name": "cancel",
                                "text": "Ок!",
                                "type": "button",
                                "value": "cancel",
                            },

                        ]
                    },
                ],
            })
                .then((resp) => {
                    console.log('User history response was sent');
                })
                .catch((err) => {
                    console.log('ERROR: failed to send user history', err)
                });
        })
        .catch((err) => { console.log('getUserHistory err', err); })
        ;
}

export async function sendUserNoticeAboutCreatedPair(user_id, channel_id, pair_data) {
    const web = getBotClient();
    const answer = await getPairContent(user_id, channel_id, pair_data);

    web.chat.postMessage(Object.assign(
        answer,
        {
            channel: user_id,
            as_user: true,
        }
    ))
        .then((r) => {
            console.log('User notice about pair creation was send', user_id, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send user notice about pair creation', user_id, err)
        });
}

export async function getPairContent(user_id, channel_id, pair_data, pre_text) {
    const webMain = getWebClient();

    if (!pre_text) {
        pre_text="";
    }

    const opponent_id = (user_id == pair_data.user_a_id)
        ? pair_data.user_b_id
        : pair_data.user_a_id
        ;
    const opponent_info = await webMain.users.profile.get({ user: opponent_id })
        .catch((err) => {
            console.log('ERROR: failed to get opponent info', err);
        });

    const opponent_settings = await getUserSettings(opponent_id, channel_id);

    const name_str = opponent_info.profile.status_text != ''
        ? `${opponent_info.profile.real_name_normalized}`
        : `${opponent_info.profile.status_emoji} ${opponent_info.profile.real_name_normalized}`
        ;

    const footer_str = opponent_info.profile.status_text != ''
        ? `Статус: ${opponent_info.profile.status_emoji} ${opponent_info.profile.status_text}`
        : null
        ;
    const msg = {
        text: [
            `${pre_text}:awesome: твоя пара сформирована!`,
            `В этот раз для канала <#${channel_id}> она выглядит так: <@${pair_data.user_a_id}> и <@${pair_data.user_b_id}>`,
        ].join("\n"),
        attachments: [
            {
                title: name_str,
                text: opponent_info.profile.title,
                image_url: opponent_info.profile.image_512,
                thumb_url: opponent_info.profile.image_192,
                footer: footer_str,
            },
        ],
    };

    if (opponent_settings && opponent_settings.story) {
        msg.attachments.push({
            title: null,
            mrkdwn_in: ["text"],
            text: opponent_settings.story,
        });
    }

    return msg;
}

export function sendBotNoSoSmart(channel_id) {
    const web = getBotClient();
    web.chat.postMessage({
        channel: channel_id,
        text: ':robot_face:',
        as_user: true,
    })
        .then((resp) => {
            console.log('Bot no so smart response was sent');
        })
        .catch((err) => {
            console.log('ERROR: failed to send bot no so smart message', err)
        });
}

export function sendUserOutMessage(channel_id, target_id) {
    const web = getBotClient();
    web.chat.postMessage({
        channel: channel_id,
        text: [
            `Мы видим, что ты покинул канал randomcoffee <#${target_id}>`,
        ].join("\n"),
        as_user: true,
        attachments: [
            {
                callback_id: "user_form",
                title: null,
                text: "Поделись пожалуйста причиной твоего ухода:",
                actions: [
                    {
                        name: "user_leave",
                        text: "Отпуск",
                        type: "button",
                        value: 'vacation',
                    },
                    {
                        name: "user_leave",
                        text: "Много работы",
                        type: "button",
                        value: 'work',
                    },
                    {
                        name: "user_leave",
                        text: "Другое",
                        type: "button",
                        value: 'etc',
                    },
                ]
            },
        ],
    })
        .then((resp) => {
            console.log('User out message was sent');
        })
        .catch((err) => {
            console.log('ERROR: failed to send user out message', err)
        });
}

export function sendUserHellowMessage(channel_id, target_id) {
    const web = getBotClient();
    const bot_user_id = getBotUserId();
    web.chat.postMessage({
        channel: channel_id,
        as_user: true,
        unfurl_links: false,
        text: [
            `Добро пожаловать в канал <#${target_id}> c рандомкофе! :tada:\n`,
            'Здесь ты сможешь каждую неделю знакомиться с новыми людьми! :star-struck:\n',
            '\n',
            `Процесс очень простой, в ближайший понедельник <@${bot_user_id}> спросит тебя `,
            'лично о готовности участвовать на этой неделе\n',
            `1) Если скажешь “готов”, то как только мы найдем тебе пару <@${bot_user_id}> `,
            'сообщит тебе об этом.\n',
            '2) Если нажмешь “нет” или ничего не сделаешь до 12:00 среды - пропустишь раунд ',
            'и будешь наблюдать как другие пьют кофе :)\n',
            '\n',
            '*Важный момент* - если вдруг у тебя изменились планы и ты не можешь принять ',
            'участие в randomcoffee, но пару тебе уже назначили - обязательно предупреди.\n',
            '\n',
            'Другие моменты тоже есть, но более точечные, поэтому мы записали их в ',
            '<https://bit.ly/2xMNo9F|FAQ>, глянь его, a если останутся вопросы - пиши ',
            `прямо в канал  <#${target_id}> и коллеги кофеманы с опытом обязательно помогут `,
            'тебе :nerd_face:\n',
            '\n',
            'Желаем тебе интересных знакомств! :wink:\n',
        ].join(''),
    })
        .then((resp) => {
            console.log('User hellow message response was sent');
        })
        .catch((err) => {
            console.log('ERROR: failed to send user hellow message', err)
        });
}

/**
 * 
 * @param {Number} user_id 
 * @param {String} channel_id 
 * @param {Number} event_id 
 * @param {Number} test_run
 */
export function askUserLightAvailability(user_id, channel_id, event_id, test_run) {
    test_run = test_run ? 1 : 0; //only digits due to serialization
    const web = getBotClient();
    web.chat.postMessage({
        channel: user_id,
        text: [
            `Привет, подтверди свою готовность к рандомкофе канала <#${channel_id}> на этой неделе`,
            "После того как ты подтвердишь свое участие мы сформируем и через некоторое время сообщим тебе твою пару!",
        ].join("\n"),
        as_user: true,
        attachments: [
            {
                callback_id: "user_form",
                title: null,
                actions: [
                    {
                        name: "user_ready_light",
                        text: "Я в деле!",
                        type: "button",
                        style: "primary",
                        value: `${event_id}|${channel_id}|${test_run}`,
                    },
                    {
                        name: "user_not_ready_light",
                        text: "Не в этот раз",
                        type: "button",
                        style: "danger",
                        value: `${event_id}|${channel_id}|${test_run}`,
                    },
                ]
            },
        ]
    })
        .then((r) => {
            console.log('User availability request was send', r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send user availability request', err)
        });
}

export function handleUserReadyLight({ user_id, data, msg }) {
    const [event_id, channel_id, test_run_raw] = data.split('|');
    const test_run = test_run_raw == "1";
    // get current event
    getEventById(event_id)
        .then((event_data) => {
            console.log('Event data fetched');
            if (!event_data || event_data.is_closed == 'Y') {
                sendUserTooLateLightAnswer(user_id, channel_id, event_data);
                return; // result is removing current message
            }
            addHistory([{
                channel_id: channel_id,
                user_a_id: user_id,
                user_b_id: 'light', // this is marker for light algo history
                is_a_ok: 'Y',
                is_b_ok: 'N', // forever N for have no affects on real list or history
                a_date: dbDatetime(new Date()),
                event_id: event_id,
            }]);
            // add user to extra list
            addExtra([{ channel_id, user_id }])
                .then(() => {
                    updateChannelMessageForLightEvent(channel_id, event_id);
                    console.log(`User ${user_id} was added into EXTRA table after confirm Light READY state.`);
                })
                .catch((err) => {
                    console.log('ERROR: failed to add user to EXTRA table after confirm Light READY state', user_id, err)
                });
            ;
        })
        .catch((err) => {
            console.log('ERROR: failed to fetch event data', event_id, err)
        });

    // @TODO: answer only after DB has changed (maybe by post_url)
    msg.attachments = [
        {
            callback_id: "user_form",
            title: null,
            color: "#36a64f",
            text: ':star-struck: Твой ответ: "Я в деле!"',
        },
    ];

    return msg;
}

export function handleUserNotReadyLight({ user_id, data, msg }) {
    const [event_id, channel_id, test_run] = data.split('|');

    // get current event
    getEventById(event_id)
        .then((event_data) => {
            console.log('Event data fetched');
            addHistory([{
                channel_id: channel_id,
                user_a_id: user_id,
                user_b_id: 'light', // this is marker for light algo history
                is_a_ok: 'N',
                is_b_ok: 'N', // forever N for have no affects on real list or history
                a_date: dbDatetime(new Date()),
                event_id: event_id,
            }]);
            if (!event_data || event_data.is_closed == 'Y') {
                sendUserTooLateLightAnswer(user_id, channel_id, event_data);
                return; // result is removing current message
            }
            // nothing to do at this point
        })
        .catch((err) => {
            console.log('ERROR: failed to fetch event data', event_id, err)
        });

    msg.attachments = [
        {
            callback_id: "user_form",
            title: null,
            color: "#ff0000",
            text: ':zany_face: Твой ответ: "Не в этот раз". '
                + 'Мы рассчитываем на тебя в следующий раз, не теряйся! '
                + '<https://goo.gl/forms/ibIfS5BU2VPEKez73|Форма обратной связи>',
        },
    ];

    return msg;
}

export function sendUserTooLateLightAnswer(user_id, channel_id, event_data) {
    const web = getBotClient();

    const event_date = new Date(event_data.cdate);
    event_date.setDate(event_date.getDate() + 2);
    event_date.setHours(12, 0, 0, 0);

    web.chat.postMessage({
        channel: user_id,
        unfurl_links: false,
        text: [
            `Сорри, но этот раунд в <#${channel_id}> закрыт ${dbDatetime(event_date)}, в следующий раз успей ответить до 12:00 среды.`,
            "<https://goo.gl/forms/ibIfS5BU2VPEKez73|Нашелся баг или хочешь поделиться обратной связью, просьбой, идеей>",
        ].join("\n"),
        as_user: true,
    })
        .then((r) => {
            console.log('User notice about pair creation was send', user_id, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send user notice about pair creation', user_id, err)
        });
}

export function sendUserFinallyLostLightAnswer(user_id, channel_id) {
    const web = getBotClient();

    web.chat.postMessage({
        channel: user_id,
        unfurl_links: false,
        text: [
            `Сорри, но в этот раз в <#${channel_id}> не осталось тех, с кем можно попить кофе. В следующий раз рекомендуем тебе раньше подтверждать свое участие (так больше шансов что мы найдем тебе пару).`,
            "<https://goo.gl/forms/ibIfS5BU2VPEKez73|Нашелся баг или хочешь поделиться обратной связью, просьбой, идеей>",
        ].join("\n"),
        as_user: true,
    })
        .then((r) => {
            console.log('User notice about pair creation was send', user_id, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send user notice about pair creation', user_id, err)
        });
}

export function handleUserLeaveFeedback({ user_id, answer, msg }) {
    let out_msg = '';
    if (answer == 'vacation') {
        out_msg = 'Твоя причина - отпуск! Это ты зря, специально для тебя мы сделали функционал "паузы"! '
            + 'Ты можешь вернуться в канал, написать там `/coffee`, нажать кнопку "Не участвовать" '
            + 'и бот не будет тревожить тебя в отпуске! :wink:';
    }
    else if (answer == 'work') {
        out_msg = 'Твоя причина - много работы! Это ты зря, ведь ты можешь ответить "нет" '
            + 'на приглашение бота или просто проигнорировать сообщение от него, '
            + 'чтобы не попасть в пару!';
    }
    else if (answer == 'etc') {
        out_msg = 'Твоя причина - другое! Мы будем благодарны, если ты заполнишь '
            + '<https://goo.gl/forms/ibIfS5BU2VPEKez73|feedback форму> '
            + 'и дашь нам возможность исправить ситуацию!';
    }
    msg.attachments = [
        {
            callback_id: "user_form",
            title: null,
            color: "#ff0000",
            text: out_msg
        },
    ];

    return msg;
}

export async function onAutoOkChanged({ channel_id, user_id, answer }) {
    const web = getBotClient();

    const user_data = await web.users.info({ user: user_id })
        .then((r) => {
            if (r.ok != true) {
                throw "bad response ok!=ok";
            }
            return r.user;
        })
        .catch((err) => { console.log('Slack USER.INFO', err); })

    let u_settings = await getUserSettings(user_id, channel_id) || {};
    u_settings = Object.assign(
        u_settings,
        {
            user_id,
            channel_id,
            is_auto_ok: answer,
            name: user_data.name
        }
    );
    await updateUserSettings(u_settings);

    let out_txt;
    if (answer == 'Y') {
        out_txt = [
            "Мы перевели тебя в режим автоподтверждения!",
            "Система не спрашивая твоего согласия автоматом подтверждает участие в запущеных раундах randomcoffee в этом канале!"
        ].join("\n");
    }
    else {
        out_txt = "Режим автоподтверждения выключен!";
    }

    const msg = {
        text: null,
        attachments: [
            {
                callback_id: "user_form",
                title: null,
                text: out_txt,
                actions: [
                    {
                        "name": "cancel",
                        "text": "Убрать это сообщение",
                        "type": "button",
                        "value": "cancel",
                    },
                ]
            },
        ]
    };

    return msg;
}

export async function wrongChannelUsed({ user_id }) {
    const web = getBotClient();
    let suggest_channels = [];

    const user_channels = await web.users.conversations({
        exclude_archived: true,
        types: 'public_channel',
        // types: 'public_channel,private_channel', // slack can't show links for private channels
        user: user_id,
    })
        .then((r) => {
            if (r.ok != true) {
                throw "bad response ok!=ok";
            }
            return r.channels;
        })
        .catch((err) => { console.log('Slack USERS.CONVERSATIONS', err); })
        ;

    if (user_channels && user_channels.length) {
        user_channels.map((c) => {
            if (!isChannelRegistered(c.id)) {
                return;
            }
            suggest_channels.push(`<#${c.id}>`);
        })
    }

    const suggest_str = (suggest_channels.length)
        ? "\n\n" + suggest_channels.join("\n")
        : ""
        ;


    const msg = {
        text: null,
        attachments: [
            {
                callback_id: "user_form",
                title: null,
                text: [
                    ":robot_face: :disappointed2: К сожалению эта команда может работать ",
                    `только в канале, где запущен randomcoffee!${suggest_str}`
                ].join(''),
                actions: [
                    {
                        "name": "cancel",
                        "text": "Убрать это сообщение",
                        "type": "button",
                        "value": "cancel",
                    },
                ]
            },
        ]
    };
    return msg;
}

export function askLongPauseBreak({ user_id, channel_id }) {
    const web = getBotClient();

    return web.chat.postMessage({
        channel: user_id,
        text: [
            "Привет!",
            `Мы заметили, что ты слишком долго находишься на паузе в канале <#${channel_id}>`,
            `Ты пропускаешь много увлекательных встреч, кроме того, возможно, кто-то хочет встретиться именно с тобой! :star-struck:`,
        ].join("\n"),
        attachments: [
            {
                callback_id: "user_form",
                //color: "#e37f68",
                text: null,
                mrkdwn_in: ["text"],
                actions: [
                    {
                        "name": "set_avail_long",
                        "text": "Уберите меня с паузы",
                        "type": "button",
                        "value": `Y|${channel_id}`,
                        "style": "primary",
                    },
                    {
                        "name": "set_avail_long",
                        "text": "Я хочу остаться на паузе",
                        "type": "button",
                        "value": `N|${channel_id}`,
                        "style": "danger",
                    },
                ]
            },
        ],
        as_user: true,
    })
        .then((r) => {
            console.log('User notice about long pause was send', user_id, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send user notice about long pause', user_id, err)
        });
}

export function updateLongAvailability({ user_id, channel_id, answer }) {
    const web = getBotClient();
    const [value, target_channel_id] = answer.split('|');

    web.users.info({ user: user_id })
        .then((r) => {
            if (r.ok != true) {
                throw "bad response ok!=ok";
            }
            return r.user;
        })
        .catch((err) => { console.log('Slack USER.INFO', err); })
        .then((user_data) => {
            updateUserSettings({
                user_id,
                channel_id: target_channel_id,
                is_available: value,
                avail_date: dbDatetime(new Date()),
                name: user_data.name,
                is_bot: user_data.is_bot ? "Y" : "N",
            })
                .then(() => {
                    const result_str = (value == 'Y')
                        ? `Настройки сохранены! Теперь ты больше не на паузе в канале <#${target_channel_id}> :star-struck:`
                        : `Ок, ты продолжаешь находиться на паузе в канале <#${target_channel_id}>`
                        ;
                    web.chat.postEphemeral({
                        channel: channel_id,
                        user: user_id, // usefull for postEphemeral
                        text: result_str,
                        as_user: true,
                        attachments: [
                            {
                                callback_id: "user_form",
                                title: null,
                                actions: [
                                    {
                                        "name": "cancel",
                                        "text": "Ок!",
                                        "type": "button",
                                        "value": "cancel",
                                    },

                                ]
                            },
                        ],
                    })
                        .then((resp) => {
                            console.log('User settings accept response was sent');
                        })
                        .catch((err) => {
                            console.log('ERROR: failed to accept user settings', err)
                        });
                })
                ;
        })
        ;
}

export async function manageUserStory({ user_id, channel_id }) {
    const user_settings = await getUserSettings(user_id, channel_id);

    const msg = {
        text: [
            ":alien: Это секретная команда! :face_with_monocle: Кто проболтался? :scream:",
            "В любом случае, теперь, ты можешь править *свою маленькую историю*! :nerd_face:",
            "Эта история будет показана твоему оппоненту randomcoffee!",
            "Напиши что-нибудь классное! :rocket::muscle::crown:",
        ].join("\n"),
        attachments: [
            {
                title: "Твоя маленькая история:",
                text: user_settings.story || ":open_mouth: еще не написана",
                mrkdwn_in: ["text"],
            },
            {
                callback_id: "user_form",
                title: null,
                text: null,
                actions: [
                    {
                        "name": "story",
                        "text": "Редактировать",
                        "type": "button",
                        "value": "write",
                    },
                    {
                        "name": "story",
                        "text": "Посмотреть",
                        "type": "button",
                        "value": "show",
                    },
                    {
                        "name": "cancel",
                        "text": "Отмена",
                        "type": "button",
                        "value": "cancel",
                    },
                ]
            },
        ]
    };

    return msg;
}

export async function editUserStory({ user_id, channel_id, trigger_id }) {
    const web = getBotClient();
    const user_settings = await getUserSettings(user_id, channel_id);

    return web.dialog.open({
        trigger_id: trigger_id,
        dialog: {
            callback_id: "dialog-story",
            title: "Моя маленькая история",
            submit_label: "Отправить",
            notify_on_cancel: false,
            elements: [
                {
                    type: "textarea",
                    label: "Текст",
                    name: "story",
                    value: user_settings.story,
                    optional: "true",
                    placeholder: "",
                    max_length: 250,
                    hint: "Напиши про себя, свои увлечения, что тебя драйвит и конечно же - когда обычно ты ходишь на randomcoffee! (день, время)",
                },
            ],
        }
    });
}

export async function onSaveUserStory(payload) {
    const web = getBotClient();
    const story = payload.submission.story;

    const user_data = await web.users.info({ user: payload.user.id })
        .then((r) => {
            if (r.ok != true) {
                throw "bad response ok!=ok";
            }
            return r.user;
        })
        .catch((err) => { console.log('Slack USER.INFO', err); });

    await updateUserSettings({
        channel_id: payload.channel.id,
        user_id: payload.user.id,
        name: user_data.name,
        story,
    });

    const answer = await manageUserStory({
        channel_id: payload.channel.id,
        user_id: payload.user.id,
    });

    web.chat.postEphemeral(Object.assign(answer, {
        channel: payload.channel.id,
        user: payload.user.id,
        as_user: true,
    }))
        .then((resp) => {
            console.log('User story was updated for user', payload.user.id, payload.channel.id);
        })
        .catch((err) => {
            console.log('ERROR: failed to update user story', err, payload.user.id, payload.channel.id)
        });
}

export async function showUserStory({ user_id, channel_id }) {
    const web = getBotClient();

    let answer = await getPairContent(
        getBotUserId(),
        channel_id,
        { user_a_id: user_id, user_b_id: getBotUserId() },
        "*Вот, что может увидеть твой оппонент:*\n\n"
    );

    answer.attachments.push({
        callback_id: "user_form",
        title: null,
        text: null,
        actions: [
            {
                "name": "story",
                "text": "Редактировать",
                "type": "button",
                "value": "write",
            },
            {
                "name": "cancel",
                "text": "Убрать",
                "type": "button",
                "value": "cancel",
            },
        ]
    },);

    web.chat.postEphemeral(Object.assign(answer, {
        channel:channel_id,
        user: user_id,
        as_user: true,
    }))
        .then((resp) => {
            console.log('User pair example was send', user_id, channel_id);
        })
        .catch((err) => {
            console.log('ERROR: failed to send pair example', err, user_id, channel_id)
        });
}
