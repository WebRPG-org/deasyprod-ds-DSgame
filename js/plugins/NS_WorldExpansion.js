
/*:
 * @plugindesc v1.0 NEON SLAUGHTER - World Expansion & Visual FX
 * @author OpenAI
 *
 * @help
 * Дополнение для NeonSlaughter.js v2.0.
 *
 * Возможности:
 * - Плавная камера
 * - Увеличенный мир
 * - Декоративные детали пола
 * - Неоновые источники света
 * - Пульсирующие световые эффекты
 * - Мини-карта с противниками
 *
 * Порядок подключения:
 * 1. NeonSlaughter
 * 2. NS_WorldExpansion
 *
 * Требует изменения W=1600, H=1000
 * в основном плагине.
 */

(function() {
    'use strict';

    var MAP_W = 1600;
    var MAP_H = 1000;

    var VIEW_W = 960;
    var VIEW_H = 600;

    var CONFIG = {
        cameraSpeed: 0.10,
        decorationCount: 270,
        lightCount: 24,
        radarWidth: 165,
        radarHeight: 104,
        radarMargin: 20,
        showRadar: true,
        neonPulse: true
    };

    var COLORS = {
        cyan: 0x25e9ef,
        pink: 0xff327c,
        blue: 0x347ec2,
        yellow: 0xffc661,
        white: 0xffffff
    };

    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    // Детерминированная генерация декораций
    function randomGenerator(seed) {
        return function() {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
    }

    function drawRect(g, x, y, w, h, color, alpha) {
        g.beginFill(color, alpha === undefined ? 1 : alpha);
        g.drawRect(x, y, w, h);
        g.endFill();
    }

    function drawLine(g, x1, y1, x2, y2, color, width, alpha) {
        g.lineStyle(
            width || 1,
            color,
            alpha === undefined ? 1 : alpha
        );
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
    }

    function createDecorations(scene) {
        scene._nsDecor = new PIXI.Graphics();
        scene._nsLighting = new PIXI.Graphics();
        scene._nsRadar = new PIXI.Graphics();

        scene.world.addChild(scene._nsDecor);
        scene.world.addChild(scene._nsLighting);
        scene.addChild(scene._nsRadar);

        var rand = randomGenerator(20261031);
        var g = scene._nsDecor;

        // Трещины, швы и техническая разметка
        for (var i = 0; i < CONFIG.decorationCount; i++) {
            var x = Math.floor(rand() * MAP_W);
            var y = Math.floor(rand() * MAP_H);

            var type = Math.floor(rand() * 5);

            if (type === 0) {
                // Трещина
                drawLine(
                    g, x, y,
                    x + 18 + rand() * 32,
                    y + 6,
                    0x637185, 1, 0.35
                );

                drawLine(
                    g, x + 18, y + 6,
                    x + 28, y + 19,
                    0x637185, 1, 0.3
                );
            }

            if (type === 1) {
                // Металлическая пластина
                g.lineStyle(1, 0x53677c, 0.25);
                g.drawRect(x, y, 44, 32);

                drawRect(g, x + 3, y + 3, 3, 3, 0x75869a, 0.4);
                drawRect(g, x + 38, y + 25, 3, 3, 0x75869a, 0.4);
            }

            if (type === 2) {
                // Предупреждающая разметка
                for (var k = 0; k < 4; k++) {
                    drawRect(
                        g,
                        x + k * 12, y,
                        6, 3,
                        0xffbd58, 0.27
                    );
                }
            }

            if (type === 3) {
                // Цифровая маркировка
                drawRect(g, x, y, 30, 2, COLORS.cyan, 0.25);
                drawRect(g, x, y + 5, 12, 2, COLORS.cyan, 0.18);
            }

            if (type === 4) {
                // Царапины
                for (var j = 0; j < 3; j++) {
                    drawLine(
                        g,
                        x + j * 5, y,
                        x + j * 5 + 8, y + 17,
                        0x9a768a, 1, 0.18
                    );
                }
            }
        }

        // Световые полосы на границах секций
        for (var sy = 120; sy < MAP_H; sy += 240) {
            for (var sx = 90; sx < MAP_W; sx += 320) {
                drawRect(
                    g, sx, sy,
                    90, 3,
                    COLORS.cyan, 0.35
                );

                drawRect(
                    g, sx, sy + 8,
                    55, 2,
                    COLORS.blue, 0.3
                );
            }
        }

        // Список декоративных источников света
        scene._nsLights = [];

        for (i = 0; i < CONFIG.lightCount; i++) {
            scene._nsLights.push({
                x: 60 + rand() * (MAP_W - 120),
                y: 60 + rand() * (MAP_H - 120),
                radius: 30 + rand() * 35,
                color: i % 3 === 0 ? COLORS.pink : COLORS.cyan,
                phase: rand() * Math.PI * 2
            });
        }
    }

    // ============================================
    // ПЛАВНАЯ КАМЕРА
    // ============================================

    function updateCamera(scene) {
        var p = scene.player;
        if (!p) return;

        var maxX = MAP_W - VIEW_W;
        var maxY = MAP_H - VIEW_H;

        var targetX = clamp(
            p.x - VIEW_W / 2,
            0,
            Math.max(0, maxX)
        );

        var targetY = clamp(
            p.y - VIEW_H / 2,
            0,
            Math.max(0, maxY)
        );

        scene._nsCameraX +=
            (targetX - scene._nsCameraX) *
            CONFIG.cameraSpeed;

        scene._nsCameraY +=
            (targetY - scene._nsCameraY) *
            CONFIG.cameraSpeed;
    }

    // ============================================
    // ДИНАМИЧЕСКОЕ ОСВЕЩЕНИЕ
    // ============================================

    function drawLighting(scene) {
        var g = scene._nsLighting;
        g.clear();

        var time = scene.frame || 0;

        // Пульсирующие неоновые зоны
        for (var i = 0; i < scene._nsLights.length; i++) {
            var l = scene._nsLights[i];

            var pulse = CONFIG.neonPulse
                ? 0.75 + Math.sin(time * 0.035 + l.phase) * 0.25
                : 1;

            // Несколько концентрических квадратных контуров.
            // Так сохраняется пиксельная эстетика.
            for (var ring = 3; ring >= 1; ring--) {
                var r = l.radius * ring * 0.75;

                g.lineStyle(
                    2,
                    l.color,
                    0.035 * pulse / ring
                );

                g.drawRect(
                    Math.round(l.x - r),
                    Math.round(l.y - r),
                    Math.round(r * 2),
                    Math.round(r * 2)
                );
            }

            // Центр светильника
            drawRect(
                g,
                l.x - 8, l.y - 2,
                16, 4,
                l.color,
                0.55 * pulse
            );
        }

        // Свет от игрока
        if (scene.player && !scene.dead) {
            var p = scene.player;

            for (var j = 4; j >= 1; j--) {
                g.lineStyle(
                    2,
                    COLORS.cyan,
                    0.055 / j
                );

                g.drawCircle(
                    p.x, p.y,
                    15 + j * 18
                );
            }
        }

        // Подсветка снарядов
        var bullets = scene.bullets || [];

        for (i = 0; i < bullets.length; i++) {
            var b = bullets[i];

            g.lineStyle(2, b.color, 0.25);
            g.drawCircle(b.x, b.y, 9);

            g.lineStyle(1, b.color, 0.12);
            g.drawCircle(b.x, b.y, 17);
        }
    }

    // ============================================
    // РАДАР
    // ============================================

    function drawRadar(scene) {
        var g = scene._nsRadar;
        g.clear();

        if (!CONFIG.showRadar) return;

        var m = scene.getMetrics();

        var rw = CONFIG.radarWidth;
        var rh = CONFIG.radarHeight;

        var rx = m.w - rw - CONFIG.radarMargin;
        var ry = m.h - rh - 45;

        drawRect(
            g, rx - 5, ry - 25,
            rw + 10, rh + 30,
            0x050914, 0.88
        );

        g.lineStyle(1, COLORS.cyan, 0.7);
        g.drawRect(rx, ry, rw, rh);

        drawRect(
            g, rx + 1, ry + 1,
            rw - 2, rh - 2,
            0x112033, 0.65
        );

        var sx = rw / MAP_W;
        var sy = rh / MAP_H;

        // Сетка радара
        for (var x = 1; x < 4; x++) {
            drawLine(
                g,
                rx + x * rw / 4, ry,
                rx + x * rw / 4, ry + rh,
                0x2c4b61, 1, 0.5
            );
        }

        for (var y = 1; y < 4; y++) {
            drawLine(
                g,
                rx, ry + y * rh / 4,
                rx + rw, ry + y * rh / 4,
                0x2c4b61, 1, 0.5
            );
        }

        // Препятствия
        var objects = scene.objects || [];

        for (var i = 0; i < objects.length; i++) {
            var o = objects[i];

            drawRect(
                g,
                rx + o.x * sx,
                ry + o.y * sy,
                Math.max(2, o.w * sx),
                Math.max(2, o.h * sy),
                o.type === 'barrel'
                    ? COLORS.yellow
                    : 0x687b91,
                0.8
            );
        }

        // Противники
        var enemies = scene.enemies || [];

        for (i = 0; i < enemies.length; i++) {
            var e = enemies[i];

            if (e.dead) continue;

            drawRect(
                g,
                rx + e.x * sx - 2,
                ry + e.y * sy - 2,
                4, 4,
                COLORS.pink
            );
        }

        // Область, которую показывает камера
        g.lineStyle(1, COLORS.white, 0.45);
        g.drawRect(
            rx + scene._nsCameraX * sx,
            ry + scene._nsCameraY * sy,
            VIEW_W * sx,
            VIEW_H * sy
        );

        // Игрок
        if (scene.player) {
            drawRect(
                g,
                rx + scene.player.x * sx - 3,
                ry + scene.player.y * sy - 3,
                6, 6,
                COLORS.cyan
            );
        }
    }

    // ============================================
    // ПОДКЛЮЧЕНИЕ К ОСНОВНОЙ ИГРЕ
    // ============================================

    function installExpansion(scene) {
        if (scene._nsExpansionInstalled) return;

        // Проверяем, что перед нами нужная сцена.
        if (!scene.world ||
            !scene.player ||
            !scene.renderGame ||
            !scene.getMetrics ||
            !scene.mouseWorld) return;

        scene._nsExpansionInstalled = true;

        scene._nsCameraX = clamp(
            scene.player.x - VIEW_W / 2,
            0, MAP_W - VIEW_W
        );

        scene._nsCameraY = clamp(
            scene.player.y - VIEW_H / 2,
            0, MAP_H - VIEW_H
        );

        createDecorations(scene);

        // Фиксированный размер видимой области.
        // Теперь масштабирование зависит от VIEW,
        // а не от полного размера карты.
        scene.getMetrics = function() {
            var w = Graphics.boxWidth;
            var h = Graphics.boxHeight;

            var s = Math.min(
                w / VIEW_W,
                h / VIEW_H
            );

            return {
                w: w,
                h: h,
                s: s,
                x: (w - VIEW_W * s) / 2,
                y: (h - VIEW_H * s) / 2
            };
        };

        // Правильные координаты прицела с учётом камеры
        scene.mouseWorld = function() {
            var m = this.getMetrics();

            return {
                x: (this.mouse.x - m.x) / m.s +
                    this._nsCameraX,

                y: (this.mouse.y - m.y) / m.s +
                    this._nsCameraY
            };
        };

        // Корректируем положение всплывающих надписей,
        // поскольку базовый HUD не знает о камере.
        var oldHUD = scene.renderHUD;

        scene.renderHUD = function(m) {
            var original = [];

            for (var i = 0; i < this.floating.length; i++) {
                var f = this.floating[i];

                original.push({x:f.x, y:f.y});

                f.x -= this._nsCameraX;
                f.y -= this._nsCameraY;
            }

            try {
                oldHUD.call(this, m);
            } finally {
                for (i = 0; i < this.floating.length && i < original.length; i++) {
                    this.floating[i].x = original[i].x;
                    this.floating[i].y = original[i].y;
                }
            }
        };

        // Расширяем существующую отрисовку,
        // сохраняя основную игровую логику.
        var oldRender = scene.renderGame;

        scene.renderGame = function() {
            updateCamera(this);

            oldRender.call(this);

            var m = this.getMetrics();

            // Размещаем мир относительно камеры.
            // Масштабирование остаётся штатным.
            var shakeX = this.shake > 0.4
                ? (Math.random() - 0.5) * this.shake * m.s
                : 0;

            var shakeY = this.shake > 0.4
                ? (Math.random() - 0.5) * this.shake * m.s
                : 0;

            this.world.position.set(
                Math.round(
                    m.x - this._nsCameraX * m.s + shakeX
                ),
                Math.round(
                    m.y - this._nsCameraY * m.s + shakeY
                )
            );

            drawLighting(this);
            drawRadar(this);
        };
    }

    // Scene_NeonSlaughter находится внутри функции
    // основного плагина, поэтому подключаем дополнение
    // к уже созданному экземпляру через Scene_Base.
    var _SceneBase_update = Scene_Base.prototype.update;

    Scene_Base.prototype.update = function() {
        _SceneBase_update.call(this);

        if (this.constructor &&
            this.constructor.name === 'Scene_NeonSlaughter') {

            installExpansion(this);
        }
    };

})();
