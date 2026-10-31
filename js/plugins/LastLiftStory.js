/*:
 * @plugindesc Last Lift — episode one story, rules and save schema.
 * @author DSgame
 * @help Pure story module. Load before LastLift. No engine files are replaced.
 */
(function(root, factory) {
    'use strict';
    var story = factory();
    if (typeof module === 'object' && module.exports) module.exports = story;
    else root.LastLiftStory = story;
})(typeof window !== 'undefined' ? window : this, function() {
    'use strict';
    var VERSION = 1;
    var FLOORS = [
        { id: 1, code: '01', title: 'Снег в подъезде', note: 'Кто-то ждёт за дверью', unlock: null },
        { id: 7, code: '07', title: 'Бюро забытых вещей', note: 'Здесь помнят твоё имя', unlock: null },
        { id: 13, code: '13', title: 'Сад тихих голосов', note: 'Растениям нужен свет', unlock: 'bureau' },
        { id: 0, code: '00', title: 'Встречный лифт', note: 'Кабина, похожая на нашу', unlock: 'garden' },
        { id: 108, code: '108', title: 'Кажется, дом', note: 'Ключ ещё тёплый', unlock: 'mirror' }
    ];
    var NODES = ['intro', 'hand', 'invitation', 'cabin', 'panel', 'journal',
        'maintenance', 'talk', 'cranked', 'repaired', 'bench', 'fuse', 'f1',
        'f7', 'f13', 'f0', 'f108', 'ending'];
    var FLAGS = ['bench', 'fuse', 'bureau', 'garden', 'mirror', 'promise', 'upgraded'];
    function fresh() {
        return { version: VERSION, node: 'intro', floor: 1, power: 5, scrap: 0,
            trust: 0, memory: 0, girl: false, key: false, flower: false,
            flags: {}, ending: null, log: [], trips: 0 };
    }
    function clone(s) { return JSON.parse(JSON.stringify(s)); }
    function capacity(s) { return s.flags.upgraded ? 6 : 4; }
    function load(s) { return (s.girl ? 2 : 0) + s.scrap + (s.key ? 1 : 0) + (s.flower ? 1 : 0); }
    function unlocked(s, floor) { return !floor.unlock || !!s.flags[floor.unlock]; }
    function restore(raw) {
        if (!raw || raw.version !== VERSION || NODES.indexOf(raw.node) < 0) return null;
        if (!FLOORS.some(function(f) { return f.id === raw.floor; })) return null;
        var s = fresh();
        for (var k of ['power', 'scrap', 'trust', 'memory', 'trips']) {
            if (!Number.isInteger(raw[k]) || raw[k] < 0 || raw[k] > (k === 'power' ? 8 : 9999)) return null;
            s[k] = raw[k];
        }
        for (var b of ['girl', 'key', 'flower']) {
            if (typeof raw[b] !== 'boolean') return null;
            s[b] = raw[b];
        }
        if (!raw.flags || typeof raw.flags !== 'object' || !Array.isArray(raw.log)) return null;
        FLAGS.forEach(function(f) { if (raw.flags[f] === true) s.flags[f] = true; });
        if (raw.ending !== null && ['together', 'alone', 'keeper'].indexOf(raw.ending) < 0) return null;
        if ((raw.node === 'ending') !== (raw.ending !== null)) return null;
        s.floor = raw.floor; s.node = raw.node; s.ending = raw.ending;
        s.log = raw.log.filter(function(t) { return typeof t === 'string'; }).map(function(t) { return t.slice(0, 240); }).slice(-24);
        if (load(s) > capacity(s)) return null;
        return s;
    }
    function choice(id, label, enabled, hint) {
        return { id: id, label: label, enabled: enabled !== false, hint: hint || '' };
    }
    function page(eyebrow, title, text, choices, art) {
        return { eyebrow: eyebrow, title: title, text: text, choices: choices, art: art };
    }
    function present(s) {
        var back = choice('cabin', 'Вернуться в кабину');
        switch (s.node) {
        case 'intro': return page('ЭПИЗОД ПЕРВЫЙ', 'Пассажир без этажа',
            'Ты приходишь в себя на полу лифта. Лампочка гудит. За дверями кто-то считает до ста восьми. На девяноста семи голос сбивается.',
            [choice('wake', 'Открыть глаза')], 'cabin');
        case 'hand': return page('ПОЧЕРК ЗНАКОМЫЙ', 'Записка на ладони',
            '«Ты живёшь на 108-м. Не верь себе после 40-го». Чернила свежие. Ты не помнишь ни своего имени, ни того, кто это написал.',
            [choice('listen', 'Послушать за дверью')], 'cabin');
        case 'invitation': return page('01 / СНЕГ В ПОДЪЕЗДЕ', 'Девочка с чемоданом',
            '«Я Мира. Мне туда, где меня ждут». Она показывает на пустое место над кнопками. Из чемодана раздаётся осторожный стук.',
            [choice('invite', 'Поедем вместе', load(s) + 2 <= capacity(s), 'Мира и чемодан: 2 места'),
             choice('leave', 'Я пока осмотрюсь')], 'snow');
        case 'cabin': return page('ТВОЙ МАЛЕНЬКИЙ ДОМ', 'Между этажами',
            s.girl ? 'Мира сидит на чемодане и греет ладони у лампы. «Он стучит, когда мы едем правильно». Под кнопкой 108 пока только царапина.' :
                'Кабина пахнет пылью и тёплой проводкой. Здесь безопасно. За дверями на первом этаже осталась девочка с чемоданом.',
            [choice('panel', 'Выбрать этаж', true, 'Каждая поездка: 1 заряд'),
             choice('maintenance', 'Осмотреть кабину'),
             choice(s.girl ? 'talk' : 'visitGirl', s.girl ? 'Поговорить с Мирой' : 'Вернуться к девочке')], 'cabin');
        case 'panel': return page('НЕ ВСЕ КНОПКИ БЫЛИ ЗДЕСЬ', 'Куда поедем?',
            'Поездка стоит 1 заряд. Вернуться в кабину можно бесплатно.', [], 'cabin');
        case 'maintenance': return page('ВЕЩИ, КОТОРЫЕ ДЕРЖАТ НАС', 'Сердце кабины',
            'Под сиденьем — ручной привод. Им можно зарядить лифт, если сядет батарея. Металлическая пластина превратит хрупкую полку в надёжную багажную сетку.',
            [choice('crank', 'Повернуть ручку · +2 заряда', s.power < 8, s.power >= 8 ? 'Батарея уже полна' : 'Можно пользоваться снова'),
             choice('repair', s.flags.upgraded ? 'Багажная сетка установлена' : 'Укрепить полку · +2 места', !s.flags.upgraded && s.scrap >= 1,
                s.flags.upgraded ? 'В кабине стало уютнее' : 'Нужна 1 металлическая пластина'), back], 'cabin');
        case 'talk': return page('МИРА', 'Что в чемодане?',
            s.flags.promise ? '«Когда страшно, я считаю остановки. А ты?» Мира придвигается ближе. Вы долго молчите. Впервые это не кажется неловким.' :
                '«Взрослые всё время говорят: подожди здесь. Потом двери закрываются». Мира смотрит не на тебя, а на кнопку вызова.',
            [choice('promise', s.flags.promise ? 'Посидеть рядом' : 'Я не оставлю тебя здесь'), back], 'cabin');
        case 'cranked': return page('РУКИ ПОМНЯТ', 'Свет вернулся',
            'Ручка поворачивается с тихим хрустом. На индикаторе прибавляются две полоски. Пока есть силы крутить её, лифт не станет ловушкой.', [back], 'cabin');
        case 'repaired': return page('СДЕЛАНО СВОИМИ РУКАМИ', 'Теперь это почти дом',
            'Пластина держит сетку над сиденьем. Ещё два места для важных вещей. На обратной стороне кто-то нацарапал: «Возвращайся».' +
                (s.girl ? ' Мира проверяет узел и одобрительно кивает.' : ''), [back], 'cabin');
        case 'f1': return page('01 / СНЕГ В ПОДЪЕЗДЕ', 'Зима внутри',
            'Снег падает из почтовых ящиков. Следы обрываются у лифта. На скамейке — пластина с письмом, в щитке ещё тлеет предохранитель.',
            [choice('bench', s.flags.bench ? 'Письмо уже у тебя' : 'Осмотреть скамейку', !s.flags.bench && load(s) < capacity(s), 'Пластина: 1 место'),
             choice('fuse', s.flags.fuse ? 'Щиток пуст' : 'Проверить щиток', !s.flags.fuse, '+2 заряда'),
             choice(s.girl ? 'cabin' : 'visitGirl', s.girl ? 'Вернуться в кабину' : 'Подойти к девочке')], 'snow');
        case 'bench': return page('ПИСЬМО БЕЗ АДРЕСА', '«Ты уже возвращался»',
            '«Если опять забудешь, начни с седьмого. Там хранят то, что мы потеряли». Подпись стёрлась. Ты забираешь письмо и металлическую пластину.',
            [choice('floor', 'Продолжить осмотр'), back], 'snow');
        case 'fuse': return page('ЕЩЁ ОДНА ПОПЫТКА', 'Искра в ладонях',
            'Старый предохранитель всё ещё годится. В кабине становится светлее. На панели загорается семёрка, похожая на перевёрнутый стул.',
            [back], 'snow');
        case 'f7': return page('07 / БЮРО ЗАБЫТЫХ ВЕЩЕЙ', 'Всё потерянное — здесь',
            s.flags.bureau ? 'Ячейка с твоим именем пуста. Смотрительница делает пометку в книге: «Выдано лично». На панели лифта проступает число 13.' :
                'Смотрительница открывает ячейку с твоим именем. Внутри ключ и кассета. «Вернуть можно только одно. Другое останется здесь навсегда».',
            s.flags.bureau ? [back] : [
                choice('takeKey', 'Забрать ключ от дома', load(s) < capacity(s), 'Займёт 1 место'),
                choice('takeMemory', 'Послушать кассету', true, '+2 воспоминания · без груза'), back], 'bureau');
        case 'f13': return page('13 / САД ТИХИХ ГОЛОСОВ', 'Здесь растёт свет',
            s.flags.garden ? (s.flower ? 'Сад снова дышит. Белый цветок тихо светится у тебя в ладони. Между листьями проступает дверь с двумя нулями.' :
                'Без лампы сад погрузился в полумрак. Только земля ещё хранит тепло. На панели появилась кнопка 00.') :
                'Лампа над единственным цветком вот-вот погаснет. Можно отдать саду немного энергии. Или забрать его аккумулятор себе.',
            s.flags.garden ? [back] : [
                choice('water', 'Оставить свет саду', s.power >= 1 && load(s) < capacity(s), s.power < 1 ? 'Нужен 1 заряд' : load(s) >= capacity(s) ? 'Нужно 1 свободное место' : '−1 заряд · цветок и доверие'),
                choice('harvest', 'Забрать аккумулятор', true, '+3 заряда · Мира это запомнит'), back], 'garden');
        case 'f0': return page('00 / ВСТРЕЧНЫЙ ЛИФТ', 'Ты по другую сторону',
            s.flags.mirror ? 'Другой лифт уходит без звука. На запотевшем зеркале остаётся: «Дом — это те, с кем ты вернёшься». Кнопка 108 наконец горит.' :
                'За дверями — такая же кабина. Ты стоишь в ней один, гораздо старше. «Я дошёл до дома. Только дома уже некому было открыть».',
            s.flags.mirror ? [back] : [
                choice('share', 'Рассказать ему о нашем пути', true, '+1 воспоминание' + (s.girl ? ' · +1 доверие' : '')),
                choice('trade', 'Попросить его батарею', true, '+3 заряда · −1 воспоминание'), back], 'mirror');
        case 'f108': return page('108 / КАЖЕТСЯ, ДОМ', 'За дверью кто-то есть',
            s.girl ? 'Дверь открывает человек с твоим лицом. «Наконец-то. Только чемодан оставь снаружи». Мира крепче сжимает твою руку.' :
                'Дверь открывает человек с твоим лицом. В квартире горит свет. За столом стоит ровно один стул. «Теперь ты можешь отдохнуть».',
            [choice('endTogether', 'Мы войдём только вместе', s.girl && s.trust >= 2, !s.girl ? 'Рядом должна быть Мира' : s.trust < 2 ? 'Сначала заслужи доверие Миры' : 'Держаться за руку'),
             choice('endAlone', 'Переступить порог одному'),
             choice('endKeeper', 'Закрыть двери. Ехать дальше.')], 'home');
        case 'journal': return page('НЕ ДАТЬ СЕБЕ ЗАБЫТЬ', 'Бортовой дневник',
            s.log.length ? s.log.slice(-5).reverse().join('\n\n') : 'На ладони написано: «Ты живёшь на 108-м». Пока это всё, что ты знаешь.', [back], 'cabin');
        case 'ending':
            var endings = {
                together: ['Дом на двоих', 'Вы не отпускаете рук. Квартира осыпается, словно старая краска. За ней — утро и открытая дверь. В чемодане лежит маленький макет лифта. Внутри горит свет.\n\n«Теперь он больше не один», — говорит Мира.'],
                alone: ['Тихая квартира', 'Ты садишься за стол. Чай ещё тёплый. Где-то за стеной едет лифт. Ты собираешься вспомнить, кого забыл, но звонок в дверь каждый раз обрывает мысль.\n\nНа ладони проступает: «Начни с седьмого».'],
                keeper: ['Смотритель', 'Ты нажимаешь «Закрыть». Здесь слишком много тех, кому ещё нужно домой. Кабина вздрагивает и едет вниз. На первом этаже уже кто-то ждёт.\n\n' + (s.girl ? 'Мира кладёт голову тебе на плечо. «Возьмём его?»' : 'Ты придерживаешь дверь. В этот раз — для другого.')]
            };
            var e = endings[s.ending];
            return page('КОНЕЦ ПЕРВОГО ЭПИЗОДА', e[0], e[1], [], s.ending === 'alone' ? 'home' : 'cabin');
        }
    }
    function addLog(s, text) { s.log.push(text); s.log = s.log.slice(-24); }
    function act(state, id) {
        var s = clone(state);
        var nav = ['cabin', 'panel', 'journal'];
        var early = ['intro', 'hand', 'invitation', 'ending'].indexOf(s.node) >= 0;
        var allowed = present(s).choices.some(function(c) { return c.id === id && c.enabled; });
        if (!early && nav.indexOf(id) >= 0) allowed = true;
        if (id.indexOf('travel:') === 0 && s.node === 'panel') {
            var floor = FLOORS.find(function(f) { return String(f.id) === id.split(':')[1]; });
            if (!floor || !unlocked(s, floor) || (s.floor !== floor.id && s.power < 1)) return state;
            if (s.floor !== floor.id) { s.power--; s.trips++; }
            s.floor = floor.id; s.node = 'f' + floor.id;
            return s;
        }
        if (!allowed) return state;
        if (nav.indexOf(id) >= 0) s.node = id;
        else switch (id) {
        case 'wake': s.node = 'hand'; break;
        case 'listen': s.node = 'invitation'; break;
        case 'invite': s.girl = true; s.trust++; s.node = 'cabin'; addLog(s, 'Мира едет с нами. В её чемодане кто-то стучит.'); break;
        case 'leave': s.node = 'cabin'; addLog(s, 'Девочка ждёт на первом этаже. Я ещё могу за ней вернуться.'); break;
        case 'visitGirl':
            if (s.floor !== 1) { s.node = 'panel'; break; }
            s.node = 'invitation'; break;
        case 'floor': s.node = 'f' + s.floor; break;
        case 'maintenance': s.node = 'maintenance'; break;
        case 'talk': s.node = 'talk'; break;
        case 'promise': if (!s.flags.promise) { s.flags.promise = true; s.trust++; addLog(s, 'Я обещал Мире, что не оставлю её за дверью.'); } s.node = 'cabin'; break;
        case 'crank': s.power = Math.min(8, s.power + 2); s.node = 'cranked'; break;
        case 'repair': s.scrap--; s.flags.upgraded = true; s.node = 'repaired'; addLog(s, 'В кабине теперь есть багажная сетка. Становится похоже на дом.'); break;
        case 'bench': s.flags.bench = true; s.scrap++; s.memory++; s.node = 'bench'; addLog(s, 'Письмо моим почерком: «Начни с седьмого. Ты уже возвращался».'); break;
        case 'fuse': s.flags.fuse = true; s.power = Math.min(8, s.power + 2); s.node = 'fuse'; break;
        case 'takeKey': s.key = true; s.flags.bureau = true; s.node = 'f7'; addLog(s, 'Я выбрал ключ. На бирке написано: «108». Кассета осталась в бюро.'); break;
        case 'takeMemory': s.memory += 2; s.flags.bureau = true; s.node = 'f7'; addLog(s, 'На кассете мой голос: «Не открывай чемодан. Он хранит нас, когда мы забываем друг друга».'); break;
        case 'water': s.power--; s.flower = true; s.memory++; if (s.girl) s.trust++; s.flags.garden = true; s.node = 'f13'; addLog(s, 'Мы оставили саду свет. Белый цветок будет светить нам в дороге.'); break;
        case 'harvest': s.power = Math.min(8, s.power + 3); s.trust = Math.max(0, s.trust - 1); s.flags.garden = true; s.node = 'f13'; addLog(s, 'Мы забрали батарею. Сад погас. Я всё ещё помню его запах.'); break;
        case 'share': s.memory++; if (s.girl) s.trust++; s.flags.mirror = true; s.node = 'f0'; addLog(s, 'Я встретил себя, который дошёл домой один. Он попросил не повторять его ошибку.'); break;
        case 'trade': s.power = Math.min(8, s.power + 3); s.memory = Math.max(0, s.memory - 1); s.flags.mirror = true; s.node = 'f0'; addLog(s, 'Моё отражение отдало батарею. По дороге я забыл, о чём мы говорили.'); break;
        case 'endTogether': s.ending = 'together'; s.node = 'ending'; break;
        case 'endAlone': s.ending = 'alone'; s.node = 'ending'; break;
        case 'endKeeper': s.ending = 'keeper'; s.node = 'ending'; break;
        }
        return s;
    }
    return { version: VERSION, floors: FLOORS, fresh: fresh, restore: restore,
        load: load, capacity: capacity, unlocked: unlocked, present: present, act: act };
});
