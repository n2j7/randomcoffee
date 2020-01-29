import shuffle from 'shuffle-array';

function getRandListItem(list) {
    // floor will guarantee that MAX val will never generated
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
}

function remove(list, item) {
    return list.filter(i => i != item);
}

function excludeHistory(list, history) {
    if (!history || !history.length) {
        return list;
    }
    return list.filter((u) => {
        return history.indexOf(u) === -1;
    });
}

function getPairForSplit(pairs_list, history) {
    if (!history || !history.length) {
        return pairs_list[0];
    }
    return pairs_list.find(([ua, ub]) => {
        return history.indexOf(ua) === -1
            || history.indexOf(ub) === -1;
    });
}

export function match(members, history) {
    let pairs_result = [];
    let lost_users = [];
    // shuffle user list
    let rnd_members = shuffle(members);
    // get max pairs count
    const max_pairs_cnt = Math.floor(rnd_members.length / 2);
    while (rnd_members.length) {
        // get random user
        const user_a_id = getRandListItem(rnd_members);
        // console.log('Get user', user_a_id);
        // remove user from list
        rnd_members = remove(rnd_members, user_a_id);
        // console.log('Now user list are', rnd_members);
        // exclude history for user
        // console.log('User history are', history[user_a_id]);
        const avail_users = excludeHistory(rnd_members, history[user_a_id]);
        // console.log('Available users for user are', avail_users);
        if (!avail_users.length) {
            // add him to lost users
            lost_users.push(user_a_id);
            continue;
        }
        // get random one
        const user_b_id = getRandListItem(avail_users);
        // remove user_b from rnd_members list
        rnd_members = remove(rnd_members, user_b_id);
        // add pair to result
        pairs_result.push([user_a_id, user_b_id]);
    }
    // match lost users
    let finally_lost = []
    // due to last user can just split another pair
    if (lost_users.length > 1) {
        console.log('lost users', lost_users, 'pairs', pairs_result);
        let max_split_pairs_cnt = Math.floor(max_pairs_cnt / 3);
        while (lost_users.length > 1 && max_split_pairs_cnt--) {
            // get user from lost users
            const lost_user = lost_users.pop();
            console.log('######## LOST user:', lost_user);
            // shuffle pairs
            pairs_result = shuffle(pairs_result, history[lost_user]);
            // get pair for split
            const split_pair_users_list = getPairForSplit(
                pairs_result,
                history[lost_user]
            );
            if (!split_pair_users_list) {
                // can't find pair for new match after split
                finally_lost.push(lost_user);
                console.log('No one pair for split! finally lost:', lost_user);
                continue;
            }
            console.log('SPLIT pair:', split_pair_users_list);
            // remove split pair from pairs list!
            pairs_result = pairs_result.filter(([a, b]) => {
                return a != split_pair_users_list[0] && b != split_pair_users_list[1];
            });

            // get list of paired users(one or both) which is not in lost_user history
            const candidates = excludeHistory(
                split_pair_users_list,
                history[lost_user]
            );
            console.log('candidates:', candidates);
            // make new pair, at least one user should exists!
            const companion = candidates.pop();
            pairs_result.push([lost_user, companion]);
            console.log('new pair:', [lost_user, companion]);

            // try to make fast pairing with second pair user
            const second_pair_user = split_pair_users_list.find(u => u != companion);
            console.log('second in splitted pair:', second_pair_user);
            // get next lost user
            const next_lost_user = lost_users.pop();
            console.log('next in lost list users:', next_lost_user, history[next_lost_user]);
            // console.log('Next lost user', next_lost_user);
            if (!next_lost_user) {
                // list may be empty so in this case move last user into finally_lost
                finally_lost.push(second_pair_user);
                console.log('Have no more lost users! finally lost:', second_pair_user);
                continue;
            }

            // chech that second_pair_user not in next_lost_user history
            const next_candidates = excludeHistory(
                [second_pair_user],
                history[next_lost_user]
            );
            console.log('candidates for next lost user:', next_candidates);

            if (!next_candidates.length) {
                // no luck :(
                lost_users.push(next_lost_user);
                lost_users.push(second_pair_user);
                console.log('Can\'t pair! move both to lost_users:', second_pair_user, next_lost_user);
                continue;
            }

            // we have one more pair matched!!!
            pairs_result.push([next_lost_user, second_pair_user]);
            console.log('new pair:', [next_lost_user, second_pair_user]);
            console.log('^^^^^^^^ loop step', lost_users.length, max_split_pairs_cnt);
        }
        // after match we may have one(or zero) user into lost_users
        if (lost_users.length) {
            lost_users.map(lu => finally_lost.push(lu));
        }
        if (max_split_pairs_cnt == 0) {
            console.log('WARNING: max pairs splitting reached')
        }
    }
    else {
        // we have 0 or 1 user
        finally_lost = lost_users;
    }

    return { pairs: pairs_result, lost: finally_lost };
}