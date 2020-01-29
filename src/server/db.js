import mysql from 'mysql';

import { getConfig } from './config';

const CONFIG = getConfig();
let connection;
const EXIT_CODE_DB_ERROR = 2;

export const ORDER_DIRECTION = {
	ASC: true,
	DESC: false
}

export function connect() {
	try {
		connection = mysql.createPool({
			connectionLimit: 10,
			...CONFIG.db
		});

		connection.on('connection', (cn) => {
			console.log('@MYSQL: new connection ', cn.threadId);
		});

		connection.on('error', (err) => {
			console.log('@MYSQL ERROR:', err);
			if (err.fatal) {
				process.exit(EXIT_CODE_DB_ERROR);
			}
		});
	}
	catch (err) {
		console.log('!!!!! @MYSQL ERROR: DB Connection ERROR!!!', err);
		process.exit(EXIT_CODE_DB_ERROR);
	}
}

export function execQuery(query) {
	query = query.toParam()
	return new Promise((ff, rj) => {
		try {
			connection.query(
				query.text,
				query.values,
				(error, results, fields) => {
					if (error) rj(error);
					ff(results);
				}
			);
		}
		catch (err) {
			console.log('@MYSQL query execution ERROR! (in promisse reject)', query.text, err);
			rj(err);
		}
	}).catch((err) => {
		console.log('@MYSQL query execution ERROR (out promisse catch)!', query.text, err);
	});
}

export function execPlainQuery(query) {
	return new Promise((ff, rj) => {
		try {
			connection.query(
				query,
				(error, results, fields) => {
					if (error) rj(error);
					ff(results);
				}
			);
		} 
		catch (err) {
			console.log('@MYSQL query execution ERROR! (in promisse reject)', query, err);
			rj(err);
		}
	}).catch((err) => {
		console.log('@MYSQL query execution ERROR (out promisse catch)!', query, err);
	});
}

export function closeDB() {
	connection.end();
}
