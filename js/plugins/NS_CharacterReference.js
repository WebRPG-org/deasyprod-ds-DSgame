
/*:
 * @plugindesc v1.0 NEON SLAUGHTER - Reference Style Characters
 * @author OpenAI
 *
 * @help
 * Новый пиксельный стиль персонажей.
 *
 * Главный герой:
 * Большая тёмная причёска, голубая повязка,
 * голубые глаза, усы, голый торс и трусы.
 *
 * Все враги используют похожие пропорции,
 * но отличаются внешностью.
 *
 * Подключать после NS_BomzhCharacters.
 * Внешние картинки не требуются.
 */

(function() {
    'use strict';

    var P = {
        outline: 0x202328,
        skin: 0xffb28c,
        skinLight: 0xffd1a8,
        skinShadow: 0xc97456,
        hair: 0x34363a,
        hairLight: 0x4e5053,
        band: 0x95d4dc,
        blue: 0x1ca6d9,
        eyeWhite: 0xf2ffff,
        beard: 0x6e3929,
        pants: 0x393535,
        red: 0xd85b4e
    };

    function pixel(g, x, y, w, h, color) {
        g.beginFill(color);
        g.drawRect(
            Math.round(x),
            Math.round(y),
            Math.round(w),
            Math.round(h)
        );
        g.endFill();
    }

    function part(g, x, y, w, h, color) {
        pixel(g, x - 1, y - 1, w + 2, h + 2, P.outline);
        pixel(g, x, y, w, h, color);
    }

    // ==========================================
    // НАСТРОЙКИ ПЕРСОНАЖЕЙ
    // ==========================================

    var STYLES = [
        // Главный герой
        {
            skin: 0xffb28c,
            hair: 0x34363a,
            hairLight: 0x505256,
            band: 0x98dce4,
            eyes: 0x159cd1,
            beard: 0x754029,
            pants: 0x393536,
            hairType: 0,
            body: 1,
            moustache: true
        },

        // Синяк
        {
            skin: 0xeaa17e,
            hair: 0x704a30,
            hairLight: 0x986b43,
            band: 0x7185c6,
            eyes: 0x4c8bc7,
            beard: 0x73432e,
            pants: 0x3d5e9c,
            hairType: 1,
            body: 1,
            moustache: true
        },

        // Опохмелятор
        {
            skin: 0xf2bd94,
            hair: 0xa34c25,
            hairLight: 0xd17a38,
            band: 0x79b768,
            eyes: 0x59974a,
            beard: 0xa34c25,
            pants: 0x526846,
            hairType: 2,
            body: 0.85,
            moustache: false
        },

        // Бутылкомёт
        {
            skin: 0xe4aa83,
            hair: 0x292a32,
            hairLight: 0x464853,
            band: 0x9e78bb,
            eyes: 0x57639c,
            beard: 0x382b2d,
            pants: 0x665077,
            hairType: 3,
            body: 1,
            moustache: true
        },

        // Батя с бидоном
        {
            skin: 0xd99b78,
            hair: 0x77716b,
            hairLight: 0xaaa49b,
            band: 0x9b4848,
            eyes: 0x6d8b8c,
            beard: 0x665349,
            pants: 0x554745,
            hairType: 4,
            body: 1.25,
            moustache: true
        }
    ];

    // ==========================================
    // ВОЛОСЫ
    // ==========================================

    function drawHair(g, x, y, s) {
        var dark = s.hair;
        var light = s.hairLight;

        if (s.hairType === 4) {
            // Батя: лысина и волосы по бокам
            pixel(g, x - 18, y - 17, 7, 19, dark);
            pixel(g, x + 11, y - 17, 7, 19, dark);
            pixel(g, x - 15, y - 20, 8, 6, light);
            pixel(g, x + 7, y - 20, 8, 6, light);
            return;
        }

        // Большая пиксельная причёска
        pixel(g, x - 15, y - 25, 30, 8, P.outline);
        pixel(g, x - 19, y - 21, 38, 14, P.outline);
        pixel(g, x - 20, y - 13, 40, 12, P.outline);

        pixel(g, x - 14, y - 27, 28, 7, dark);
        pixel(g, x - 18, y - 22, 36, 13, dark);
        pixel(g, x - 19, y - 12, 38, 10, dark);

        // Объём волос
        pixel(g, x - 13, y - 25, 17, 4, light);
        pixel(g, x - 17, y - 18, 8, 8, light);
        pixel(g, x + 10, y - 20, 6, 6, light);

        if (s.hairType === 1) {
            pixel(g, x - 21, y - 20, 7, 9, dark);
            pixel(g, x + 15, y - 17, 7, 10, dark);
        }

        if (s.hairType === 2) {
            pixel(g, x - 8, y - 31, 8, 9, dark);
            pixel(g, x + 7, y - 30, 8, 10, dark);
            pixel(g, x - 17, y - 26, 7, 9, light);
        }

        if (s.hairType === 3) {
            pixel(g, x - 18, y - 23, 36, 7, light);
            pixel(g, x - 20, y - 9, 8, 13, dark);
        }
    }

    // ==========================================
    // ЛИЦО
    // ==========================================

    function drawFace(g, x, y, s, angle) {
        // Уши
        part(g, x - 19, y - 7, 6, 12, s.skin);
        part(g, x + 13, y - 7, 6, 12, s.skin);

        // Форма лица
        pixel(g, x - 15, y - 17, 30, 25, P.outline);
        pixel(g, x - 12, y + 7, 24, 5, P.outline);

        pixel(g, x - 13, y - 16, 26, 23, s.skin);
        pixel(g, x - 10, y + 7, 20, 3, s.skin);

        // Светлая область лица
        pixel(g, x - 10, y - 14, 20, 7, P.skinLight);

        // Щёки
        pixel(g, x - 12, y + 1, 6, 4, P.skinShadow);
        pixel(g, x + 6, y + 1, 6, 4, P.skinShadow);

        // Направление взгляда
        var gazeX = Math.cos(angle) > 0.4 ? 1 :
                    Math.cos(angle) < -0.4 ? -1 : 0;

        // Белки глаз
        pixel(g, x - 10, y - 9, 8, 10, P.eyeWhite);
        pixel(g, x + 3, y - 9, 8, 10, P.eyeWhite);

        // Радужки
        pixel(g, x - 8 + gazeX, y - 6, 4, 7, s.eyes);
        pixel(g, x + 5 + gazeX, y - 6, 4, 7, s.eyes);

        // Зрачки
        pixel(g, x - 7 + gazeX, y - 5, 2, 4, P.outline);
        pixel(g, x + 6 + gazeX, y - 5, 2, 4, P.outline);

        // Блики
        pixel(g, x - 8 + gazeX, y - 6, 2, 2, P.eyeWhite);
        pixel(g, x + 5 + gazeX, y - 6, 2, 2, P.eyeWhite);

        // Брови
        pixel(g, x - 11, y - 12, 9, 3, s.hair);
        pixel(g, x + 2, y - 12, 9, 3, s.hair);

        // Нос
        pixel(g, x - 2, y - 2, 5, 6, P.skinShadow);
        pixel(g, x - 1, y - 2, 3, 4, s.skin);

        // Усы
        if (s.moustache) {
            pixel(g, x - 8, y + 4, 7, 3, s.beard);
            pixel(g, x + 1, y + 4, 7, 3, s.beard);
            pixel(g, x - 5, y + 7, 10, 2, s.beard);
        } else {
            pixel(g, x - 3, y + 6, 6, 2, P.beard);
        }

        // Небольшая бородка
        pixel(g, x - 5, y + 9, 10, 3, s.beard);

        // Волосы поверх головы
        drawHair(g, x, y, s);

        // Повязка
        if (s.hairType !== 4) {
            pixel(g, x - 14, y - 17, 28, 4, P.outline);
            pixel(g, x - 13, y - 16, 26, 2, s.band);

            // Свисающий конец сбоку
            pixel(g, x + 15, y - 13, 5, 14, s.band);
            pixel(g, x + 17, y - 1, 4, 5, s.band);
        }
    }

    // ==========================================
    // ТЕЛО
    // ==========================================

    function drawBody(g, x, y, s, walk) {
        var width = Math.round(21 * s.body);
        var offset = Math.sin(walk * 2) * 3;

        // Тень
        pixel(
            g,
            x - width / 2 - 2,
            y + 26,
            width + 5, 6,
            0x263a25
        );

        // Ноги
        part(g, x - 9, y + 19 + offset, 7, 10, s.skin);
        part(g, x + 2, y + 19 - offset, 7, 10, s.skin);

        // Ступни
        pixel(g, x - 10, y + 27 + offset, 9, 4, P.skinShadow);
        pixel(g, x + 2, y + 27 - offset, 9, 4, P.skinShadow);

        // Трусы
        part(
            g,
            x - width / 2,
            y + 12,
            width,
            10,
            s.pants
        );

        // Туловище
        part(
            g,
            x - width / 2,
            y - 5,
            width,
            19,
            s.skin
        );

        // Плечи
        part(g, x - width / 2 - 5, y - 5, 7, 9, s.skin);
        part(g, x + width / 2 - 2, y - 5, 7, 9, s.skin);

        // Руки
        part(g, x - width / 2 - 7, y + 3, 7, 12, s.skin);
        part(g, x + width / 2, y + 3, 7, 12, s.skin);

        // Кисти
        pixel(
            g,
            x - width / 2 - 7,
            y + 12,
            7, 5,
            P.skinShadow
        );

        pixel(
            g,
            x + width / 2,
            y + 12,
            7, 5,
            P.skinShadow
        );

        // Шея
        pixel(g, x - 5, y - 8, 10, 6, s.skin);

        // Детали торса
        pixel(g, x - 7, y + 4, 3, 3, P.skinShadow);
        pixel(g, x + 4, y + 4, 3, 3, P.skinShadow);

        pixel(g, x - 1, y + 10, 2, 3, P.skinShadow);
    }

    // ==========================================
    // ОРУЖИЕ
    // ==========================================

    function drawWeapon(g, x, y, angle, weaponId, kick) {
        var dx = Math.cos(angle);
        var dy = Math.sin(angle);

        var length = [17, 21, 19, 25, 23][weaponId] || 17;

        var x1 = x + dx * 13;
        var y1 = y + dy * 13;

        var x2 = x + dx * (length + 13 - kick);
        var y2 = y + dy * (length + 13 - kick);

        // Тёмная обводка оружия
        g.lineStyle(7, P.outline);
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);

        // Металлический ствол
        g.lineStyle(4, 0x8b9298);
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);

        if (weaponId === 4) {
            g.lineStyle(2, 0x32e6ef);
            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
        }
    }

    // ==========================================
    // ОТРИСОВКА ПЕРСОНАЖА
    // ==========================================

    function drawCharacter(g, entity, isPlayer, scene) {
        var styleIndex = isPlayer
            ? 0
            : Math.min(4, (entity.type || 0) + 1);

        var s = STYLES[styleIndex];

        var x = Math.round(entity.x);
        var y = Math.round(entity.y);

        // Поднимаем голову относительно тела
        // для характерных чиби-пропорций.
        drawBody(
            g, x, y + 2,
            s,
            entity.walk || 0
        );

        drawFace(
            g, x, y - 11,
            s,
            entity.angle || 0
        );

        if (isPlayer) {
            drawWeapon(
                g,
                x + 11,
                y + 5,
                entity.angle || 0,
                scene.player.weapon,
                scene.player.kick || 0
            );
        } else {
            // Бутылка у противника
            var a = entity.angle || 0;

            g.lineStyle(6, 0x265d42);
            g.moveTo(x + 11, y + 8);
            g.lineTo(
                x + 11 + Math.cos(a) * 12,
                y + 8 + Math.sin(a) * 12
            );

            g.lineStyle(3, 0xa5cfb0);
            g.moveTo(
                x + 11 + Math.cos(a) * 12,
                y + 8 + Math.sin(a) * 12
            );
            g.lineTo(
                x + 11 + Math.cos(a) * 17,
                y + 8 + Math.sin(a) * 17
            );
        }

        // Вспышка повреждения
        var hit = isPlayer
            ? entity.inv > 0 &&
              Math.floor(entity.inv / 4) % 2 === 0
            : entity.hit > 0;

        if (hit) {
            g.beginFill(0xffffff, 0.18);
            g.drawRect(x - 20, y - 40, 40, 72);
            g.endFill();
        }
    }

    // ==========================================
    // УСТАНОВКА
    // ==========================================

    function install(scene) {
        if (scene._referenceCharactersInstalled) return;

        if (!scene.drawCharacter ||
            !scene.player ||
            !scene.graphics) {
            return;
        }

        scene._referenceCharactersInstalled = true;

        scene.drawCharacter = function(g, entity, isPlayer) {
            drawCharacter(g, entity, isPlayer, this);
        };
    }

    var _baseUpdate = Scene_Base.prototype.update;

    Scene_Base.prototype.update = function() {
        _baseUpdate.call(this);

        if (this.constructor &&
            this.constructor.name === 'Scene_NeonSlaughter') {
            install(this);
        }
    };

})();
