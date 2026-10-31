
/*:
 * @plugindesc v2.0 NEON SLAUGHTER: PIXEL MAYHEM
 * @author OpenAI
 *
 * @param Title Command
 * @text Пункт главного меню
 * @type boolean
 * @default true
 *
 * @help
 * NEON SLAUGHTER 2.0 — самостоятельный пиксельный шутер.
 *
 * УСТАНОВКА:
 * Поместите NeonSlaughter.js в js/plugins/
 * и включите через менеджер плагинов RPG Maker MV.
 *
 * ЗАПУСК:
 * Пункт NEON SLAUGHTER в главном меню.
 * Либо команда плагина NeonStart.
 *
 * УПРАВЛЕНИЕ:
 * WASD / стрелки - движение
 * Мышь - прицеливание
 * ЛКМ / пробел - стрельба
 * 1-5 / колесо мыши - смена оружия
 * R - перезарядка
 * Shift - рывок
 * P - пауза
 * ESC - главное меню
 *
 * На экране смерти:
 * R / Enter - начать заново
 *
 * Не нужны внешние изображения и звуки.
 * Совместимость: RPG Maker MV, PIXI.js v4.
 */

(function() {
    'use strict';

    var PLUGIN = 'NeonSlaughter';
    var params = PluginManager.parameters(PLUGIN);
    var titleEnabled = String(
        params['Title Command'] || 'true'
    ) === 'true';

    var W = 1600;
    var H = 1000;
    var TAU = Math.PI * 2;

    var C = {
        bg: 0x080c14,
        floor: 0x121825,
        grid: 0x1e2938,
        cyan: 0x25e9ef,
        blue: 0x287bca,
        pink: 0xff327c,
        red: 0xe93c52,
        orange: 0xffa541,
        yellow: 0xffe27a,
        white: 0xe8faff,
        dark: 0x10131c,
        skin: 0xf1bd91,
        wall: 0x39475a,
        wood: 0x9b653d,
        green: 0x55fca2
    };

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function rnd(a, b) {
        return a + Math.random() * (b - a);
    }

    function irnd(a, b) {
        return Math.floor(rnd(a, b + 1));
    }

    function distance(a, b) {
        var x = a.x - b.x;
        var y = a.y - b.y;
        return Math.sqrt(x * x + y * y);
    }

    function angleTo(a, b) {
        return Math.atan2(b.y - a.y, b.x - a.x);
    }

    function rect(g, x, y, w, h, color, alpha) {
        g.beginFill(color, alpha === undefined ? 1 : alpha);
        g.drawRect(
            Math.round(x), Math.round(y),
            Math.round(w), Math.round(h)
        );
        g.endFill();
    }

    function circle(g, x, y, r, color, alpha) {
        g.beginFill(color, alpha === undefined ? 1 : alpha);
        g.drawCircle(x, y, r);
        g.endFill();
    }

    function line(g, x1, y1, x2, y2, color, width, alpha) {
        g.lineStyle(width || 2, color, alpha === undefined ? 1 : alpha);
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
    }

    // ============================================
    // ОРУЖИЕ
    // ============================================

    var WEAPONS = [
        {
            name: 'PISTOL',
            damage: 28,
            delay: 15,
            speed: 18,
            spread: 0.035,
            count: 1,
            magazine: 15,
            reload: 65,
            color: C.yellow,
            kick: 4,
            length: 27
        },
        {
            name: 'SMG',
            damage: 13,
            delay: 5,
            speed: 17,
            spread: 0.12,
            count: 1,
            magazine: 40,
            reload: 85,
            color: C.orange,
            kick: 3,
            length: 30
        },
        {
            name: 'SHOTGUN',
            damage: 13,
            delay: 34,
            speed: 15,
            spread: 0.36,
            count: 7,
            magazine: 8,
            reload: 105,
            color: C.red,
            kick: 11,
            length: 33
        },
        {
            name: 'MINIGUN',
            damage: 9,
            delay: 3,
            speed: 20,
            spread: 0.19,
            count: 1,
            magazine: 120,
            reload: 135,
            color: C.orange,
            kick: 2,
            length: 37
        },
        {
            name: 'LASER',
            damage: 60,
            delay: 26,
            speed: 32,
            spread: 0,
            count: 1,
            magazine: 12,
            reload: 110,
            color: C.cyan,
            kick: 8,
            length: 35,
            piercing: true
        }
    ];

    // ============================================
    // СЦЕНА
    // ============================================

    function Scene_NeonSlaughter() {
        this.initialize.apply(this, arguments);
    }

    Scene_NeonSlaughter.prototype =
        Object.create(Scene_Base.prototype);

    Scene_NeonSlaughter.prototype.constructor =
        Scene_NeonSlaughter;

    Scene_NeonSlaughter.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);

        this.keys = {};
        this.pressed = {};

        this.mouse = {
            x: W / 2,
            y: H / 2,
            down: false
        };

        this.lastMouseWheel = 0;
        this.frame = 0;
    };

    Scene_NeonSlaughter.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        this.background = new PIXI.Graphics();
        this.addChild(this.background);

        this.world = new PIXI.Container();
        this.addChild(this.world);

        this.graphics = new PIXI.Graphics();
        this.world.addChild(this.graphics);

        this.overlay = new PIXI.Graphics();
        this.addChild(this.overlay);

        this.hud = new Sprite(
            new Bitmap(Graphics.boxWidth, Graphics.boxHeight)
        );
        this.addChild(this.hud);

        this.installInput();
        this.resetGame();
    };

    // ============================================
    // УПРАВЛЕНИЕ
    // ============================================

    Scene_NeonSlaughter.prototype.installInput = function() {
        var self = this;

        this.onKeyDown = function(e) {
            var k = e.keyCode;

            if ([32, 37, 38, 39, 40].indexOf(k) >= 0) {
                e.preventDefault();
            }

            if (!self.keys[k]) self.pressed[k] = true;
            self.keys[k] = true;
        };

        this.onKeyUp = function(e) {
            self.keys[e.keyCode] = false;
        };

        this.onBlur = function() {
            self.keys = {};
            self.pressed = {};
            self.mouse.down = false;
        };

        this.onMouseMove = function(e) {
            self.mouse.x = Graphics.pageToCanvasX(e.pageX);
            self.mouse.y = Graphics.pageToCanvasY(e.pageY);
        };

        this.onMouseDown = function(e) {
            if (e.button === 0) self.mouse.down = true;
        };

        this.onMouseUp = function(e) {
            if (e.button === 0) self.mouse.down = false;
        };

        this.onWheel = function(e) {
            e.preventDefault();
            self.lastMouseWheel += e.deltaY > 0 ? 1 : -1;
        };

        this.onContext = function(e) {
            e.preventDefault();
        };

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);

        Graphics._canvas.addEventListener('wheel', this.onWheel);
        Graphics._canvas.addEventListener('contextmenu', this.onContext);
    };

    Scene_NeonSlaughter.prototype.terminate = function() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);

        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);

        if (Graphics._canvas) {
            Graphics._canvas.removeEventListener('wheel', this.onWheel);
            Graphics._canvas.removeEventListener(
                'contextmenu', this.onContext
            );
        }

        Scene_Base.prototype.terminate.call(this);
    };

    Scene_NeonSlaughter.prototype.justPressed = function(k) {
        return !!this.pressed[k];
    };

    Scene_NeonSlaughter.prototype.getMetrics = function() {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;
        var s = Math.min(w / W, h / H);

        return {
            w: w,
            h: h,
            s: s,
            x: (w - W * s) / 2,
            y: (h - H * s) / 2
        };
    };

    Scene_NeonSlaughter.prototype.mouseWorld = function() {
        var m = this.getMetrics();

        return {
            x: (this.mouse.x - m.x) / m.s,
            y: (this.mouse.y - m.y) / m.s
        };
    };

    // ============================================
    // НОВАЯ ИГРА
    // ============================================

    Scene_NeonSlaughter.prototype.resetGame = function() {
        this.player = {
            x: W / 2,
            y: H / 2,
            r: 12,
            hp: 100,
            maxHp: 100,
            angle: 0,
            walk: 0,
            inv: 0,
            dash: 0,
            dashCD: 0,
            dashX: 0,
            dashY: 0,
            weapon: 0,
            ammo: WEAPONS.map(function(w) {
                return w.magazine;
            }),
            reload: 0,
            shotCD: 0,
            kick: 0
        };

        this.bullets = [];
        this.enemies = [];
        this.objects = [];
        this.particles = [];
        this.decals = [];
        this.floating = [];

        this.wave = 0;
        this.score = 0;
        this.kills = 0;
        this.combo = 0;
        this.comboTime = 0;
        this.waveDelay = 50;
        this.spawnRemaining = 0;
        this.spawnTimer = 0;

        this.slowTime = 0;
        this.shake = 0;
        this.flash = 0;
        this.dead = false;
        this.paused = false;
        this.frame = 0;

        this.generateArena();
    };

    // ============================================
    // ГЕНЕРАЦИЯ УРОВНЯ
    // ============================================

    Scene_NeonSlaughter.prototype.generateArena = function() {
        this.objects = [];

        var self = this;

        function free(x, y, w, h) {
            var cx = x + w / 2;
            var cy = y + h / 2;

            if (Math.abs(cx - W / 2) < 135 &&
                Math.abs(cy - H / 2) < 120) return false;

            for (var i = 0; i < self.objects.length; i++) {
                var o = self.objects[i];

                if (x < o.x + o.w + 22 &&
                    x + w + 22 > o.x &&
                    y < o.y + o.h + 22 &&
                    y + h + 22 > o.y) {
                    return false;
                }
            }

            return true;
        }

        // Бетонные стены
        for (var i = 0; i < 9; i++) {
            var w = irnd(2, 4) * 22;
            var h = irnd(1, 2) * 22;

            for (var t = 0; t < 35; t++) {
                var x = irnd(65, W - w - 65);
                var y = irnd(70, H - h - 65);

                if (free(x, y, w, h)) {
                    this.objects.push({
                        type: 'wall',
                        x: x, y: y, w: w, h: h,
                        hp: Infinity,
                        maxHp: Infinity
                    });
                    break;
                }
            }
        }

        // Деревянные ящики
        for (i = 0; i < 15; i++) {
            for (t = 0; t < 35; t++) {
                x = irnd(45, W - 85);
                y = irnd(45, H - 85);

                if (free(x, y, 30, 30)) {
                    this.objects.push({
                        type: 'crate',
                        x: x, y: y, w: 30, h: 30,
                        hp: 55,
                        maxHp: 55
                    });
                    break;
                }
            }
        }

        // Взрывающиеся бочки
        for (i = 0; i < 9; i++) {
            for (t = 0; t < 35; t++) {
                x = irnd(50, W - 80);
                y = irnd(50, H - 80);

                if (free(x, y, 24, 24)) {
                    this.objects.push({
                        type: 'barrel',
                        x: x, y: y, w: 24, h: 24,
                        hp: 25,
                        maxHp: 25
                    });
                    break;
                }
            }
        }
    };

    Scene_NeonSlaughter.prototype.circleRect = function(
        x, y, r, o
    ) {
        var nx = clamp(x, o.x, o.x + o.w);
        var ny = clamp(y, o.y, o.y + o.h);

        var dx = x - nx;
        var dy = y - ny;

        return dx * dx + dy * dy < r * r;
    };

    Scene_NeonSlaughter.prototype.blocked = function(x, y, r) {
        if (x < r || y < r || x > W - r || y > H - r) {
            return true;
        }

        for (var i = 0; i < this.objects.length; i++) {
            if (this.circleRect(x, y, r, this.objects[i])) {
                return true;
            }
        }

        return false;
    };

    Scene_NeonSlaughter.prototype.moveEntity = function(
        e, dx, dy
    ) {
        if (!this.blocked(e.x + dx, e.y, e.r)) {
            e.x += dx;
        }

        if (!this.blocked(e.x, e.y + dy, e.r)) {
            e.y += dy;
        }
    };

    // ============================================
    // ВОЛНЫ ВРАГОВ
    // ============================================

    Scene_NeonSlaughter.prototype.startWave = function() {
        this.wave++;
        this.spawnRemaining = 4 + this.wave * 3;
        this.spawnTimer = 10;

        this.player.hp = Math.min(
            this.player.maxHp,
            this.player.hp + 15
        );

        this.addText(
            W / 2, H / 2 - 60,
            'WAVE ' + this.wave,
            C.cyan,
            90
        );
    };

    Scene_NeonSlaughter.prototype.spawnEnemy = function() {
        var type = 0;
        var roll = Math.random();

        if (this.wave >= 2 && roll < 0.25) type = 1;
        if (this.wave >= 3 && roll >= 0.6) type = 2;
        if (this.wave >= 5 && roll > 0.85) type = 3;

        var presets = [
            {hp: 45, speed: 1.7, r: 11, color: C.pink},
            {hp: 24, speed: 3.0, r: 9, color: C.orange},
            {hp: 65, speed: 1.2, r: 12, color: C.yellow},
            {hp: 190, speed: 0.8, r: 17, color: C.red}
        ];

        var def = presets[type];
        var x, y;
        var tries = 0;

        do {
            var edge = irnd(0, 3);

            x = edge === 0 ? 25 :
                edge === 1 ? W - 25 : rnd(30, W - 30);

            y = edge === 2 ? 25 :
                edge === 3 ? H - 25 : rnd(30, H - 30);

            tries++;
        } while (
            tries < 80 &&
            (
                this.blocked(x, y, def.r + 3) ||
                distance({x:x,y:y}, this.player) < 230
            )
        );

        if (this.blocked(x, y, def.r + 3)) {
            return;
        }

        this.enemies.push({
            x: x,
            y: y,
            r: def.r,
            hp: def.hp + Math.max(0, this.wave - 5) * 5,
            maxHp: def.hp + Math.max(0, this.wave - 5) * 5,
            speed: def.speed,
            color: def.color,
            type: type,
            angle: 0,
            walk: rnd(0, 10),
            shotCD: rnd(25, 90),
            hit: 0,
            strafe: Math.random() < 0.5 ? -1 : 1,
            aiTime: rnd(35, 100),
            dead: false
        });

        this.burst(x, y, def.color, 10, 2);
    };

    // ============================================
    // ГЛАВНЫЙ ЦИКЛ
    // ============================================

    Scene_NeonSlaughter.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (this.justPressed(27)) {
            SceneManager.goto(Scene_Title);
            this.pressed = {};
            return;
        }

        if (this.dead) {
            if (this.justPressed(82) || this.justPressed(13)) {
                this.resetGame();
            }
        } else {
            if (this.justPressed(80)) {
                this.paused = !this.paused;
            }

            if (!this.paused) {
                var dt = this.slowTime > 0 ? 0.55 : 1;

                this.frame += dt;

                this.updatePlayer(dt);
                this.updateBullets(dt);
                this.updateEnemies(dt);
                this.updateWaves(dt);
                this.updateParticles(dt);

                if (this.slowTime > 0) this.slowTime--;
                if (this.shake > 0) this.shake *= 0.83;
                if (this.flash > 0) this.flash--;
            }
        }

        this.renderGame();
        this.pressed = {};
    };

    Scene_NeonSlaughter.prototype.updateWaves = function(dt) {
        if (this.wave === 0) {
            this.waveDelay -= dt;

            if (this.waveDelay <= 0) {
                this.startWave();
            }
            return;
        }

        if (this.spawnRemaining > 0) {
            this.spawnTimer -= dt;

            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.spawnRemaining--;

                this.spawnTimer = Math.max(
                    10, 40 - this.wave * 2
                );
            }
        } else if (this.enemies.length === 0) {
            this.waveDelay -= dt;

            if (this.waveDelay <= 0) {
                this.startWave();
            }
        } else {
            this.waveDelay = 100;
        }
    };

    // ============================================
    // ИГРОК
    // ============================================

    Scene_NeonSlaughter.prototype.updatePlayer = function(dt) {
        var p = this.player;
        var m = this.mouseWorld();

        p.angle = angleTo(p, m);

        var vx =
            (this.keys[68] || this.keys[39] ? 1 : 0) -
            (this.keys[65] || this.keys[37] ? 1 : 0);

        var vy =
            (this.keys[83] || this.keys[40] ? 1 : 0) -
            (this.keys[87] || this.keys[38] ? 1 : 0);

        var len = Math.sqrt(vx * vx + vy * vy) || 1;

        vx /= len;
        vy /= len;

        if (p.inv > 0) p.inv -= dt;
        if (p.dashCD > 0) p.dashCD -= dt;
        if (p.shotCD > 0) p.shotCD -= dt;
        if (p.kick > 0) p.kick *= 0.72;

        if (this.justPressed(16) && p.dashCD <= 0 &&
            (vx !== 0 || vy !== 0)) {

            p.dash = 10;
            p.dashCD = 85;
            p.dashX = vx;
            p.dashY = vy;
            p.inv = Math.max(p.inv, 14);

            this.burst(p.x, p.y, C.cyan, 16, 4);
        }

        var speed = 3.1;

        if (p.dash > 0) {
            vx = p.dashX;
            vy = p.dashY;
            speed = 11;
            p.dash -= dt;

            if (Math.random() < 0.8) {
                this.particles.push({
                    x: p.x,
                    y: p.y,
                    vx: rnd(-1, 1),
                    vy: rnd(-1, 1),
                    life: 12,
                    max: 12,
                    color: C.cyan,
                    size: 5
                });
            }
        }

        this.moveEntity(
            p,
            vx * speed * dt,
            vy * speed * dt
        );

        if (vx !== 0 || vy !== 0) {
            p.walk += 0.25 * dt;
        }

        // Смена оружия цифрами
        for (var i = 0; i < 5; i++) {
            if (this.justPressed(49 + i)) {
                this.switchWeapon(i);
            }
        }

        // Колесо мыши
        if (this.lastMouseWheel !== 0) {
            var direction = this.lastMouseWheel > 0 ? 1 : -1;

            this.switchWeapon(
                (p.weapon + direction + WEAPONS.length) %
                WEAPONS.length
            );

            this.lastMouseWheel = 0;
        }

        if (this.justPressed(82)) {
            this.startReload();
        }

        if (p.reload > 0) {
            p.reload -= dt;

            if (p.reload <= 0) {
                p.ammo[p.weapon] =
                    WEAPONS[p.weapon].magazine;
                p.reload = 0;
            }
        }

        if ((this.mouse.down || this.keys[32]) &&
            p.shotCD <= 0 &&
            p.reload <= 0) {

            this.fireWeapon();
        }

        if (this.comboTime > 0) {
            this.comboTime -= dt;
        } else {
            this.combo = 0;
        }
    };

    Scene_NeonSlaughter.prototype.switchWeapon = function(index) {
        var p = this.player;

        if (index === p.weapon) return;

        p.weapon = index;
        p.reload = 0;
        p.shotCD = 12;
        p.kick = 0;

        this.addText(
            p.x, p.y - 28,
            WEAPONS[index].name,
            C.cyan,
            35
        );
    };

    Scene_NeonSlaughter.prototype.startReload = function() {
        var p = this.player;
        var w = WEAPONS[p.weapon];

        if (p.reload > 0) return;
        if (p.ammo[p.weapon] >= w.magazine) return;

        p.reload = w.reload;
        this.addText(p.x, p.y - 35, 'RELOAD', C.yellow, 40);
    };

    Scene_NeonSlaughter.prototype.fireWeapon = function() {
        var p = this.player;
        var w = WEAPONS[p.weapon];

        if (p.ammo[p.weapon] <= 0) {
            this.startReload();
            return;
        }

        p.ammo[p.weapon]--;
        p.shotCD = w.delay;
        p.kick = w.kick;

        var a = p.angle;
        var mx = p.x + Math.cos(a) * w.length;
        var my = p.y + Math.sin(a) * w.length;

        for (var i = 0; i < w.count; i++) {
            var spread = rnd(-w.spread, w.spread);
            var ba = a + spread;

            this.bullets.push({
                x: mx,
                y: my,
                oldX: mx,
                oldY: my,
                vx: Math.cos(ba) * w.speed,
                vy: Math.sin(ba) * w.speed,
                r: w.piercing ? 4 : 3,
                damage: w.damage,
                life: w.piercing ? 32 : 48,
                color: w.color,
                enemy: false,
                piercing: !!w.piercing,
                hits: [],
                dead: false
            });
        }

        this.burst(mx, my, w.color, 7, 3);
        this.shake = Math.max(this.shake, w.kick * 0.4);

        // Отдача игрока
        this.moveEntity(
            p,
            -Math.cos(a) * w.kick * 0.3,
            -Math.sin(a) * w.kick * 0.3
        );

        if (p.ammo[p.weapon] <= 0) {
            this.startReload();
        }
    };

    // ============================================
    // ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ
    // ============================================

    Scene_NeonSlaughter.prototype.updateEnemies = function(dt) {
        var p = this.player;

        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];

            if (e.dead) continue;

            var d = distance(e, p);
            var a = angleTo(e, p);

            e.angle = a;
            e.walk += 0.13 * dt;

            if (e.hit > 0) e.hit -= dt;
            if (e.shotCD > 0) e.shotCD -= dt;

            e.aiTime -= dt;

            if (e.aiTime <= 0) {
                e.strafe *= -1;
                e.aiTime = rnd(40, 100);
            }

            var vx = Math.cos(a);
            var vy = Math.sin(a);

            // Стрелок держит дистанцию и двигается боком
            if (e.type === 2) {
                if (d < 150) {
                    vx = -Math.cos(a);
                    vy = -Math.sin(a);
                } else if (d < 250) {
                    vx = Math.cos(a + e.strafe * Math.PI / 2);
                    vy = Math.sin(a + e.strafe * Math.PI / 2);
                }

                if (d < 350 && e.shotCD <= 0) {
                    this.enemyShoot(e, a, 6, 10);
                    e.shotCD = rnd(60, 95);
                }
            }

            // Тяжёлый противник стреляет очередями
            if (e.type === 3) {
                if (d < 270 && e.shotCD <= 0) {
                    this.enemyShoot(e, a - 0.16, 5, 12);
                    this.enemyShoot(e, a, 5, 12);
                    this.enemyShoot(e, a + 0.16, 5, 12);
                    e.shotCD = 105;
                }
            }

            // Простое избегание препятствий
            var speed = e.speed * dt;

            if (e.type === 2 && d < 120) {
                speed *= 0.7;
            }

            var nx = e.x + vx * speed;
            var ny = e.y + vy * speed;

            if (this.blocked(nx, ny, e.r)) {
                var side = e.strafe * Math.PI / 2;
                var sideX = Math.cos(a + side);
                var sideY = Math.sin(a + side);

                this.moveEntity(
                    e,
                    sideX * speed,
                    sideY * speed
                );
            } else {
                this.moveEntity(
                    e,
                    vx * speed,
                    vy * speed
                );
            }

            // Столкновение с игроком
            if (distance(e, p) < e.r + p.r) {
                if (p.inv <= 0) {
                    this.damagePlayer(
                        e.type === 3 ? 26 : 15
                    );
                }
            }
        }

        this.enemies = this.enemies.filter(function(e) {
            return !e.dead;
        });
    };

    Scene_NeonSlaughter.prototype.enemyShoot = function(
        e, a, speed, damage
    ) {
        var x = e.x + Math.cos(a) * (e.r + 7);
        var y = e.y + Math.sin(a) * (e.r + 7);

        this.bullets.push({
            x: x,
            y: y,
            oldX: x,
            oldY: y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            r: 4,
            damage: damage,
            life: 100,
            color: C.red,
            enemy: true,
            piercing: false,
            hits: [],
            dead: false
        });

        this.burst(x, y, C.red, 5, 2);
    };

    // ============================================
    // ПУЛИ И СТОЛКНОВЕНИЯ
    // ============================================

    Scene_NeonSlaughter.prototype.updateBullets = function(dt) {
        var self = this;

        this.bullets.forEach(function(b) {
            if (b.dead) return;

            b.oldX = b.x;
            b.oldY = b.y;
            b.life -= dt;

            if (b.life <= 0) {
                b.dead = true;
                return;
            }

            // Несколько шагов за кадр уменьшают
            // вероятность прохождения пули сквозь стену.
            var steps = Math.max(
                1,
                Math.ceil(
                    Math.sqrt(b.vx*b.vx+b.vy*b.vy)*dt/5
                )
            );

            for (var step = 0; step < steps; step++) {
                if (b.dead) break;

                b.x += b.vx * dt / steps;
                b.y += b.vy * dt / steps;

                if (b.x < 0 || b.y < 0 ||
                    b.x > W || b.y > H) {
                    b.dead = true;
                    break;
                }

                // Столкновение с объектами
                for (var i = self.objects.length - 1; i >= 0; i--) {
                    var o = self.objects[i];

                    if (self.circleRect(b.x, b.y, b.r, o)) {
                        self.hitObject(o, b.damage);
                        self.burst(b.x, b.y, b.color, 6, 3);

                        b.dead = true;
                        break;
                    }
                }

                if (b.dead) break;

                if (b.enemy) {
                    if (distance(b, self.player) <
                        b.r + self.player.r) {

                        self.damagePlayer(b.damage);
                        b.dead = true;
                    }
                } else {
                    for (i = 0; i < self.enemies.length; i++) {
                        var e = self.enemies[i];

                        if (e.dead) continue;
                        if (b.hits.indexOf(e) >= 0) continue;

                        if (distance(b, e) < b.r + e.r) {
                            b.hits.push(e);

                            self.damageEnemy(e, b.damage);
                            self.burst(
                                b.x, b.y,
                                C.pink, 7, 3
                            );

                            if (!b.piercing) {
                                b.dead = true;
                                break;
                            }
                        }
                    }
                }
            }
        });

        this.bullets = this.bullets.filter(function(b) {
            return !b.dead;
        });
    };

    // ============================================
    // УРОН
    // ============================================

    Scene_NeonSlaughter.prototype.damagePlayer = function(damage) {
        var p = this.player;

        if (p.inv > 0 || this.dead) return;

        p.hp = Math.max(0, p.hp - damage);
        p.inv = 35;

        this.flash = 8;
        this.shake = Math.max(this.shake, 12);

        this.burst(p.x, p.y, C.cyan, 18, 5);

        this.addText(
            p.x, p.y - 30,
            '-' + damage,
            C.red,
            40
        );

        if (p.hp <= 0) {
            this.dead = true;
            this.mouse.down = false;

            this.burst(p.x, p.y, C.cyan, 55, 8);
        }
    };

    Scene_NeonSlaughter.prototype.damageEnemy = function(
        e, damage
    ) {
        if (e.dead) return;

        e.hp -= damage;
        e.hit = 7;

        if (e.hp <= 0) {
            this.killEnemy(e);
        }
    };

    Scene_NeonSlaughter.prototype.killEnemy = function(e) {
        if (e.dead) return;

        e.dead = true;

        this.kills++;
        this.combo++;
        this.comboTime = 160;

        var points = (e.type === 3 ? 300 : 100) *
            Math.min(this.combo, 10);

        this.score += points;

        this.addText(
            e.x, e.y - 25,
            '+' + points,
            C.yellow,
            50
        );

        // Короткий эффект замедления после убийства
        this.slowTime = Math.max(this.slowTime, 7);

        this.shake = Math.max(this.shake, 5);

        this.burst(
            e.x, e.y,
            e.color,
            e.type === 3 ? 35 : 20,
            5
        );

        // Пятно на полу
        this.decals.push({
            x: e.x,
            y: e.y,
            size: e.type === 3 ? 23 : 15,
            color: C.red,
            alpha: 0.55,
            rotation: rnd(0, TAU)
        });

        if (this.decals.length > 100) {
            this.decals.shift();
        }
    };

    // ============================================
    // РАЗРУШАЕМЫЕ ОБЪЕКТЫ
    // ============================================

    Scene_NeonSlaughter.prototype.hitObject = function(
        o, damage
    ) {
        if (o.type === 'wall') {
            this.burst(
                o.x + o.w / 2,
                o.y + o.h / 2,
                C.wall, 4, 2
            );
            return;
        }

        o.hp -= damage;

        if (o.hp <= 0) {
            var index = this.objects.indexOf(o);

            if (index >= 0) {
                this.objects.splice(index, 1);
            }

            var cx = o.x + o.w / 2;
            var cy = o.y + o.h / 2;

            if (o.type === 'barrel') {
                this.explode(cx, cy, 105, 95);
            } else {
                this.burst(cx, cy, C.wood, 20, 5);
                this.shake = Math.max(this.shake, 3);
            }
        }
    };

    Scene_NeonSlaughter.prototype.explode = function(
        x, y, radius, damage
    ) {
        this.shake = Math.max(this.shake, 18);
        this.flash = Math.max(this.flash, 5);

        this.burst(x, y, C.orange, 55, 9);
        this.burst(x, y, C.yellow, 25, 6);

        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 16,
            max: 16,
            color: C.orange,
            size: radius,
            ring: true
        });

        this.decals.push({
            x: x,
            y: y,
            size: radius * 0.45,
            color: 0x080808,
            alpha: 0.75
        });

        var origin = {x:x, y:y};

        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];

            if (!e.dead && distance(origin, e) < radius) {
                var d = distance(origin, e);
                var dealt = Math.round(
                    damage * (1 - d / (radius * 1.5))
                );
                this.damageEnemy(e, dealt);
            }
        }

        if (distance(origin, this.player) < radius) {
            this.damagePlayer(35);
        }

        // Цепные взрывы бочек
        var nearby = this.objects.slice();

        for (i = 0; i < nearby.length; i++) {
            var o = nearby[i];

            if (o.type !== 'barrel') continue;

            var center = {
                x: o.x + o.w / 2,
                y: o.y + o.h / 2
            };

            if (distance(origin, center) < radius) {
                this.hitObject(o, 1000);
            }
        }
    };

    // ============================================
    // ЧАСТИЦЫ
    // ============================================

    Scene_NeonSlaughter.prototype.burst = function(
        x, y, color, count, power
    ) {
        for (var i = 0; i < count; i++) {
            var a = rnd(0, TAU);
            var s = rnd(0.5, power);

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: rnd(12, 32),
                max: 32,
                color: color,
                size: rnd(2, 6),
                ring: false
            });
        }

        if (this.particles.length > 650) {
            this.particles.splice(
                0, this.particles.length - 650
            );
        }
    };

    Scene_NeonSlaughter.prototype.addText = function(
        x, y, message, color, life
    ) {
        this.floating.push({
            x: x,
            y: y,
            text: message,
            color: color,
            life: life,
            max: life
        });
    };

    Scene_NeonSlaughter.prototype.updateParticles = function(dt) {
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            p.vx *= 0.94;
            p.vy *= 0.94;

            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (i = this.floating.length - 1; i >= 0; i--) {
            var f = this.floating[i];

            f.y -= 0.45 * dt;
            f.life -= dt;

            if (f.life <= 0) {
                this.floating.splice(i, 1);
            }
        }
    };

    // ============================================
    // ГРАФИКА: ПИКСЕЛЬНЫЕ ПЕРСОНАЖИ
    // ============================================

    Scene_NeonSlaughter.prototype.drawCharacter = function(
        g, entity, isPlayer
    ) {
        var x = Math.round(entity.x);
        var y = Math.round(entity.y);
        var a = entity.angle;

        var body = isPlayer ? C.cyan : entity.color;
        var heavy = !isPlayer && entity.type === 3;

        var r = heavy ? 17 : 11;

        // Тень
        rect(g, x - r, y + 7, r * 2, 9, 0x000000, 0.45);

        // Анимация ног
        var walk = Math.sin(entity.walk * 2) * 4;

        var dx = Math.cos(a);
        var dy = Math.sin(a);

        var sideX = -dy;
        var sideY = dx;

        var backX = x - dx * 7;
        var backY = y - dy * 7;

        // Ноги
        rect(
            g,
            backX + sideX * 6 - 4,
            backY + sideY * 6 - 4 + walk,
            8, 8,
            0x10121a
        );

        rect(
            g,
            backX - sideX * 6 - 4,
            backY - sideY * 6 - 4 - walk,
            8, 8,
            0x10121a
        );

        // Корпус — пиксельный силуэт
        rect(
            g,
            x - r,
            y - r,
            r * 2,
            r * 2,
            body
        );

        rect(
            g,
            x - r + 4,
            y - r + 4,
            r * 2 - 8,
            r * 2 - 8,
            isPlayer ? 0x164a61 : 0x3a182b
        );

        // Голова
        var hx = x + dx * 3;
        var hy = y + dy * 3;

        rect(
            g,
            hx - 6,
            hy - 6,
            12, 12,
            isPlayer ? C.skin : 0x25242d
        );

        // Визор / глаза
        rect(
            g,
            hx + dx * 4 - 4,
            hy + dy * 4 - 3,
            8, 5,
            isPlayer ? C.white : body
        );

        // Плечи
        rect(
            g,
            x + sideX * 11 - 4,
            y + sideY * 11 - 4,
            8, 8,
            body
        );

        rect(
            g,
            x - sideX * 11 - 4,
            y - sideY * 11 - 4,
            8, 8,
            body
        );

        // Оружие
        var length = isPlayer
            ? WEAPONS[this.player.weapon].length
            : (entity.type >= 2 ? 27 : 15);

        var kick = isPlayer ? this.player.kick : 0;

        var wx = x + dx * 7;
        var wy = y + dy * 7;

        line(
            g,
            wx,
            wy,
            x + dx * (length - kick),
            y + dy * (length - kick),
            0x050608,
            heavy ? 9 : 7
        );

        line(
            g,
            wx,
            wy,
            x + dx * (length - kick),
            y + dy * (length - kick),
            isPlayer ? 0xa2b5c8 : 0x545b66,
            heavy ? 5 : 3
        );

        // Мигание от урона
        if ((!isPlayer && entity.hit > 0) ||
            (isPlayer && entity.inv > 0 &&
             Math.floor(entity.inv / 4) % 2 === 0)) {

            rect(
                g,
                x - r, y - r,
                r * 2, r * 2,
                0xffffff, 0.35
            );
        }
    };

    // ============================================
    // ОТРИСОВКА ОКРУЖЕНИЯ
    // ============================================

    Scene_NeonSlaughter.prototype.drawEnvironment = function(g) {
        rect(g, 0, 0, W, H, C.floor);

        // Пиксельная сетка
        for (var x = 0; x < W; x += 32) {
            line(g, x, 0, x, H, C.grid, 1, 0.65);
        }

        for (var y = 0; y < H; y += 32) {
            line(g, 0, y, W, y, C.grid, 1, 0.65);
        }

        // Декоративные полосы на полу
        for (var i = 0; i < 12; i++) {
            var sx = (i * 173 + 47) % W;
            var sy = (i * 113 + 91) % H;

            rect(g, sx, sy, 18, 3, C.grid);
            rect(g, sx + 22, sy, 7, 3, C.grid);
        }

        // Неоновые границы
        rect(g, 0, 0, W, 5, C.cyan);
        rect(g, 0, H - 5, W, 5, C.cyan);
        rect(g, 0, 0, 5, H, C.cyan);
        rect(g, W - 5, 0, 5, H, C.cyan);

        // Следы крови, взрывов
        for (i = 0; i < this.decals.length; i++) {
            var d = this.decals[i];

            rect(
                g,
                d.x - d.size / 2,
                d.y - d.size / 2,
                d.size,
                d.size * 0.7,
                d.color,
                d.alpha
            );

            if (d.color === C.red) {
                rect(
                    g,
                    d.x + d.size * 0.3,
                    d.y - d.size * 0.3,
                    5, 5,
                    C.red, 0.5
                );
            }
        }

        // Объекты
        for (i = 0; i < this.objects.length; i++) {
            var o = this.objects[i];

            // Тень
            rect(
                g,
                o.x + 5, o.y + 7,
                o.w, o.h,
                0x000000, 0.45
            );

            if (o.type === 'wall') {
                rect(
                    g,
                    o.x, o.y,
                    o.w, o.h,
                    C.wall
                );

                rect(
                    g,
                    o.x + 3, o.y + 3,
                    o.w - 6, 6,
                    0x63748b
                );

                rect(
                    g,
                    o.x + 4,
                    o.y + o.h - 7,
                    o.w - 8, 3,
                    0x172536
                );
            }

            if (o.type === 'crate') {
                rect(
                    g,
                    o.x, o.y,
                    o.w, o.h,
                    C.wood
                );

                rect(
                    g,
                    o.x + 4, o.y + 4,
                    o.w - 8, o.h - 8,
                    0x563c2c
                );

                line(
                    g,
                    o.x + 4, o.y + 4,
                    o.x + o.w - 4,
                    o.y + o.h - 4,
                    C.wood, 4
                );

                line(
                    g,
                    o.x + o.w - 4, o.y + 4,
                    o.x + 4,
                    o.y + o.h - 4,
                    C.wood, 4
                );
            }

            if (o.type === 'barrel') {
                rect(
                    g,
                    o.x, o.y,
                    o.w, o.h,
                    0x8e243e
                );

                rect(
                    g,
                    o.x + 3, o.y + 4,
                    o.w - 6, 5,
                    C.orange
                );

                rect(
                    g,
                    o.x + 3, o.y + 14,
                    o.w - 6, 5,
                    C.orange
                );

                rect(
                    g,
                    o.x + 10, o.y + 10,
                    5, 5,
                    C.yellow
                );
            }

            // Индикатор прочности повреждённого объекта
            if (o.type !== 'wall' && o.hp < o.maxHp) {
                rect(
                    g,
                    o.x, o.y - 6,
                    o.w, 3,
                    0x3b1b21
                );

                rect(
                    g,
                    o.x, o.y - 6,
                    o.w * clamp(o.hp / o.maxHp, 0, 1),
                    3,
                    C.red
                );
            }
        }
    };

    // ============================================
    // ОТРИСОВКА ПУЛЬ И ЭФФЕКТОВ
    // ============================================

    Scene_NeonSlaughter.prototype.drawEffects = function(g) {
        var i;

        for (i = 0; i < this.bullets.length; i++) {
            var b = this.bullets[i];

            line(
                g,
                b.x - b.vx * 1.4,
                b.y - b.vy * 1.4,
                b.x,
                b.y,
                b.color,
                b.piercing ? 6 : 3,
                0.7
            );

            rect(
                g,
                b.x - b.r,
                b.y - b.r,
                b.r * 2,
                b.r * 2,
                b.color
            );
        }

        for (i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var alpha = clamp(p.life / p.max, 0, 1);

            if (p.ring) {
                g.lineStyle(
                    4,
                    p.color,
                    alpha
                );

                g.drawCircle(
                    p.x, p.y,
                    p.size * (1 - alpha)
                );
            } else {
                rect(
                    g,
                    p.x - p.size / 2,
                    p.y - p.size / 2,
                    p.size,
                    p.size,
                    p.color,
                    alpha
                );
            }
        }
    };

    // ============================================
    // ПОЛНАЯ ОТРИСОВКА
    // ============================================

    Scene_NeonSlaughter.prototype.renderGame = function() {
        var g = this.graphics;
        var m = this.getMetrics();

        this.background.clear();
        rect(
            this.background,
            0, 0,
            m.w, m.h,
            C.bg
        );

        g.clear();

        var shakeX = 0;
        var shakeY = 0;

        if (this.shake > 0.4) {
            shakeX = rnd(-this.shake, this.shake);
            shakeY = rnd(-this.shake, this.shake);
        }

        this.world.scale.set(m.s, m.s);
        this.world.position.set(
            Math.round(m.x + shakeX * m.s),
            Math.round(m.y + shakeY * m.s)
        );

        this.drawEnvironment(g);

        // Сначала враги
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];

            if (!e.dead) {
                this.drawCharacter(g, e, false);

                // Полоска HP
                if (e.hp < e.maxHp) {
                    rect(
                        g,
                        e.x - 15, e.y - e.r - 12,
                        30, 4,
                        0x30131d
                    );

                    rect(
                        g,
                        e.x - 15, e.y - e.r - 12,
                        30 * Math.max(0, e.hp / e.maxHp),
                        4,
                        e.color
                    );
                }
            }
        }

        // Игрок
        if (!this.dead) {
            this.drawCharacter(g, this.player, true);
        }

        this.drawEffects(g);

        // Подсветка вокруг игрока
        if (!this.dead) {
            g.lineStyle(
                1,
                C.cyan,
                0.18
            );

            g.drawCircle(
                this.player.x,
                this.player.y,
                34
            );
        }

        // Прицел и экранные эффекты
        this.overlay.clear();

        var mx = this.mouse.x;
        var my = this.mouse.y;

        var cross = this.overlay;

        line(cross, mx - 14, my, mx - 5, my, C.cyan, 2);
        line(cross, mx + 5, my, mx + 14, my, C.cyan, 2);
        line(cross, mx, my - 14, mx, my - 5, C.cyan, 2);
        line(cross, mx, my + 5, mx, my + 14, C.cyan, 2);

        cross.lineStyle(1, C.cyan, 0.7);
        cross.drawCircle(mx, my, 4);

        if (this.flash > 0) {
            rect(
                cross, 0, 0,
                m.w, m.h,
                C.red,
                this.flash * 0.025
            );
        }

        this.renderHUD(m);
    };

    // ============================================
    // HUD
    // ============================================

    Scene_NeonSlaughter.prototype.renderHUD = function(m) {
        var b = this.hud.bitmap;

        if (b.width !== m.w || b.height !== m.h) {
            this.hud.bitmap = b = new Bitmap(m.w, m.h);
        }

        b.clear();
        b.fontFace = 'GameFont';

        var p = this.player;
        var w = WEAPONS[p.weapon];

        // Название
        b.fontSize = 23;
        b.textColor = '#25e9ef';
        b.drawText(
            'NEON // SLAUGHTER',
            18, 10, 320, 34, 'left'
        );

        // HP
        b.fillRect(20, 55, 204, 17, '#151923');
        b.fillRect(
            22, 57,
            200 * p.hp / p.maxHp,
            13,
            p.hp < 30 ? '#ff327c' : '#25e9ef'
        );

        b.fontSize = 16;
        b.textColor = '#ffffff';
        b.drawText(
            'HP ' + p.hp,
            24, 77, 150, 26, 'left'
        );

        // Оружие
        b.fontSize = 18;
        b.textColor = '#ffe27a';

        b.drawText(
            w.name,
            20, m.h - 105,
            250, 30, 'left'
        );

        b.fontSize = 28;
        b.textColor = '#ffffff';

        b.drawText(
            p.ammo[p.weapon] + ' / ' + w.magazine,
            20, m.h - 77,
            240, 36, 'left'
        );

        if (p.reload > 0) {
            b.fontSize = 15;
            b.textColor = '#ffb457';

            b.drawText(
                'RELOADING...',
                20, m.h - 43,
                200, 24, 'left'
            );
        }

        // Очки
        b.fontSize = 21;
        b.textColor = '#ffffff';

        b.drawText(
            'SCORE ' + this.score,
            m.w - 275, 14,
            255, 30, 'right'
        );

        b.fontSize = 18;
        b.textColor = '#25e9ef';

        b.drawText(
            'WAVE ' + this.wave,
            m.w - 275, 48,
            255, 26, 'right'
        );

        b.fontSize = 16;
        b.textColor = '#a8b5c8';

        b.drawText(
            'KILLS ' + this.kills,
            m.w - 275, 76,
            255, 25, 'right'
        );

        // Комбо
        if (this.combo > 1 && this.comboTime > 0) {
            b.fontSize = 30;
            b.textColor = '#ff327c';

            b.drawText(
                'x' + this.combo + ' COMBO',
                0, 90,
                m.w, 45, 'center'
            );
        }

        // Доступность рывка
        b.fontSize = 14;
        b.textColor = p.dashCD <= 0
            ? '#55fca2'
            : '#7c8595';

        b.drawText(
            p.dashCD <= 0 ? 'DASH READY' : 'DASH COOLING',
            20, 106, 200, 24, 'left'
        );

        // Летающие надписи
        var scale = m.s;

        for (var i = 0; i < this.floating.length; i++) {
            var f = this.floating[i];

            var sx = m.x + f.x * scale;
            var sy = m.y + f.y * scale;

            b.fontSize = 18;
            b.textColor =
                '#' + ('000000' + f.color.toString(16)).slice(-6);

            b.paintOpacity = Math.floor(
                255 * clamp(f.life / f.max, 0, 1)
            );

            b.drawText(
                f.text,
                sx - 90, sy - 12,
                180, 28, 'center'
            );
        }

        b.paintOpacity = 255;

        // Подсказки
        b.fontSize = 13;
        b.textColor = '#8493ab';

        b.drawText(
            'WASD MOVE  |  LMB FIRE  |  1-5 WEAPONS  |  R RELOAD  |  SHIFT DASH  |  P PAUSE',
            8, m.h - 25,
            m.w - 16, 24, 'center'
        );

        // Пауза
        if (this.paused) {
            b.fillRect(
                0, m.h / 2 - 70,
                m.w, 140,
                'rgba(5,8,15,0.93)'
            );

            b.fontSize = 38;
            b.textColor = '#25e9ef';

            b.drawText(
                'PAUSED',
                0, m.h / 2 - 42,
                m.w, 54, 'center'
            );

            b.fontSize = 18;
            b.drawText(
                'PRESS P TO CONTINUE',
                0, m.h / 2 + 12,
                m.w, 34, 'center'
            );
        }

        // Экран смерти
        if (this.dead) {
            b.fillRect(
                0, m.h / 2 - 125,
                m.w, 250,
                'rgba(5,8,15,0.95)'
            );

            b.fontSize = 48;
            b.textColor = '#ff327c';

            b.drawText(
                'YOU ARE DEAD',
                0, m.h / 2 - 100,
                m.w, 60, 'center'
            );

            b.fontSize = 22;
            b.textColor = '#ffffff';

            b.drawText(
                'FINAL SCORE: ' + this.score,
                0, m.h / 2 - 24,
                m.w, 38, 'center'
            );

            b.drawText(
                'KILLS: ' + this.kills +
                '     WAVE: ' + this.wave,
                0, m.h / 2 + 16,
                m.w, 35, 'center'
            );

            b.fontSize = 17;
            b.textColor = '#25e9ef';

            b.drawText(
                'R / ENTER - RESTART     ESC - MENU',
                0, m.h / 2 + 73,
                m.w, 32, 'center'
            );
        }
    };

    // ============================================
    // ИНТЕГРАЦИЯ RPG MAKER MV
    // ============================================

    var _titleRows =
        Window_TitleCommand.prototype.numVisibleRows;

    Window_TitleCommand.prototype.numVisibleRows = function() {
        return titleEnabled
            ? Math.max(4, _titleRows.call(this))
            : _titleRows.call(this);
    };

    var _titleMake =
        Window_TitleCommand.prototype.makeCommandList;

    Window_TitleCommand.prototype.makeCommandList = function() {
        _titleMake.call(this);

        if (titleEnabled) {
            this.addCommand(
                'NEON SLAUGHTER',
                'neonSlaughter'
            );
        }
    };

    var _titleCreate =
        Scene_Title.prototype.createCommandWindow;

    Scene_Title.prototype.createCommandWindow = function() {
        _titleCreate.call(this);

        if (titleEnabled) {
            this._commandWindow.setHandler(
                'neonSlaughter',
                function() {
                    this._commandWindow.close();
                    SceneManager.goto(Scene_NeonSlaughter);
                }.bind(this)
            );
        }
    };

    var _pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(
        command, args
    ) {
        _pluginCommand.call(this, command, args);

        if (String(command).toLowerCase() === 'neonstart') {
            SceneManager.goto(Scene_NeonSlaughter);
        }
    };

})();
