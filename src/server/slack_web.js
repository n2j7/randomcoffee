import fs from 'fs';
import { WebClient } from '@slack/client';
import * as fetch from 'node-fetch';

let auth_tokens = null;
let bot_client = null;
let web_client = null;

function getBotAccessToken() {
    if (!auth_tokens) return '';
    if (!auth_tokens.bot) return '';
    if (!auth_tokens.bot.bot_access_token) return '';

    return auth_tokens.bot.bot_access_token;
}

function reinitBotClient() {
    bot_client = new WebClient(getBotAccessToken())
}

function reinitWebClient() {
    web_client = new WebClient(auth_tokens.access_token)
}

export function saveTokens(auth_data_file, data) {
    auth_tokens = data;
    reinitWebClient();
    fs.writeFile(
        auth_data_file,
        JSON.stringify(data),
        (err) => {
            if (err) {
                console.log('ERROR: saveTokens: ', err);
                return;
            }
            console.log('saveTokens: file was written!', auth_data_file);
        }
    );
}

export function getBotClient() {
    if (!bot_client) {
        reinitBotClient();
    }
    return bot_client;
}

export function getWebClient() {
    if (!web_client) {
        reinitWebClient();
    }
    return web_client;
}

export function loadTokens(auth_data_file) {
    if (!fs.existsSync(auth_data_file)) {
        return false;
    }
    const file_data = fs.readFileSync(auth_data_file, 'utf8');
    auth_tokens = JSON.parse(file_data);
    reinitWebClient();
    return true;
}

export function getBotUserId() {
    if (!auth_tokens) return '';
    if (!auth_tokens.bot) return '';
    if (!auth_tokens.bot.bot_user_id) return '';

    return auth_tokens.bot.bot_user_id;
}

// responce using response_url
// https://api.slack.com/messaging/interactivity/enabling#understanding_payloads
// NOTES about additional params
// EPHEMERAL RESPONSES => "response_type": "ephemeral"
// UPDATING THE SOURCE MESSAGE => "replace_original": "true",
// DELETING THE SOURCE MESSAGE => "delete_original": "true"
export function slackAsyncResponce(url, data) {
    return fetch(
        url,
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        }
    )
        .then(res => res.json())
        .then(json => console.log(json))
        .catch(err => console.log('ERROR: slackAsyncResponce error', err))
        ;
}