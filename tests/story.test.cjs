const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/plugins/LastLiftStory.js');

function step(state, ...actions) {
    return actions.reduce((s, action) => {
        const before = JSON.stringify(s);
        const next = S.act(s, action);
        assert.notEqual(next, s, `Action was rejected: ${action} in ${s.node}`);
        assert.equal(JSON.stringify(s), before, 'Actions must not mutate earlier saves');
        assert.deepEqual(S.restore(JSON.parse(JSON.stringify(next))), next, 'Every produced state must survive reload');
        assert.ok(next.power >= 0 && next.power <= 8);
        assert.ok(S.load(next) <= S.capacity(next));
        return next;
    }, state);
}
function start(girl = true) { return step(S.fresh(), 'wake', 'listen', girl ? 'invite' : 'leave'); }
function travel(s, floor) {
    if (s.power === 0 && s.floor !== floor) s = step(s, 'cabin', 'maintenance', 'crank', 'cabin');
    return step(s, 'panel', 'travel:' + floor);
}
function home(girl = true) {
    let s = start(girl);
    s = step(travel(s, 7), 'takeMemory');
    s = step(travel(s, 13), 'water');
    s = step(travel(s, 0), 'share');
    return travel(s, 108);
}

test('prologue cannot be skipped through navigation or invalid actions', () => {
    const s = S.fresh();
    for (const action of ['panel', 'cabin', 'journal', 'travel:108', 'invite', 'endTogether']) {
        assert.equal(S.act(s, action), s);
    }
    assert.equal(start().girl, true);
    assert.equal(start(false).girl, false);
});

test('floors unlock through their story decisions, not arbitrary visits', () => {
    let s = step(start(), 'panel');
    for (const floor of [13, 0, 108, 99]) assert.equal(S.act(s, 'travel:' + floor), s);
    s = travel(s, 7);
    assert.equal(S.unlocked(s, S.floors[2]), false);
    s = step(s, 'takeKey');
    assert.equal(S.unlocked(s, S.floors[2]), true);
    assert.equal(S.unlocked(s, S.floors[3]), false);
});

test('each trip costs one charge; revisiting current floor is free', () => {
    let s = start();
    const power = s.power;
    s = travel(s, 1);
    assert.equal(s.power, power);
    s = travel(s, 7);
    assert.equal(s.power, power - 1);
    s = travel(s, 7);
    assert.equal(s.power, power - 1);
});

test('empty battery cannot softlock the journey; manual drive is renewable', () => {
    let s = start(false);
    while (s.power) s = travel(s, s.floor === 1 ? 7 : 1);
    s = step(s, 'panel');
    assert.equal(S.act(s, 'travel:' + (s.floor === 1 ? 7 : 1)), s);
    s = step(s, 'cabin', 'maintenance', 'crank');
    assert.equal(s.power, 2);
    for (let i = 0; i < 3; i++) s = step(s, 'cabin', 'maintenance', 'crank');
    assert.equal(s.power, 8);
    s = step(s, 'cabin', 'maintenance');
    assert.equal(S.act(s, 'crank'), s);
});

test('cargo limits matter; crafting frees the plate and adds two slots', () => {
    let s = step(travel(start(), 1), 'bench');
    s = step(travel(s, 7), 'takeKey');
    assert.equal(S.load(s), 4);
    s = travel(s, 13);
    assert.equal(S.act(s, 'water'), s);
    s = step(s, 'cabin', 'maintenance', 'repair');
    assert.equal(S.capacity(s), 6);
    assert.equal(s.scrap, 0);
    s = step(travel(s, 13), 'water');
    assert.equal(s.flower, true);
    assert.equal(S.load(s), 4);
});

test('unique rewards cannot be farmed and bureau choice is irreversible', () => {
    let s = step(travel(start(), 1), 'bench', 'floor');
    assert.equal(S.act(s, 'bench'), s);
    s = step(travel(s, 7), 'takeKey');
    assert.equal(S.act(s, 'takeMemory'), s);
    assert.equal(S.act(s, 'takeKey'), s);
    assert.equal(s.key, true);
    s = step(s, 'cabin', 'talk', 'promise', 'talk', 'promise');
    assert.equal(s.trust, 2);
});

test('a passenger left behind can still be picked up on floor one', () => {
    let s = start(false);
    s = step(travel(s, 7), 'cabin', 'visitGirl');
    assert.equal(s.node, 'panel');
    s = step(travel(s, 1), 'visitGirl', 'invite');
    assert.equal(s.girl, true);
});

test('all three endings are reachable and survive autosave reload', () => {
    for (const [action, ending] of [['endTogether', 'together'], ['endAlone', 'alone'], ['endKeeper', 'keeper']]) {
        const s = step(home(), action);
        assert.equal(s.ending, ending);
        assert.equal(s.node, 'ending');
        assert.ok(S.present(s).text.length > 100);
        assert.equal(S.act(s, 'panel'), s);
    }
});

test('solo path reaches the ending without inventing a passenger', () => {
    let s = home(false);
    assert.equal(S.act(s, 'endTogether'), s);
    s = step(s, 'endAlone');
    assert.equal(s.girl, false);
    assert.equal(s.ending, 'alone');
});

test('taking resources from garden has a different trust outcome', () => {
    let s = step(travel(start(), 7), 'takeMemory');
    s = travel(s, 13);
    const kind = step(s, 'water');
    const selfish = step(s, 'harvest');
    assert.ok(kind.trust > selfish.trust);
    assert.ok(selfish.power > kind.power);
    assert.equal(kind.flower, true);
    assert.equal(selfish.flower, false);
    assert.equal(S.act(selfish, 'water'), selfish);
});

test('invalid, future and malformed saves are rejected', () => {
    for (const raw of [null, {}, { ...S.fresh(), version: 99 },
        { ...S.fresh(), power: -1 }, { ...S.fresh(), power: 9 },
        { ...S.fresh(), floor: 999 }, { ...S.fresh(), node: 'missing' },
        { ...S.fresh(), girl: 'true' }, { ...S.fresh(), flags: null },
        { ...S.fresh(), node: 'ending', ending: null },
        { ...S.fresh(), ending: 'together' }, { ...S.fresh(), scrap: 12 }]) {
        assert.equal(S.restore(raw), null);
    }
});
