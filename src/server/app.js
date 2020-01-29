import bodyParser from 'body-parser';
import express from 'express';
import readFile from 'fs-readfile-promise';
import path from 'path';
import { WebClient } from '@slack/client';

import { getConfig } from './config';
import * as db from "./db";
import { processCommand, processAction, processEvent, createReport } from './commands';
import { saveTokens, loadTokens } from './slack_web';

import { initScheduleOnStartup } from './schedule';

const CONFIG = getConfig();
db.connect();
const is_auth_exist = loadTokens(CONFIG.auth_file);

const app = express();
app.use(bodyParser.json());     // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.get('/', (req, res) => {
    res.send('Nothing here! ¯\\_(ツ)_/¯');
});

app.get('/install_btn', (req, res) => {
    if (is_auth_exist) {
        res.status(200).send('Remove previous auth first!');
        return;
    }
    const pathToHtml = path.join(__dirname, './views/install.html');
    readFile(pathToHtml)
        .then(b => b.toString())
        .then((template) => {
            const page = template.replace('{scopes}', CONFIG.scopes.join(','))
                .replace('{client_id}', CONFIG.client_id)
                .replace('{domain}', CONFIG.app_domain_url)
                ;
            res.status(200).send(page);
        })
        .catch((err) => {
            res.status(404).send('No template')
        })
        ;
});

app.get('/oauth', (req, res) => {
    console.log(
        new Date().toLocaleString(),
        '--------------------------'
    );
    if (is_auth_exist) {
        console.log('WARNING: OAuth Request with existed auth file!');
        res.status(200).send('Remove previous auth first!');
        return;
    }
    console.log('OAuth code', req.query.code);
    new WebClient().oauth.access(
        CONFIG.client_id,
        CONFIG.client_secret,
        req.query.code,
        {} // options
    )
        .then((access_data) => {
            //oauth complete
            console.log('Oauth:', access_data);
            if (!access_data.ok) {
                throw access_data.error || "No ok response!";
            }
            saveTokens(CONFIG.auth_file, access_data);
            res.send('Authorization complete!<br> <a href="/">Go home</a>');
        })
        .catch((err) => {
            console.error('Token request error!', err);
            res.status(500).send('Authorization ERROR! See console for more info!<br> <a href="/">Go home</a>');
        })
        ;
});

app.all('/command', processCommand);
app.all('/action', processAction);
app.all('/event', processEvent);
app.all('/report', createReport);

process.env.NODE_ENV == 'dev' && app.get('/dev', (req, res) => {
    // only for test something! remove all code before PUSH!!!
    console.log('DEV', req.body);
    res.send('This is dev YEAH!!!');
});

app.listen(process.env.APP_PORT, () => {
    const { APP_PORT, APP_HOST, APP_DEV_PORT, NODE_ENV } = process.env;
    const host_str = NODE_ENV != 'dev'
        ? `${APP_HOST}:${APP_PORT}`
        : `${APP_HOST}:${APP_DEV_PORT}`
        ;
    console.log(`RandomCoffee app listening on ${host_str}!`);
    initScheduleOnStartup();
});
