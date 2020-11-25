import { getConfig } from './config';
import * as adm_cmd from './adminCommands';
import * as usr_cmd from './userCommands';
import {
    isAdmin,
    startReport,
    reportFillYA,
    reportFillYB,
    clearReport,
    reportFillN,
    reportFillPA,
    reportFillPB,
    getReportData,
    reportDataRemoveDoublicates,
    reportDataRemoveLateAnswers,
    getAutoOk
} from './userModel';
import { isChannelRegistered } from './schedule';
import { getBotClient, slackAsyncResponce, getAllChannelMembers } from './slack_web';
import { getChannelsList } from './channelModel';
import {
    competitionIntro,
    competitionRegistration,
    getQuestion,
    getPrize,
    onWrongAnswer,
    writeMeBack,
    unregsterUser,
    onFinishUserButtonPressed,
    onFinishWhatIfPressed,
    baristaClick,
    competitionInvite
} from './competition';

const CONFIG = getConfig();

export async function processCommand(req, res) {
    console.log(
        new Date().toLocaleString(),
        '--------------------------'
    );
    console.log('Income command', req.body);
    // check token
    if (req.body.token != CONFIG.verification_token) {
        res.status(500).send("No chance to hack!");
        return;
    }

    const is_admin = await isAdmin(req.body.user_id, req.body.channel_id);

    // @TODO: check X-Slack-Signature header
    // https://api.slack.com/docs/verifying-requests-from-slack

    let fast_response;
    if (req.body.text == 'a' && is_admin) {
        fast_response = adm_cmd.adminInterface({
            channel_id: req.body.channel_id,
        });
    }
    else if (req.body.text == 'dev' && is_admin) {
        res.set('X-Accel-Redirect', '/dev');
        res.send('');
        return;
    }
    else if (req.body.text == 'help') {
        fast_response = usr_cmd.helpMessage({
            channel_id: req.body.channel_id,
            user_id: req.body.user_id,
        });
    }
    else if (req.body.text == 'story') {
        if (!isChannelRegistered(req.body.channel_id)) {
            fast_response = await usr_cmd.wrongChannelUsed({
                user_id: req.body.user_id,
            });
        }
        else {
            fast_response = await usr_cmd.manageUserStory({
                channel_id: req.body.channel_id,
                user_id: req.body.user_id,
            });
        }
    }
    else if (req.body.text == 'hb') {
        competitionIntro({
            channel_id: req.body.channel_id,
            user_id: req.body.user_id,
        });
    }
    else if (req.body.text == 'hbinit') {
        competitionInvite({
            channel_id: req.body.channel_id,
            user_id: req.body.user_id,
        });
    }
    else {
        if (!isChannelRegistered(req.body.channel_id)) {
            fast_response = await usr_cmd.wrongChannelUsed({
                user_id: req.body.user_id,
            });
        }
        else {
            fast_response = usr_cmd.userInterface({
                channel_id: req.body.channel_id,
                user_id: req.body.user_id,
            });
        }
    }
    //res.send(fast_response);
    structResponse(res, fast_response);
}

export async function processAction(req, res) {
    console.log(
        new Date().toLocaleString(),
        '--------------------------'
    );
    console.log('Income action', req.body);
    const payload = JSON.parse(req.body.payload);
    console.log('Action payload:', payload);
    const { token, callback_id, channel, user, actions } = payload;

    // check token
    if (token != CONFIG.verification_token) {
        res.status(500).send("No chance to hack!");
        return;
    }

    const is_admin = await isAdmin(user.id, channel.id);

    // @TODO: check X-Slack-Signature header
    // https://api.slack.com/docs/verifying-requests-from-slack

    if (callback_id == 'admin_form' && is_admin && actions.length) {
        const last_action = actions.pop();
        if (last_action.name == 'run' && last_action.value == 'light') {
            adm_cmd.randomLightMatch({
                channel_id: channel.id,
                user_id: user.id
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'close' && last_action.value == 'light') {
            adm_cmd.closeLightEvent({
                channel_id: channel.id,
                user_id: user.id
            });
        }
        else if (last_action.name == 'history' && last_action.value == 'dialog') {
            adm_cmd.openHistoryParseDialog(payload.trigger_id);
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'extra' && last_action.value == 'light') {
            adm_cmd.extraLightMatch({
                channel_id: channel.id,
                test_run: false,
                user_id: user.id
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'schedule' && last_action.value == 'view') {
            adm_cmd.scheduleView({
                channel_id: channel.id,
                user_id: user.id,
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'schedule' && last_action.value == 'edit') {
            adm_cmd.openScheduleDialog({
                channel_id: channel.id,
                trigger_id: payload.trigger_id,
            });
            structResponse(res, ''); // return empty string for prevent message deleting
            return;
        }
        else if (last_action.name == 'settings' && last_action.value == 'show') {
            const a = adm_cmd.adminSettingsInterface();
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'admins' && last_action.value == 'view') {
            await adm_cmd.displayAdmins({
                channel_id: channel.id,
                user_id: user.id,
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'add_admin') {
            adm_cmd.showAdminSelectDialog({
                channel_id: channel.id,
                trigger_id: payload.trigger_id,
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'rm_admin') {
            adm_cmd.removeAdmin({
                channel_id: channel.id,
                user_id: user.id,
                target: last_action.value,
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'pause_list') {
            const a = await adm_cmd.showUsersOnLongPause({
                channel_id: channel.id,
            });
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'ask_long_pause_users') {
            const a = await adm_cmd.notifyLongPauseUsears({
                channel_id: channel.id,
            });
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'stop' && last_action.value == 'dialog') {
            await adm_cmd.showStopDialog(payload.trigger_id, channel.id);
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'init' && last_action.value == 'action') {
            await adm_cmd.initChannelInDb({
                channel_id: channel.id,
                user_id: user.id,
            });
            // return nothing -> go to default response with deleting original message
        }
    }

    if (callback_id == 'user_form') {
        const last_action = actions.pop();
        if (last_action.name == 'set_avail') {
            const a = usr_cmd.updateAvailability({
                channel_id: channel.id,
                user_id: user.id,
                value: last_action.value,
            });
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'my_history') {
            usr_cmd.getUserHistory({
                user_id: user.id,
                channel_id: channel.id,
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'user_ready_light') {
            const a = usr_cmd.handleUserReadyLight({
                user_id: user.id,
                data: last_action.value,
                msg: payload.original_message,
            });
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'user_not_ready_light') {
            const a = usr_cmd.handleUserNotReadyLight({
                user_id: user.id,
                data: last_action.value,
                msg: payload.original_message,
            });
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'user_leave') {
            const a = usr_cmd.handleUserLeaveFeedback({
                user_id: user.id,
                answer: last_action.value,
                msg: payload.original_message,
            });
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'autook') {
            const a = await usr_cmd.onAutoOkChanged({
                user_id: user.id,
                channel_id: channel.id,
                answer: last_action.value,
            });
            structResponse(res, a);
            return;
        }
        else if (last_action.name == 'set_avail_long') {
            usr_cmd.updateLongAvailability({
                user_id: user.id,
                channel_id: channel.id,
                answer: last_action.value,
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'story' && last_action.value == 'write') {
            usr_cmd.editUserStory({
                user_id: user.id,
                channel_id: channel.id,
                trigger_id: payload.trigger_id
            });
            // return nothing -> go to default response with deleting original message
        }
        else if (last_action.name == 'story' && last_action.value == 'show') {
            usr_cmd.showUserStory({
                user_id: user.id,
                channel_id: channel.id,
            });
            // return nothing -> go to default response with deleting original message
        }
    }

    if (
        callback_id == 'dialog-history'
        && payload.type == "dialog_submission"
        && is_admin
    ) {
        const a = adm_cmd.onHistoryParseContentCome(payload);
        structResponse(res, a);
        return;
    }

    if (
        callback_id == 'dialog-schedule'
        && payload.type == "dialog_submission"
        && is_admin
    ) {
        const a = adm_cmd.onScheduleEdit(payload);
        structResponse(res, a);
        return;
    }

    if (
        callback_id == 'dialog-add-admin'
        && payload.type == "dialog_submission"
        && is_admin
    ) {
        const a = adm_cmd.onAdminAdd(payload);
        structResponse(res, a);
        return;
    }

    if (
        callback_id == 'dialog-story'
        && payload.type == "dialog_submission"
    ) {
        const a = usr_cmd.onSaveUserStory(payload);
        structResponse(res, a);
        return;
    }

    if (
        callback_id == 'dialog-stop'
        && payload.type == "dialog_submission"
    ) {
        const a = adm_cmd.onStopReasonCome(payload);
        structResponse(res, a);
        return;
    }

    if (payload.type == "block_actions") {
        const last_action = actions.pop();

        if (last_action.block_id == 'competition_intro' && last_action.action_id == 'btn_start') {
            // start competition!
            await competitionRegistration({
                user_id: user.id,
                user_name: user.name,
                channel_id: channel.id
            });
            slackAsyncResponce(
                payload.response_url,
                { delete_original: "true" }
            );
        }
        else if (last_action.block_id == 'competition_intro' && last_action.action_id == 'btn_lost') {
            writeMeBack({ user_id: user.id });
        }
        else if (last_action.block_id == 'competition_hellow' && last_action.action_id == 'btn_wtf') {
            competitionIntro({
                user_id: user.id,
                channel_id: channel.id
            });
        }
        else if (last_action.block_id == 'competition_run' && last_action.action_id == 'get_question') {
            const correctly_closed = await getQuestion({ user_id: user.id });
            if (!correctly_closed) {
                onWrongAnswer({
                    user_id: user.id,
                    payload,
                    action: last_action // due to we pop that action from payload
                });
            }
            else {
                slackAsyncResponce(
                    payload.response_url,
                    { delete_original: "true" }
                );
            }
        }
        else if (last_action.block_id == 'competition_run' && last_action.action_id == 'get_prize') {
            await getPrize({ user_id: user.id });
            slackAsyncResponce(
                payload.response_url,
                { delete_original: "true" }
            );
        }
        else if (last_action.block_id == 'competition_run' && last_action.action_id == 'btn_later') {
            // unregister
            await unregsterUser({ user_id: user.id });
            slackAsyncResponce(
                payload.response_url,
                { delete_original: "true" }
            );
        }
        else if (last_action.block_id == 'competition_run') {
            // wrong answer
            await onWrongAnswer({
                user_id: user.id,
                payload,
                action: last_action // due to we pop that action from payload
            });
        }
        else if (last_action.block_id == 'competition_complete') {
            if (last_action.action_id == 'barista') {
                baristaClick({ user_id: user.id });
                slackAsyncResponce(
                    payload.response_url,
                    { delete_original: "true" }
                );
            }
            else if (last_action.action_id == 'for_user') {
                await onFinishUserButtonPressed({
                    user_id: user.id,
                    payload,
                    action: last_action // due to we pop that action from payload
                });
            }
            else if (last_action.action_id == 'what_if') {
                onFinishWhatIfPressed({
                    user_id: user.id,
                    payload,
                    action: last_action // due to we pop that action from payload
                });
            }
        }
        else {
            console.log('Remove original msg!');
            slackAsyncResponce(
                payload.response_url,
                { delete_original: "true" }
            );
        }
    }

    structResponse(
        res,
        {
            fallback: "RandomCoffee Action",
            text: null,
            delete_original: true
        }
    )
}

export function processEvent(req, res) {
    console.log(
        new Date().toLocaleString(),
        '--------------------------'
    );
    const { type, token, challenge, event } = req.body;
    if (event) {
        console.log('Income event', event.type, event.subtype);
    }
    else {
        console.log('Income FAST event', type);
    }


    // check token
    if (token != CONFIG.verification_token) {
        res.status(500).send("No chance to hack!");
        return;
    }

    // @TODO: check X-Slack-Signature header
    // https://api.slack.com/docs/verifying-requests-from-slack

    if (type == 'url_verification') {
        res.status(200).send(challenge);
        return;
    }
    else if (type == 'app_rate_limited') {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!!!!!!!!! RATE LIMIT FOR EVENTS !!!!!!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log(req.body);
    }
    else if (type == 'member_joined_channel') {
        usr_cmd.sendUserHellowMessage(
            req.body.user,
            req.body.channel
        );
    }
    else if (type == 'member_left_channel') {
        usr_cmd.sendUserOutMessage(
            req.body.user,
            req.body.channel
        );
    }
    else if (type == 'event_callback') {
        /*if (event.type == 'message') {
            // channel_type: [app_home, channel, group, im]
            if (event.channel_type == 'im' && !event.bot_id) {
                usr_cmd.sendBotNoSoSmart(event.channel);
            }
        }
        else*/ if (event.type == 'member_left_channel') {
            usr_cmd.sendUserOutMessage(
                event.user,
                event.channel
            );
        }
        else if (event.type == 'member_joined_channel') {
            usr_cmd.sendUserHellowMessage(
                event.user,
                event.channel
            );
        }
    }

    structResponse(
        res,
        { ok: true }
    )
}

export async function createReport(req, res) {
    console.log(
        new Date().toLocaleString(),
        '--------------------------',
        'REPORT REQUIRED'
    );

    const web = getBotClient();
    let users = await web.users.list({})
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
                        name: user.name,
                        real_name: user.real_name,
                    };
                    return acc;
                },
                {}
            )
        })
        .catch((err) => { console.log('Slack USERS.LIST', err); })
        ;
    console.log('Users received', Object.keys(users).length);

    await startReport();
    await reportDataRemoveDoublicates();
    await reportDataRemoveLateAnswers();

    let channels = await getChannelsList();
    for (let i = 0, l = channels.length; i < l; i++) {
        let channel = channels[i];
        const members = await getAllChannelMembers(channel.channel_id);

        if (!members) {
            console.log('Group with empty members!', channel.name, channel.id);
            continue;
        }
        // now we have channel members

        let autook_users = await getAutoOk(channel.channel_id);

        await clearReport();
        // return;

        await reportFillYA(channel.channel_id);
        await reportFillYB(channel.channel_id);
        await reportFillN(channel.channel_id);
        await reportFillPA(channel.channel_id);
        await reportFillPB(channel.channel_id);
        let report = await getReportData();

        report.map((r) => {
            let is_member = members.indexOf(r.user_id) !== -1;
            let is_autook = autook_users.indexOf(r.user_id) !== -1;

            let l = [
                channel.channel_id,
                channel.name,
                r.user_id,
                users[r.user_id] ? users[r.user_id].name : '???',
                r.y_cnt,
                r.n_cnt,
                r.p_cnt,
                is_member ? 'Y' : 'N',
                is_autook ? 'Y' : 'N'
            ];

            res.write(`${l.join("\t")}\n`);
        });
    };

    res.end();
    return;
}

function structResponse(res, data) {
    if (data == '') {
        res.status(200).send('');// message will be sent async but we need some response
        return;
    }
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(data));
}
