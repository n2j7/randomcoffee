-- CREATE USER 'evorc'@'localhost' IDENTIFIED BY '12345';
-- GRANT ALL PRIVILEGES ON evorc.* TO 'evorc'@'localhost';
-- FLUSH PRIVILEGES;
CREATE TABLE `users` (
    `channel_id` varchar(20) NOT NULL,
    `user_id` varchar(20) NOT NULL,
    `name` varchar(250) NOT NULL,
    `cdate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `avail_date` TIMESTAMP NULL,
    `is_available` enum('Y','N') NOT NULL DEFAULT 'Y',
    `is_bot` enum('Y','N') NOT NULL DEFAULT 'N',
    `is_auto_ok` enum('Y','N') NOT NULL DEFAULT 'N',
    `story` varchar(250) NULL,
    PRIMARY KEY (`channel_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `history` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `channel_id` varchar(20) NOT NULL,
    `user_a_id` varchar(20) NOT NULL,
    `user_b_id` varchar(20) NOT NULL,
    `is_a_ok` enum('Y','N') NOT NULL DEFAULT 'N',
    `is_b_ok` enum('Y','N') NOT NULL DEFAULT 'N',
    `a_date` TIMESTAMP NULL,
    `b_date` TIMESTAMP NULL,
    `event_id` int(11) NOT NULL,
    `cdate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `extra` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `channel_id` varchar(20) NOT NULL,
    `user_id` varchar(20) NOT NULL,
    `cdate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `channels` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `channel_id` varchar(20) NOT NULL,
    `name` varchar(64) NOT NULL,
    `is_group` enum('Y','N') NULL,
    `schedule` varchar(64) NOT NULL,
    `extra_schedule` varchar(64) NOT NULL,
    `close_schedule` varchar(64) NOT NULL,
    `timezone` varchar(64) NOT NULL,
    `cdate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `admins` varchar(128) NULL,
    `stop_reason` varchar(512) NULL,
    `is_turned_off` enum('Y','N') NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `channel_idx` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `events` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `channel_id` varchar(20) NOT NULL,
    `upd_channel_id` varchar(20) NOT NULL DEFAULT '',
    `ts` varchar(20) NOT NULL DEFAULT '',
    `cdate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_closed` enum('Y','N') NOT NULL DEFAULT 'N',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `competition_log` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` varchar(20) NOT NULL,
    `user_name` varchar(100) NULL,
    `start_time` TIMESTAMP NULL,
    `fail_time` TIMESTAMP NULL,
    `complete_time` TIMESTAMP NULL,
    `questions` varchar(200) NULL, -- coma separated list of ids like "1,2,3,5,7"
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- alter table events change upd_channel_id `upd_channel_id` varchar(20) NOT NULL DEFAULT '';
-- alter table events change `ts` `ts` varchar(20) NOT NULL DEFAULT '';
-- alter table history add column  `a_date` TIMESTAMP NULL after is_b_ok;
-- alter table history add column  `b_date` TIMESTAMP NULL after a_date;
-- alter table history add column `is_closed` enum('Y','N') NOT NULL DEFAULT 'N' after event_id;
-- alter table events add column `is_closed` enum('Y','N') NOT NULL DEFAULT 'N' after cdate;
-- alter table history drop column `is_closed`;
-- alter table channels add column `admins` varchar(128) NULL after cdate;
-- alter table channels add column `close_schedule` varchar(64) NOT NULL after extra_schedule;
-- alter table channels add column `name` varchar(64) NOT NULL after channel_id;
-- alter table channels add column `is_group` enum('Y','N') NULL after name;
-- alter table users add column `is_auto_ok` enum('Y','N') NOT NULL DEFAULT 'N' after is_bot;
-- alter table users add column `avail_date` TIMESTAMP NULL after cdate;
-- alter table users add column `story` varchar(250) NULL after is_auto_ok;
-- alter table competition_log add column `user_name` varchar(100) NULL after user_id;
-- alter table channels add column `stop_reason` varchar(512) NULL after admins;
-- alter table channels add column `is_turned_off` enum('Y','N') NULL, after stop_reason;
