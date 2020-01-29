import { getBotClient, slackAsyncResponce } from "./slack_web";
import { getConfig } from "./config";
import squel from 'squel';
import { execQuery } from './db';
import { dbDatetime } from "./utils";

const QUESTIONS = [
    {// 1
        q: "Зерна, из которых делают кофе - на самом деле:",
        p: 'http://evo-rc.tk/pics/_103642797_a64af05a-acf0-41ab-98aa-3fa1ec1d820c.jpg',
        a: ["Фрукт, вишня", "Куст, акация", "Ягода, горох", "Моллюск, улитка"]
    },
    {// 2
        q: "Какое животное связано с самым дорогим кофе?",
        p: 'http://evo-rc.tk/pics/maxresdefault.jpg',
        a: ["Циветта", "Скунс", "Панда", "Эфиопская антилопа"]
    },
    {// 3
        q: "С какой болезнью помогает бороться кофе если употреблять его в умеренном количестве?",
        p: 'http://evo-rc.tk/pics/1511117698-1039354741-1.jpg',
        a: ["Альцгеймер", "Волчанка", "Полиомиелит", "Биполярное расстройство"]
    },
    {// 4
        q: "Сколько видов растений, относящихся к роду кофе имеют промышленное применение?",
        p: 'http://evo-rc.tk/pics/confectionery_1711_1.jpg',
        a: ["Два", "Семь", "±90", "~100500"]
    },
    {// 5
        q: "Какие животные связаны с открытием кофе?",
        p: 'http://evo-rc.tk/pics/depositphotos_124507146-stock-illustration-ram-goat-drinking-coffee-drawing.jpg',
        a: ["Козы", "Овцы", "Слоны", "Ламмы"]
    },
    {// 6
        q: "Где в мире появились первые кофейни?",
        p: 'http://evo-rc.tk/pics/9ef1a6_2be828bb3d2a4cfbb881fadabc645564~mv2.jpg',
        a: ["На ближнем востоке", "На далеком севере", "На диком западе", "На Тибете"]
    },
    {// 7
        q: "Какая страна является крупнейшим производителем кофе?",
        p: 'http://evo-rc.tk/pics/brazilskij-kofe1.jpg',
        a: ["Бразилия", "Китай", "Колумбия", "Ватикан"]
    },
    {// 8
        q: "В какой стране больше всего употребляют кофе на душу населения?",
        p: 'http://evo-rc.tk/pics/depositphotos_211741086-stock-photo-helsinki-finland-august-unidentified-people.jpg',
        a: ["Финляндия", "Китай", "Украина", "Ватикан"]
    },
    {// 9
        q: "Какое произношение кофеного напитка - правильное?",
        p: 'http://evo-rc.tk/pics/Espresso_9575-1.jpg',
        a: ["Эспрессо", "Экспрессо", "Эстрессо", "Этсамое"]
    },
    {// 10
        q: "Какого числа в Японии отмечают день кофе?",
        p: 'http://evo-rc.tk/pics/japan_1_oct.jpg',
        a: ["1 октября", "8 марта", "1 января", "31 февраля"]
    },
    {// 11
        q: "Кто изобрел растворимый кофе?",
        p: 'http://evo-rc.tk/pics/George_Constant_Louis_Washington.jpg',
        a: ["Джордж Вашингтон", "Ульф Марк Шнейдер", "Дональд Трамп", "Чак Норрис"]
    },
    {// 12
        q: "Кофе занимает вторую позицию в мировом рейтинге наиболее продаваемых товаров. Какой товар на первой позиции?",
        p: 'http://evo-rc.tk/pics/Kofeynaya-karta-mira.jpg',
        a: ["Нефть", "Чай", "Рис", "Носки"]
    },
    {// 13
        q: "Сколько калорий в чашке черного кофе без сахара?",
        p: 'http://evo-rc.tk/pics/kofe-01-e1424264149796.jpg',
        a: ["Ноль", "Одна", "Примерно 100", "100500"]
    },
    {// 14
        q: "Сколько за год в мире выпивается чашек кофе?",
        p: 'http://evo-rc.tk/pics/depositphotos_68116551-stock-photo-many-cups-of-coffee-top.jpg',
        a: ["более 500 млрд", "122325643259 чашек!", "почти 1.5 млн", "800 тыс"]
    },
    {// 15
        q: "Что входит в состав Ирландского кофе?",
        p: 'http://evo-rc.tk/pics/irish-coffee.jpg',
        a: ["Виски", "Потин", "Чай", "Лимон"]
    },
    {// 16
        q: "В каком университете была изобретена веб-камера, чтобы следить за кофемашиной?",
        p: 'http://evo-rc.tk/pics/Trojan_Room_coffee_pot_xcoffee.png',
        a: ["Кембридж", "Колумбийский", "Поплавского", "Мичиган"]
    },
    {// 17
        q: "Какова смертельная доза кофеина в чашках кофе?",
        p: 'http://evo-rc.tk/pics/1520342432166049730.jpg',
        a: ["100 чашек", "9 чашек", "1000 чашек", "36.6 чашек"]
    },
    {// 18
        q: "Кто из известных композиторов написал \"Кофейную кантату\"?",
        p: 'http://evo-rc.tk/pics/kantata14.jpg',
        a: ["Бах", "Моцарт", "Скриптонит", "Шуберт"]
    },
    {// 19
        q: "Когда в Ирландии отмечают Национальный день кофе?",
        p: 'http://evo-rc.tk/pics/Irish-Coffee.jpg',
        a: ["19 сентября", "13 августа", "19 апреля", "9 мая"]
    },
    {// 20
        q: "Как долго Наташа не пьет кофе?\n(попробуй ответить с первого раза :troll-green:)",
        p: 'http://evo-rc.tk/pics/DSC7019.jpg',
        a: ["2 года", "пару дней", "с апреля", "никогда не пила"]
    },
];

const QUESTIONS_COUNT = 20;
const WRONG_ANSWER_DELAY = 20; //sec

const arrayShuffle = (a) => {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

export function competitionInvite({ user_id, channel_id }) {
    const web = getBotClient();

    web.chat.postMessage({
        channel: channel_id,
        // user: user_id, // usefull for postEphemeral
        text: 'День Рождения *EvoRandomCoffee*',
        as_user: true,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: [
                        ":robot_face: Ну что, безкремниевые, готовы к конкурсу? :party::tada::birthday:",
                        "Кто сможет ответить на мои 20 вопросов о кофе быстрее всех? :smirk:",
                    ].join("\n")
                },
            },
            {
                type: "divider"
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: "Тут должен следовать смех, но мои возможности звукоподражания ограничены. Я пробовал смеяться, но это пугает людей."
                    }
                ]
            },
            {
                type: "actions",
                block_id: "competition_hellow",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Узнать про конкурс"
                        },
                        action_id: "btn_wtf",
                        style: "primary"
                    },
                ]
            },
        ]
    })
        .then((resp) => {
            console.log('competitionInvite response was sent for');
        })
        .catch((err) => {
            console.log('ERROR: failed to send competitionInvite', err)
        });
}

export function competitionIntro({ user_id, channel_id }) {
    const web = getBotClient();

    if (Date.now() > 1562936400000) { // 2019-07-12 16:00:00
        web.chat.postEphemeral({
            channel: channel_id,
            user: user_id, // usefull for postEphemeral
            text: 'Условия конкурса на День Рождения *EvoRandomCoffee*',
            as_user: true,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: [
                            "К сожалению, конкурс уже завершен! :disappointed2:",
                            "Мне больше нечего тебе предложить, сорри! :face_with_rolling_eyes:"
                        ].join("\n")
                    },
                },
            ]
        })
            .then((resp) => {
                console.log('competitionIntro ENDS response was sent for', user_id);
            })
            .catch((err) => {
                console.log('ERROR: failed to send competitionIntro ENDS', err)
            });
        return;
    }

    web.chat.postEphemeral({
        channel: channel_id,
        user: user_id, // usefull for postEphemeral
        text: 'Условия конкурса на День Рождения *EvoRandomCoffee*',
        as_user: true,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: [
                        "Привет! :star-struck:",
                        "Хочешь поучавствовать в конкурсе на День Рождения *EvoRandomCoffee* и выиграть небольшой презент на баре?",
                        "Ты по адресу! :awesome:",
                        "",
                        "Конкурс простой:",
                        "- нажми кнопку *Cтарт*",
                        "- бот напишет тебе в личку",
                        "- правильно ответь на несколько вопросов",
                        "- получи финальное сообщение от бота",
                        "- покажи его бариста CoffeeNostra в офисе EVO"
                    ].join("\n")
                },
                accessory: {
                    type: "image",
                    image_url: "http://evo-rc.tk/pics/57c3ccfac2e73156d4d8b3ae.png",
                    alt_text: "coffee heart"
                }
            },
            {
                type: "divider"
            },
            {
                type: "actions",
                block_id: "competition_intro",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Старт"
                        },
                        action_id: "btn_start",
                        style: "primary"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Позже"
                        },
                        action_id: "btn_later",
                    }
                ]
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: "Классно, если у тебя установлен slack на телефоне/планшете и ты сможешь показать сообщение для бариста с него! Если это не так, а так же в случае непонятных ситуаций/проблем пиши в личку @a.koretskiy - все решим :wink:"
                    }
                ]
            }
        ]
    })
        .then((resp) => {
            console.log('competitionIntro response was sent for', user_id);
        })
        .catch((err) => {
            console.log('ERROR: failed to send competitionIntro', err)
        });
}

export async function competitionRegistration({ user_id, user_name, channel_id }) {
    const web = getBotClient();

    let user_data = await getUser(user_id);

    if (!user_data) {
        await registerUser({
            user_id,
            user_name,
            start_time: dbDatetime(new Date()),
        });
    }
    else {
        web.chat.postEphemeral({
            channel: channel_id,
            user: user_id, // usefull for postEphemeral
            text: 'Условия конкурса на День Рождения *EvoRandomCoffee*',
            as_user: true,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text:
                            user_data.complete_time
                                ? "Хм... :thinking_face: Кажется конкурс для тебя уже завершен! :disappointed2:"
                                : [
                                    "Хм... :thinking_face: Кажется конкурс для тебя уже стартовал!",
                                    "Перейди к диалогу с EvoRandomCoffee, чтобы продолжить!",
                                    ":disappointed2: мне больше нечего тебе предложить, сорри! :face_with_rolling_eyes:"
                                ].join("\n")
                    }
                },
                {
                    type: "divider"
                },
                {
                    type: "actions",
                    block_id: "competition_intro",
                    elements: [
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "EvoRandomCoffee напиши мне"
                            },
                            action_id: "btn_lost",
                        },
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Все ясно, убрать сообщение"
                            },
                            action_id: "btn_later",
                        }
                    ]
                },
            ]
        })
            .then((resp) => {
                console.log('competitionIntro second start message was sent for', user_id);
            })
            .catch((err) => {
                console.log('ERROR: failed to send competitionIntro second start', err);
            });
        return;
    }

    // notify admin
    notifyAdmins(`Регистрация в EvoRandomCoffee HB от <@${user_id}>`);

    web.chat.postMessage({
        channel: user_id,
        text: "Регистрация в конкурсе на День рождения EvoRandomCoffee",
        blocks: [
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: [
                        "Ну что, начнем?",
                        "Хотя, погоди, тебе стоит знать, что:",
                        "- не стоит воспринимать вопросы слишком серьезно :sunglasses:",
                        "- любые неточности в ответах могут быть исправлены, но не будут :sad_alcoholic:",
                        "- гуглить умеют все, а ты попробуй сам :awesome:",
                        '- все это "just for fun" :tada:'
                    ].join("\n")
                },
                accessory: {
                    type: "image",
                    image_url: "http://evo-rc.tk/pics/57c3ccfac2e73156d4d8b3ae.png",
                    alt_text: "coffee heart"
                }
            },
            {
                type: "actions",
                block_id: "competition_run",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Давай уже вопрос!"
                        },
                        action_id: "get_question",
                        style: "primary"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Слишком сложно, я пас"
                        },
                        action_id: "btn_later",
                        style: "danger"
                    },
                ]
            },
        ],
        as_user: true,
    })
        .then((r) => {
            console.log('User notice about competition registration was sent', user_id, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send user competition registration', user_id, err)
        });
}

export async function getQuestion({ user_id }) {
    const user_data = await getUser(user_id);

    if (!user_data) {
        return true; // just drop this message (and destroy on userside)
    }

    if (Date.now() / 1000 - user_data.fail_time < WRONG_ANSWER_DELAY) {
        return false;
    }

    const available_questions_ind = arrayShuffle(// shuffle whole array
        Object.keys(QUESTIONS).filter((v, i) => {// get all indexes
            // exclude already asked questions
            return user_data.questions.indexOf(i) === -1;
        })
    );

    const rnd_ind = Math.round(Math.random() * (available_questions_ind.length - 1));
    const question_ind = parseInt(available_questions_ind[rnd_ind]);
    const question = QUESTIONS[question_ind];

    // add question index to list of used for that user
    user_data.questions.push(question_ind);
    await updateUser(
        user_id,
        { questions: user_data.questions }
    );

    let correct_action = 'get_question';
    if (user_data.questions.length >= QUESTIONS_COUNT) {
        correct_action = 'get_prize'
    }

    const blocks = [
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Вопрос ${user_data.questions.length} из ${QUESTIONS_COUNT}`
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: question.q
            },
            accessory: {
                type: "image",
                image_url: question.p,
                alt_text: "question picture"
            }
        },
        {
            type: "actions",
            block_id: "competition_run",
            elements: arrayShuffle(question.a.map((a, i) => {
                return {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: a.toString()
                    },
                    value: "" + question_ind,
                    action_id: i == 0 ? correct_action : `wrong${i}`
                }
            }))
        },
    ];

    const web = getBotClient();
    web.chat.postMessage({
        channel: user_id,
        text: "Вопрос конкурса на День Рождения EvoRandomCoffee",
        blocks,
        as_user: true,
    })
        .then((r) => {
            console.log('Competition question was sent', user_id, user_data, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send competition question', user_id, err, blocks);
        });

    return true;
}

export async function getPrize({ user_id }) {
    const web = getBotClient();

    // mark as complete
    await updateUser(
        user_id,
        { complete_time: Date.now() }
    );

    const user_data = await getUser(user_id);
    const competition_time = user_data.complete_time - user_data.start_time;

    // notify admin
    notifyAdmins(`:tada: Приз в EvoRandomCoffee HB заслужил <@${user_id}> выполнивший конкурс за ${competition_time} сек`);

    const blocks = getPrizeBlocks();

    web.chat.postMessage({
        channel: user_id,
        text: "Приз конкурса на День Рождения EvoRandomCoffee",
        blocks,
        as_user: true,
    })
        .then((r) => {
            console.log('Competition prize was sent', user_id, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send competition prize', user_id, err, blocks);
        });
}

function getPrizeBlocks() {
    return [
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Приз ждет тебя на баре! :tada::coffee::star-struck:`
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Это нелегкое испытание пройдено! Самое время отправляться на бар! :awesome:"
            },
            accessory: {
                type: "image",
                image_url: "http://evo-rc.tk/pics/800px-Coffeee_img451.jpg",
                alt_text: "question picture"
            }
        },
        {
            type: "actions",
            block_id: "competition_complete",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Кнопка бариста"
                    },
                    style: "danger",
                    action_id: 'barista',
                    confirm: {
                        title: {
                            type: 'plain_text',
                            text: 'Подтверждение получения приза на баре'
                        },
                        text: {
                            type: 'plain_text',
                            text: 'Бариста нажимает эту кнопку, когда выдает тебе кофе! Не стоит жать ее просто так, ты рискуешь потерять свой подарок! После нажатия кнопки бариста - сообщение пропадет!'
                        },
                        confirm: {
                            type: 'plain_text',
                            text: 'Я бариста, кофе выдан'
                        },
                        deny: {
                            type: 'plain_text',
                            text: 'Ой-ой, я случайно!'
                        }
                    }
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Кнопка для тебя"
                    },
                    style: "primary",
                    action_id: 'for_user'
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "А что, если..."
                    },
                    action_id: 'what_if'
                }
            ]
        },
    ];
}

export async function onWrongAnswer({ user_id, payload, action }) {
    const user_data = await getUser(user_id);

    if (!user_data) {
        slackAsyncResponce(
            payload.response_url,
            { delete_original: "true" }
        );
        return;
    }

    let wait_time = Math.round(WRONG_ANSWER_DELAY - (Date.now() / 1000 - user_data.fail_time));

    if (wait_time <= 0) {
        // register new fail
        await updateUser(
            user_id,
            { fail_time: Date.now() }
        );
    }

    const question = QUESTIONS[action.value];

    let correct_action = 'get_question';
    if (user_data.questions.length >= QUESTIONS_COUNT) {
        correct_action = 'get_prize'
    }

    const blocks = [
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Вопрос ${user_data.questions.length} из ${QUESTIONS_COUNT}`
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: question.q
            },
            accessory: {
                type: "image",
                image_url: question.p,
                alt_text: "question picture"
            }
        },
        {
            type: "actions",
            block_id: "competition_run",
            elements: arrayShuffle(question.a.map((a, i) => {
                return {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: a.toString()
                    },
                    value: "" + action.value,
                    action_id: i == 0 ? correct_action : `wrong${i}`
                }
            }))
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: wait_time > 0
                        ? `:scream: В течение 20 секунд (осталось ${wait_time} сек) твои ответы игнорируются! Тебе срочно нужно восполнить свои знания про кофе за чашечкой этого ароматного напитка! :like-a-sir:`
                        : `*${action.text.text}* - неправильный ответ! Попробуй ответить снова через 20 секунд, до этого времени все твои ответы будут проигнорированы!`
                }
            ]
        },
    ];

    slackAsyncResponce(
        payload.response_url,
        {
            channel: user_id,
            text: "Обновление сообщения",
            blocks,
            replace_original: "true",
            as_user: true,
        }
    );
}

export function writeMeBack({ user_id }) {

    const web = getBotClient();

    web.chat.postMessage({
        channel: user_id,
        text: "Потеряшка в конкурсе на День рождения EvoRandomCoffee",
        blocks: [
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: [
                        "Не теряйся! :hugging_face:",
                    ].join("\n")
                },
            },
            {
                type: "actions",
                block_id: "competition_intro",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Все, чат найден, спасибо!"
                        },
                        action_id: "ololo_iam_here",
                    },
                ]
            },
        ],
        as_user: true,
    })
        .then((r) => {
            console.log('User lost chat message was sent', user_id, r);
        })
        .catch((err) => {
            console.log('ERROR: failed to send user lost chat message', user_id, err)
        });
}

export async function unregsterUser({ user_id }) {
    await deleteUser(user_id);

    // notify admin
    notifyAdmins(`ОТМЕНА регистрации в EvoRandomCoffee HB от <@${user_id}>`);
}

export async function onFinishUserButtonPressed({ user_id, payload, action }) {
    let user_data = await getUser(user_id);

    if (!user_data) {
        return;
    }

    const blocks = [
        ...getPrizeBlocks(),
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Ты справился с заданием за ${user_data.complete_time - user_data.start_time} сек. Остальные кнопки жать не нужно! :blush:`
                }
            ]
        },
    ];

    slackAsyncResponce(
        payload.response_url,
        {
            channel: user_id,
            text: "Обновление сообщения",
            blocks,
            replace_original: "true",
            as_user: true,
        }
    );
}

export async function onFinishWhatIfPressed({ user_id, payload, action }) {
    const blocks = [
        ...getPrizeBlocks(),
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `... ничего не произойдет :life-is-pain:`
                }
            ]
        },
    ];

    slackAsyncResponce(
        payload.response_url,
        {
            channel: user_id,
            text: "Обновление сообщения",
            blocks,
            replace_original: "true",
            as_user: true,
        }
    );
}

export function notifyAdmins(msg) {
    const web = getBotClient();
    const CONFIG = getConfig();

    CONFIG.super_users.map(admin => {
        web.chat.postMessage({
            channel: admin,
            text: msg,
            as_user: true,
        })
            .then((r) => {
                console.log('notifyAdmins was sent', r);
            })
            .catch((err) => {
                console.log('ERROR: failed to send notifyAdmins', err);
            });
    });
}

export function baristaClick({ user_id }) {
    notifyAdmins(`:coffee: Бариста выдал кофе для <@${user_id}>`);
}

function registerUser(data) {
    let query = squel.insert()
        .into('competition_log')
        .setFields(data)
        ;

    return execQuery(query)
        .then((results) => {
            return results.insertId;
        })
        .catch((err) => {
            console.log('competition:registerUser:', err);
        });
}

function getUser(user_id) {
    let query = squel.select()
        .from('competition_log')
        .fields({
            'user_id': 'user_id',
            'UNIX_TIMESTAMP(start_time)': 'start_time',
            'UNIX_TIMESTAMP(fail_time)': 'fail_time',
            'UNIX_TIMESTAMP(complete_time)': 'complete_time',
            'questions': 'questions',
        })
        .where('user_id = ?', user_id)
        ;

    return execQuery(query)
        .then((results) => {
            if (!results) {
                return {};
            }
            const questions = (results[0].questions || "").split(',')
                .filter(e => !!e)
                .map(e => parseInt(e, 10))
                ;
            return {
                ...results[0],
                questions
            };
        })
        .catch((err) => {
            console.log('competition:getUser:', err);
        });
}

function updateUser(user_id, data) {

    if (data.questions) {
        data.questions = data.questions.join(",");
    }

    if (data.fail_time) {
        data.fail_time = squel.str('FROM_UNIXTIME(?)', Math.round(data.fail_time / 1000));
    }

    if (data.complete_time) {
        data.complete_time = squel.str('FROM_UNIXTIME(?)', Math.round(data.complete_time / 1000));
    }

    let query = squel.update()
        .table('competition_log')
        .setFields(data)
        .where('user_id = ?', user_id);

    return execQuery(query)
        .then((resp) => {
            return data;
        })
        .catch((err) => {
            console.log('competition:updateUser:', err);
        });
}

function deleteUser(user_id) {
    let query = squel.delete()
        .from('competition_log')
        .where('user_id = ?', user_id)
        ;

    return execQuery(query)
        .catch((err) => {
            console.log('competition:deleteUser:', err)
        });
}