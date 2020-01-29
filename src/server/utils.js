export function dbDatetime(date_obj) {
	const days = date_obj.getDate();
	const days_pref = days < 10 ? '0' : '';
	const month = date_obj.getMonth() + 1;
	const month_pref = month < 10 ? '0' : '';
	const year = date_obj.getFullYear();

	const hours = date_obj.getHours();
	const hours_pref = hours < 10 ? '0' : '';
	const mins = date_obj.getMinutes();
	const mins_pref = mins < 10 ? '0' : '';
	const secs = date_obj.getSeconds();
	const secs_pref = secs < 10 ? '0' : '';
	return [
		year, '-',
		month_pref, month, '-',
		days_pref, days, ' ',
		hours_pref, hours, ':',
		mins_pref, mins, ':',
		secs_pref, secs
	].join('');
}