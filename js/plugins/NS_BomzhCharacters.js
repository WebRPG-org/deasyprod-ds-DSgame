
/*:
 * @plugindesc v1.0 NEON SLAUGHTER - BOMZH CHARACTERS
 * @author OpenAI
 *
 * @help
 * Заменяет внешний вид игрока и противников.
 *
 * Главный герой: БОМЖАРА
 *
 * Враги:
 * 0 - Синяк
 * 1 - Опохмелятор
 * 2 - Бутылкомёт
 * 3 - Батя с бидоном
 *
 * Все персонажи рисуются через PIXI.Graphics.
 *
 * Подключать после:
 * NeonSlaughter
 * NS_WorldExpansion
 *
 * Не требует изображений.
 */

(function() {
    'use strict';

    var COLORS = {
        skin: 0xd5a078,
        pale: 0xb98c72,
        nose: 0xed5763,
        beard: 0x594535,
        dark: 0x15151a,
        black: 0x08090d,
        white: 0xe2e5dc,
        green: 0x476348,
        greenDark: 0x283d31,
        blue: 0x33599a,
        orange: 0xd67c35,
        yellow: 0xe0bd50,
        red: 0x9d3343,
        brown: 0x644b38,
        metal: 0x89949a,
        glass: 0x47956a
    };

    function box(g, x, y, w, h, color) {
        g.beginFill(color);
        g.drawRect(
            Math.round(x),
            Math.round(y),
            Math.round(w),
            Math.round(h)
        );
        g.endFill();
    }

    function stroke(g, x1, y1, x2, y2, color, width) {
        g.lineStyle(width || 3, color);
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
    }

    function pixelHead(g, x, y, options) {
        var skin = options.skin || COLORS.skin;

        // Уши
        box(g, x - 9, y - 3, 4, 7, skin);
        box(g, x + 5, y - 3, 4, 7, skin);

        // Лицо
        box(g, x - 7, y - 8, 14, 16, skin);

        // Глаза
        box(g, x - 5, y - 2, 3, 2, COLORS.dark);
        box(g, x + 2, y - 2, 3, 2, COLORS.dark);

        // Нос
        box(g, x - 2, y + 1, 4, 4, COLORS.nose);

        if (options.beard) {
            box(g, x - 6, y + 5, 12, 6, options.beard);
            box(g, x - 4, y + 10, 8, 3, options.beard);
            box(g, x - 2, y + 7, 4, 2, COLORS.dark);
        } else {
            box(g, x - 3, y + 6, 6, 2, COLORS.brown);
        }

        if (options.hat === 'beanie') {
            box(g, x - 9, y - 13, 18, 7, 0x777c84);
            box(g, x - 10, y - 7, 20, 4, 0x50565d);
        }

        if (options.hat === 'ushanka') {
            box(g, x - 10, y - 13, 20, 7, COLORS.brown);
            box(g, x - 12, y - 8, 5, 11, COLORS.brown);
            box(g, x + 7, y - 8, 5, 11, COLORS.brown);
            box(g, x - 7, y - 11, 14, 4, 0xa18b69);
        }

        if (options.hat === 'hair') {
            box(g, x - 9, y - 13, 18, 7, COLORS.brown);
            box(g, x - 11, y - 13, 5, 5, COLORS.brown);
            box(g, x + 6, y - 16, 5, 8, COLORS.brown);
            box(g, x - 3, y - 17, 5, 7, COLORS.brown);
        }
    }

    function drawBottle(g, x, y, angle, size) {
        size = size || 1;

        var dx = Math.cos(angle);
        var dy = Math.sin(angle);

        var px = -dy;
        var py = dx;

        var bx = x + dx * 8;
        var by = y + dy * 8;

        // Корпус бутылки
        stroke(
            g,
            bx, by,
            bx + dx * 13 * size,
            by + dy * 13 * size,
            COLORS.glass,
            7 * size
        );

        // Горлышко
        stroke(
            g,
            bx + dx * 12 * size,
            by + dy * 12 * size,
            bx + dx * 19 * size,
            by + dy * 19 * size,
            0x9bcaab,
            3 * size
        );

        // Этикетка
        stroke(
            g,
            bx + dx * 6 * size - px * 3,
            by + dy * 6 * size - py * 3,
            bx + dx * 6 * size + px * 3,
            by + dy * 6 * size + py * 3,
            COLORS.yellow,
            2
        );
    }

    function drawBody(g, x, y, e, preset) {
        var size = preset.size || 1;
        var walk = Math.sin((e.walk || 0) * 2) * 3;

        var width = Math.round(19 * size);
        var height = Math.round(21 * size);

        var a = e.angle || 0;
        var dx = Math.cos(a);
        var dy = Math.sin(a);

        var sx = -dy;
        var sy = dx;

        // Тень
        box(
            g,
            x - width / 2 + 3,
            y + 10,
            width + 5,
            8,
            0x050509
        );

        // Левая нога
        box(
            g,
            x - 8 - dx * 5,
            y + 6 + walk,
            7, 11,
            preset.pants
        );

        // Правая нога
        box(
            g,
            x + 2 - dx * 5,
            y + 6 - walk,
            7, 11,
            preset.pants
        );

        // Ботинки
        box(
            g,
            x - 9 - dx * 5,
            y + 12 + walk,
            8, 6,
            COLORS.black
        );

        box(
            g,
            x + 2 - dx * 5,
            y + 12 - walk,
            8, 6,
            COLORS.black
        );

        // Куртка
        box(
            g,
            x - width / 2,
            y - 9,
            width,
            height,
            preset.coat
        );

        // Потёртые участки
        box(
            g,
            x - width / 2 + 2,
            y - 3,
            5, 6,
            preset.darkCoat
        );

        box(
            g,
            x + width / 2 - 7,
            y + 3,
            5, 5,
            preset.darkCoat
        );

        // Молния
        box(g, x - 1, y - 8, 2, 19, 0x99968c);

        // Рукава
        box(
            g,
            x - width / 2 - 5,
            y - 7,
            6, 15,
            preset.coat
        );

        box(
            g,
            x + width / 2 - 1,
            y - 7,
            6, 15,
            preset.coat
        );

        // Кисти
        box(
            g,
            x - width / 2 - 5,
            y + 6,
            6, 5,
            COLORS.skin
        );

        box(
            g,
            x + width / 2 - 1,
            y + 6,
            6, 5,
            COLORS.skin
        );

        pixelHead(g, x, y - 11, {
            skin: preset.skin,
            beard: preset.beard,
            hat: preset.hat
        });

        // Рюкзак главного героя
        if (preset.backpack) {
            box(
                g,
                x - dx * 12 - 7,
                y - dy * 12 - 5,
                14, 14,
                COLORS.brown
            );

            box(
                g,
                x - dx * 12 - 4,
                y - dy * 12 + 3,
                8, 5,
                0x403125
            );
        }
    }

    function drawWeapon(g, x, y, e, scene) {
        var a = e.angle || 0;
        var dx = Math.cos(a);
        var dy = Math.sin(a);

        var weaponId = scene.player.weapon;

        var length = [
            25, 30, 27, 36, 35
        ][weaponId] || 25;

        var kick = scene.player.kick || 0;

        // Приклад
        stroke(
            g,
            x - dx * 4,
            y - dy * 4,
            x + dx * 10,
            y + dy * 10,
            0x1c2024,
            7
        );

        // Ствол
        stroke(
            g,
            x + dx * 8,
            y + dy * 8,
            x + dx * (length - kick),
            y + dy * (length - kick),
            0x8c969b,
            weaponId === 3 ? 7 : 4
        );

        // Прицел
        box(
            g,
            x + dx * 12 - 2,
            y + dy * 12 - 2,
            4, 4,
            0x181b20
        );

        // Лазерная винтовка
        if (weaponId === 4) {
            stroke(
                g,
                x + dx * 13,
                y + dy * 13,
                x + dx * (length - kick),
                y + dy * (length - kick),
                0x22e5e5,
                2
            );
        }
    }

    function drawHeavyKeg(g, x, y) {
        // Металлический бидон
        box(g, x - 11, y - 6, 22, 24, 0x59636b);
        box(g, x - 9, y - 4, 18, 19, 0x84939a);

        box(g, x - 12, y - 9, 24, 5, 0x343b44);
        box(g, x - 12, y + 14, 24, 5, 0x343b44);

        box(g, x - 7, y + 2, 14, 5, 0xb5bdc1);
    }

    // ============================================
    // ГЛАВНЫЙ ГЕРОЙ
    // ============================================

    function drawHomelessPlayer(g, e, scene) {
        var x = Math.round(e.x);
        var y = Math.round(e.y);

        drawBody(g, x, y, e, {
            size: 1,
            coat: COLORS.green,
            darkCoat: COLORS.greenDark,
            pants: 0x444c52,
            skin: COLORS.skin,
            beard: COLORS.beard,
            hat: 'beanie',
            backpack: true
        });

        drawWeapon(g, x, y - 2, e, scene);

        // Короткое мигание при получении урона
        if (e.inv > 0 && Math.floor(e.inv / 4) % 2 === 0) {
            box(g, x - 12, y - 20, 24, 35, 0xffffff);
        }
    }

    // ============================================
    // ПРОТИВНИКИ
    // ============================================

    var ENEMY_TYPES = [
        {
            name: 'СИНЯК',
            coat: COLORS.blue,
            darkCoat: 0x263c65,
            pants: 0x454751,
            skin: COLORS.pale,
            beard: COLORS.beard,
            hat: null,
            size: 1
        },
        {
            name: 'ОПОХМЕЛЯТОР',
            coat: COLORS.orange,
            darkCoat: 0x99552c,
            pants: 0x31333c,
            skin: COLORS.skin,
            beard: null,
            hat: 'hair',
            size: 0.85
        },
        {
            name: 'БУТЫЛКОМЁТ',
            coat: COLORS.yellow,
            darkCoat: 0x957e32,
            pants: 0x53483d,
            skin: COLORS.pale,
            beard: COLORS.brown,
            hat: 'ushanka',
            size: 1.05
        },
        {
            name: 'БАТЯ С БИДОНОМ',
            coat: COLORS.red,
            darkCoat: 0x59232e,
            pants: 0x292c34,
            skin: COLORS.skin,
            beard: COLORS.beard,
            hat: null,
            size: 1.5
        }
    ];

    function drawDrunkEnemy(g, e) {
        var x = Math.round(e.x);
        var y = Math.round(e.y);

        var type = e.type || 0;
        var preset = ENEMY_TYPES[type] || ENEMY_TYPES[0];

        drawBody(g, x, y, e, preset);

        var a = e.angle || 0;
        var dx = Math.cos(a);
        var dy = Math.sin(a);

        if (type === 0) {
            // Бутылка в руке
            drawBottle(
                g,
                x + 7,
                y + 1,
                a,
                0.8
            );
        }

        if (type === 1) {
            // Две маленькие бутылки
            drawBottle(g, x - 7, y, a + 0.4, 0.65);
            drawBottle(g, x + 7, y, a - 0.4, 0.65);
        }

        if (type === 2) {
            // Бутылка направлена на игрока
            drawBottle(
                g,
                x + dx * 8,
                y + dy * 8,
                a,
                1.15
            );
        }

        if (type === 3) {
            // Большой металлический бидон
            drawHeavyKeg(
                g,
                x + dx * 18,
                y + dy * 18
            );
        }

        // Вспышка попадания
        if (e.hit > 0) {
            g.beginFill(0xffffff, 0.3);

            g.drawRect(
                x - e.r,
                y - e.r - 8,
                e.r * 2,
                e.r * 2 + 8
            );

            g.endFill();
        }
    }

    // ============================================
    // ПОДКЛЮЧЕНИЕ К ИГРЕ
    // ============================================

    function installCharacters(scene) {
        if (scene._nsBomzhInstalled) return;

        if (!scene.player ||
            !scene.drawCharacter ||
            !scene.graphics) {
            return;
        }

        scene._nsBomzhInstalled = true;

        scene.drawCharacter = function(g, entity, isPlayer) {
            if (isPlayer) {
                drawHomelessPlayer(g, entity, this);
            } else {
                drawDrunkEnemy(g, entity);
            }
        };
    }

    var _baseUpdate = Scene_Base.prototype.update;

    Scene_Base.prototype.update = function() {
        _baseUpdate.call(this);

        if (this.constructor &&
            this.constructor.name === 'Scene_NeonSlaughter') {

            installCharacters(this);
        }
    };

})();
