
/*:
 * @plugindesc v1.0 NEON SLAUGHTER - NATURE WORLD
 * @author OpenAI
 *
 * @help
 * Превращает неоновую арену в заброшенный лесопарк.
 *
 * Добавляет:
 * - Травяной ландшафт
 * - Земляные тропинки
 * - Кусты и растительность
 * - Камни и цветы
 * - Мшистые валуны
 * - Деревянные препятствия
 * - Естественную цветовую палитру
 *
 * Подключать после:
 * NeonSlaughter
 * NS_WorldExpansion
 * NS_BomzhCharacters
 */

(function() {
    'use strict';

    var MAP_W = 1600;
    var MAP_H = 1000;

    var C = {
        grass: 0x426b38,
        grassLight: 0x598646,
        grassDark: 0x31552d,
        grassDeep: 0x244527,
        dirt: 0x84694a,
        dirtLight: 0x9e8058,
        dirtDark: 0x69523b,
        leaf: 0x3d792e,
        leafLight: 0x6a9b43,
        bush: 0x285d30,
        bark: 0x60452f,
        barkLight: 0x8b6745,
        stone: 0x6d7770,
        stoneLight: 0x9aa59b,
        moss: 0x567846,
        flower: 0xe4c96c,
        flowerPink: 0xe49bb4,
        water: 0x427e85,
        shadow: 0x203823
    };

    function rect(g, x, y, w, h, color, alpha) {
        g.beginFill(color, alpha === undefined ? 1 : alpha);
        g.drawRect(
            Math.round(x),
            Math.round(y),
            Math.round(w),
            Math.round(h)
        );
        g.endFill();
    }

    function circle(g, x, y, r, color, alpha) {
        g.beginFill(color, alpha === undefined ? 1 : alpha);
        g.drawCircle(x, y, r);
        g.endFill();
    }

    function rng(seed) {
        return function() {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
    }

    // ==========================================
    // ГЕНЕРАЦИЯ ДЕТАЛЕЙ ЛАНДШАФТА
    // ==========================================

    function createTerrainData(scene) {
        var random = rng(74521);

        scene._naturePatches = [];
        scene._natureGrass = [];
        scene._natureStones = [];
        scene._natureFlowers = [];
        scene._natureBushes = [];

        var i;

        // Пятна земли
        for (i = 0; i < 90; i++) {
            scene._naturePatches.push({
                x: random() * MAP_W,
                y: random() * MAP_H,
                w: 25 + random() * 90,
                h: 14 + random() * 55,
                color: random() < 0.5
                    ? C.grassLight
                    : C.grassDark
            });
        }

        // Пучки травы
        for (i = 0; i < 850; i++) {
            scene._natureGrass.push({
                x: random() * MAP_W,
                y: random() * MAP_H,
                size: 2 + Math.floor(random() * 5),
                color: random() < 0.5
                    ? C.grassLight
                    : C.grassDeep
            });
        }

        // Камешки
        for (i = 0; i < 170; i++) {
            scene._natureStones.push({
                x: random() * MAP_W,
                y: random() * MAP_H,
                size: 3 + Math.floor(random() * 9)
            });
        }

        // Полевые цветы
        for (i = 0; i < 130; i++) {
            scene._natureFlowers.push({
                x: random() * MAP_W,
                y: random() * MAP_H,
                color: random() < 0.65
                    ? C.flower
                    : C.flowerPink
            });
        }

        // Кусты — декоративные, без столкновений
        for (i = 0; i < 75; i++) {
            var bx = 35 + random() * (MAP_W - 70);
            var by = 35 + random() * (MAP_H - 70);

            // Не перекрываем начальную позицию игрока
            if (Math.abs(bx - MAP_W / 2) < 100 &&
                Math.abs(by - MAP_H / 2) < 100) {
                continue;
            }

            scene._natureBushes.push({
                x: bx,
                y: by,
                size: 9 + random() * 14
            });
        }
    }

    // ==========================================
    // ЗЕМЛЯНЫЕ ТРОПИНКИ
    // ==========================================

    function drawPaths(g) {
        // Горизонтальная извилистая тропа
        for (var x = 0; x < MAP_W; x += 12) {
            var cy = 450 +
                Math.sin(x * 0.008) * 75 +
                Math.sin(x * 0.019) * 18;

            rect(
                g,
                x, cy - 33,
                15, 66,
                C.dirt
            );

            rect(
                g,
                x, cy - 18,
                15, 36,
                C.dirtLight, 0.35
            );

            // Неровные края
            rect(g, x, cy - 37, 7, 5, C.dirtDark);
            rect(g, x + 5, cy + 31, 9, 5, C.dirtDark);
        }

        // Вертикальная тропинка
        for (var y = 0; y < MAP_H; y += 12) {
            var cx = 790 +
                Math.sin(y * 0.009) * 100;

            rect(
                g,
                cx - 27, y,
                54, 15,
                C.dirt
            );

            rect(
                g,
                cx - 13, y,
                26, 15,
                C.dirtLight, 0.3
            );
        }
    }

    // ==========================================
    // РАСТИТЕЛЬНОСТЬ
    // ==========================================

    function drawGrass(g, scene) {
        var i, p;

        // Основной зелёный пол
        rect(g, 0, 0, MAP_W, MAP_H, C.grass);

        // Разноцветные участки травы
        for (i = 0; i < scene._naturePatches.length; i++) {
            p = scene._naturePatches[i];

            rect(
                g,
                p.x, p.y,
                p.w, p.h,
                p.color,
                0.6
            );
        }

        drawPaths(g);

        // Мелкие травинки
        for (i = 0; i < scene._natureGrass.length; i++) {
            p = scene._natureGrass[i];

            rect(
                g,
                p.x, p.y,
                2, p.size,
                p.color
            );

            rect(
                g,
                p.x + 3,
                p.y + 2,
                2, Math.max(2, p.size - 1),
                p.color
            );
        }

        // Камни на земле
        for (i = 0; i < scene._natureStones.length; i++) {
            p = scene._natureStones[i];

            rect(
                g,
                p.x + 2, p.y + 3,
                p.size, p.size * 0.6,
                C.shadow, 0.35
            );

            rect(
                g,
                p.x, p.y,
                p.size, p.size * 0.6,
                C.stone
            );

            rect(
                g,
                p.x + 1, p.y,
                p.size * 0.5, 2,
                C.stoneLight
            );
        }

        // Цветы
        for (i = 0; i < scene._natureFlowers.length; i++) {
            p = scene._natureFlowers[i];

            rect(g, p.x, p.y, 3, 3, p.color);
            rect(g, p.x + 1, p.y + 3, 2, 4, C.grassDeep);
        }

        // Кусты
        for (i = 0; i < scene._natureBushes.length; i++) {
            p = scene._natureBushes[i];

            circle(
                g,
                p.x + 4,
                p.y + 6,
                p.size,
                C.shadow,
                0.45
            );

            circle(g, p.x, p.y, p.size, C.bush);

            circle(
                g,
                p.x - p.size * 0.3,
                p.y - p.size * 0.3,
                p.size * 0.6,
                C.leaf
            );

            circle(
                g,
                p.x + p.size * 0.35,
                p.y - p.size * 0.15,
                p.size * 0.4,
                C.leafLight
            );
        }
    }

    // ==========================================
    // ПРЕВРАЩАЕМ ПРЕПЯТСТВИЯ В ПРИРОДНЫЕ
    // ==========================================

    function drawNatureObjects(g, scene) {
        var objects = scene.objects || [];

        for (var i = 0; i < objects.length; i++) {
            var o = objects[i];

            // Тень
            rect(
                g,
                o.x + 5,
                o.y + 7,
                o.w, o.h,
                C.shadow,
                0.5
            );

            if (o.type === 'wall') {
                // Мшистый каменный валун
                rect(
                    g,
                    o.x, o.y,
                    o.w, o.h,
                    C.stone
                );

                rect(
                    g,
                    o.x + 4,
                    o.y + 4,
                    o.w - 8,
                    Math.max(5, o.h - 12),
                    C.stoneLight
                );

                rect(
                    g,
                    o.x + 7,
                    o.y + 5,
                    o.w * 0.4,
                    6,
                    C.moss
                );

                rect(
                    g,
                    o.x + o.w * 0.55,
                    o.y + 8,
                    o.w * 0.25,
                    5,
                    C.grassDeep
                );

                // Трещины
                rect(
                    g,
                    o.x + o.w * 0.4,
                    o.y + 13,
                    3,
                    Math.max(3, o.h * 0.35),
                    C.stone
                );
            }

            if (o.type === 'crate') {
                // Старый деревянный ящик
                rect(
                    g,
                    o.x, o.y,
                    o.w, o.h,
                    C.bark
                );

                rect(
                    g,
                    o.x + 3, o.y + 3,
                    o.w - 6, o.h - 6,
                    C.barkLight
                );

                rect(
                    g,
                    o.x + 5,
                    o.y + 5,
                    o.w - 10,
                    4,
                    C.bark
                );

                rect(
                    g,
                    o.x + 5,
                    o.y + o.h - 9,
                    o.w - 10,
                    4,
                    C.bark
                );

                // Мох
                rect(
                    g,
                    o.x + 3, o.y + 2,
                    12, 4,
                    C.moss
                );
            }

            if (o.type === 'barrel') {
                // Ржавая бочка на природе
                rect(
                    g,
                    o.x, o.y,
                    o.w, o.h,
                    0x764837
                );

                rect(
                    g,
                    o.x + 3, o.y + 3,
                    o.w - 6,
                    o.h - 6,
                    0x9d674a
                );

                rect(
                    g,
                    o.x + 2, o.y + 6,
                    o.w - 4, 4,
                    0x554d45
                );

                rect(
                    g,
                    o.x + 2, o.y + o.h - 9,
                    o.w - 4, 4,
                    0x554d45
                );

                // Предупреждающая маркировка
                rect(
                    g,
                    o.x + 9, o.y + 11,
                    6, 6,
                    0xe0bd50
                );
            }

            // Здоровье разрушаемых объектов
            if (o.type !== 'wall' && o.hp < o.maxHp) {
                rect(
                    g,
                    o.x, o.y - 6,
                    o.w, 3,
                    0x332b26
                );

                rect(
                    g,
                    o.x, o.y - 6,
                    o.w * Math.max(0, o.hp / o.maxHp),
                    3,
                    0xe0bd50
                );
            }
        }
    }

    // ==========================================
    // ДЕТАЛИ ОКРУЖЕНИЯ
    // ==========================================

    function drawAtmosphere(g, scene) {
        // Мягкая подсветка вместо неоновых контуров.
        // Это декоративный эффект, не настоящие тени.
        if (!scene.player || scene.dead) return;

        var p = scene.player;

        g.lineStyle(2, 0xe4d4a1, 0.08);
        g.drawCircle(p.x, p.y, 45);

        g.lineStyle(1, 0xe4d4a1, 0.045);
        g.drawCircle(p.x, p.y, 85);
    }

    // ==========================================
    // ПОДКЛЮЧЕНИЕ
    // ==========================================

    function installNature(scene) {
        if (scene._natureInstalled) return;

        if (!scene.drawEnvironment ||
            !scene.graphics ||
            !scene.world) {
            return;
        }

        scene._natureInstalled = true;

        createTerrainData(scene);
// ==========================================
// ОПТИМИЗАЦИЯ ПРИРОДНОЙ КАРТЫ
// ==========================================

// Создаём отдельный слой для статичного ландшафта
var terrainLayer = new PIXI.Graphics();

// Рисуем всю природу только один раз
drawGrass(terrainLayer, scene);

// Помещаем слой под остальные игровые объекты
scene.world.addChildAt(terrainLayer, 0);

// Кэшируем результат как текстуру
terrainLayer.cacheAsBitmap = true;

// Отключаем обработку событий для слоя
terrainLayer.eventMode = 'none';
terrainLayer.interactiveChildren = false;

// Сохраняем ссылку
scene._natureTerrainLayer = terrainLayer;

console.log(
    '[NEON SLAUGHTER] Terrain cached successfully!'
);
        // Отключаем футуристические декорации
        // из NS_WorldExpansion.
        if (scene._nsDecor) {
            scene._nsDecor.clear();
            scene._nsDecor.visible = false;
        }

        // Заменяем отрисовку старой арены
scene.drawEnvironment = function(g) {

            // Старые следы крови и взрывов сохраняются
            var decals = this.decals || [];

            for (var i = 0; i < decals.length; i++) {
                var d = decals[i];

                rect(
                    g,
                    d.x - d.size / 2,
                    d.y - d.size / 2,
                    d.size,
                    d.size * 0.7,
                    d.color,
                    d.alpha
                );
            }

            drawNatureObjects(g, this);
        };

        var oldRender = scene.renderGame;

        scene.renderGame = function() {
            oldRender.call(this);

            // Убираем неоновые источники света
            // предыдущего дополнения.
            if (this._nsLighting) {
                this._nsLighting.clear();
                drawAtmosphere(this._nsLighting, this);
            }
        };
    }

    var _baseUpdate = Scene_Base.prototype.update;

    Scene_Base.prototype.update = function() {
        _baseUpdate.call(this);

        if (this.constructor &&
            this.constructor.name === 'Scene_NeonSlaughter') {
            installNature(this);
        }
    };

})();
