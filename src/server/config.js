import fs from 'fs';
import path from 'path';

let cfg;

export function getConfig() {
    if (cfg) {
        return cfg;
    }
    const cfg_file_path = path.resolve(process.env.APP_CFG);
    if (!fs.existsSync(cfg_file_path)) {
        console.log('ERROR: wrong config file!', err);
        return;
    }
    const file_data = fs.readFileSync(cfg_file_path, 'utf8');
    cfg = JSON.parse(file_data);
    return cfg;
}
