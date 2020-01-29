import { match } from './matcher';

test('no history pairing', () => {
    const member_list = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
    const history = {};
    const { pairs } = match(member_list, history);
    expect(pairs.length).toBe(3);
});

test('simple history', () => {
    const member_list = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
    const history = { 'u1': ['u2', 'u3', 'u4'] };
    const { pairs } = match(member_list, history);
    // console.log(pairs);
    expect(pairs.length).toBe(3);
});

test('lock', () => {
    const member_list = ['u1', 'u2', 'u3', 'u4'];
    const history = {
        'u1': ['u2', 'u3', 'u4'],
        'u2': ['u3', 'u4', 'u1'],
        'u3': ['u4', 'u1', 'u2'],
        'u4': ['u1', 'u2', 'u3'],
    };
    const { pairs, lost } = match(member_list, history);
    expect(pairs.length).toBe(0);
    expect(lost.length).toBe(4);
});

test('split one', () => {
    const member_list = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];
    const history = {
        'u1': ['u2', 'u3', 'u4', 'u5'],
    };
    const { pairs, lost } = match(member_list, history);
    // console.log('Result:', pairs, lost);
    expect(pairs.length).toBeGreaterThanOrEqual(2);
    if (pairs.length == 2) {
        expect(lost.length).toBe(2);
    }
});

test('do not create extra pair after splitting bug', () => {
    const member_list = ['u1', 'u2', 'u3', 'u4'];
    const history = {
        'u1': ['u2'],
        'u2': ['u1'],
        'u4': ['u3'],
        'u3': ['u4'],
    };
    const { pairs, lost } = match(member_list, history);
    //console.log('Result:', pairs, lost);
    expect(pairs.length).toBe(2);
});

test('correct history', () => {
    const member_list = ['u1', 'u2', 'u3', 'u4'];
    const history = {
        'u1': ['u2'],
        'u2': ['u1'],
        'u4': ['u3'],
        'u3': ['u4'],
    };
    const { pairs, lost } = match(member_list, history);
    const getPartnerFor = function (user_a) {
        const pair = pairs.find(([a, b]) => {
            return user_a == a || user_a == b;
        });
        return pair.find(u => u != user_a);
    }
    Object.keys(history).map((hu) => {
        const partner = getPartnerFor(hu);
        expect(history[hu]).not.toContain(partner);
    })
    expect(pairs.length).toBe(2);
});