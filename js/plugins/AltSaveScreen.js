
/*:
 * @plugindesc v1.0 NEON SLAUGHTER - Animated Sprite System
 * @author OpenAI
 *
 * @help
 * Анимация персонажей через PIXI.Sprite.
 *
 * Требуется:
 * img/pictures/BomzhSheet.png
 *
 * Спрайт-лист:
 * 3 столбца, 4 ряда.
 *
 * Ряд 0 - вниз
 * Ряд 1 - влево
 * Ряд 2 - вправо
 * Ряд 3 - вверх
 *
 * Подключать ПОСЛЕ всех остальных NS-плагинов.
 */

(function() {
    'use strict';
// Пиксельная фильтрация по умолчанию
if (PIXI.BaseTexture && PIXI.BaseTexture.defaultOptions) {
    PIXI.BaseTexture.defaultOptions.scaleMode =
        PIXI.SCALE_MODES.NEAREST;
}
    var SHEET = 'img/pictures/BomzhSheet.png';

    var COLS = 3;
    var ROWS = 4;

    var SPRITE_SCALE = 0.9;
    var ANIMATION_SPEED = 0.18;

    var BACKGROUND = {
        r: 238,
        g: 243,
        b: 250,
        tolerance: 24
    };

    // Цветовые варианты противников
    var VARIANTS = [
        {
            hair: [50, 52, 55],
            band: [148, 215, 226]
        },
        {
            hair: [113, 70, 45],
            band: [80, 115, 190]
        },
        {
            hair: [171, 77, 35],
            band: [80, 175, 85]
        },
        {
            hair: [39, 41, 51],
            band: [163, 100, 185]
        },
        {
            hair: [115, 109, 103],
            band: [175, 66, 71]
        }
    ];

    function within(v, target, tolerance) {
        return Math.abs(v - target) <= tolerance;
    }

    function removeBackground(data) {
        var d = data.data;

        for (var i = 0; i < d.length; i += 4) {
            var r = d[i];
            var g = d[i + 1];
            var b = d[i + 2];

            if (
                within(r, BACKGROUND.r, BACKGROUND.tolerance) &&
                within(g, BACKGROUND.g, BACKGROUND.tolerance) &&
                within(b, BACKGROUND.b, BACKGROUND.tolerance)
            ) {
                d[i + 3] = 0;
            }
        }
    }

    function recolor(data, variantIndex) {
        if (variantIndex === 0) return;

        var v = VARIANTS[variantIndex] || VARIANTS[0];
        var d = data.data;

        for (var i = 0; i < d.length; i += 4) {
            if (d[i + 3] === 0) continue;

            var r = d[i];
            var g = d[i + 1];
            var b = d[i + 2];

            // Тёмные нейтральные цвета волос
            var max = Math.max(r, g, b);
            var min = Math.min(r, g, b);

            if (
                max < 110 &&
                max - min < 30 &&
                max > 28
            ) {
                var brightness = max / 75;

                d[i] = Math.min(255, v.hair[0] * brightness);
                d[i + 1] = Math.min(255, v.hair[1] * brightness);
                d[i + 2] = Math.min(255, v.hair[2] * brightness);
            }

            // Голубая повязка
            if (
                b > r + 18 &&
                g > r + 15 &&
                g > 100 &&
                b > 120
            ) {
                d[i] = v.band[0];
                d[i + 1] = v.band[1];
                d[i + 2] = v.band[2];
            }
        }
    }

    function createFrames(image, variantIndex) {
        var frames = [];

        for (var row = 0; row < ROWS; row++) {
            frames[row] = [];

            for (var col = 0; col < COLS; col++) {
                // Исходный размер не делится нацело:
                // 160/3 и 238/4.
                // Поэтому определяем границы округлением.
                var left = Math.round(
                    image.width * col / COLS
                );

                var right = Math.round(
                    image.width * (col + 1) / COLS
                );

                var top = Math.round(
                    image.height * row / ROWS
                );

                var bottom = Math.round(
                    image.height * (row + 1) / ROWS
                );

                var width = right - left;
                var height = bottom - top;

                var canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                var ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = false;

                ctx.drawImage(
                    image,
                    left, top,
                    width, height,
                    0, 0,
                    width, height
                );

                var pixels = ctx.getImageData(
                    0, 0, width, height
                );

                removeBackground(pixels);
                recolor(pixels, variantIndex);

                ctx.putImageData(pixels, 0, 0);

var texture = PIXI.Texture.from(canvas, {
    scaleMode: PIXI.SCALE_MODES.NEAREST
});

                frames[row][col] = texture;
            }
        }

        return frames;
    }

    function getDirection(angle) {
        var dx = Math.cos(angle);
        var dy = Math.sin(angle);

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 2 : 1;
        }

        return dy > 0 ? 0 : 3;
    }

    function createSprite(frames) {
        var sprite = new PIXI.Sprite(frames[0][1]);

        sprite.anchor.set(0.5, 0.82);
        sprite.scale.set(SPRITE_SCALE, SPRITE_SCALE);

        return sprite;
    }

    function updateSprite(sprite, entity, frames, scene) {
        sprite.x = Math.round(entity.x);
        sprite.y = Math.round(entity.y);

        var direction = getDirection(entity.angle || 0);

        // Используем значение walk из основного движка.
        var walk = entity.walk || 0;

        var frame = Math.floor(
            walk / ANIMATION_SPEED
        ) % COLS;

        if (frame < 0) frame += COLS;

        sprite.texture = frames[direction][frame];

        // Вспышка при попадании
        var damaged = entity === scene.player
            ? entity.inv > 0 &&
              Math.floor(entity.inv / 4) % 2 === 0
            : entity.hit > 0;

        sprite.tint = damaged ? 0xffaaaa : 0xffffff;
        sprite.visible = !entity.dead;
    }

    // ==========================================
    // УСТАНОВКА
    // ==========================================

    function install(scene) {
        if (scene._spriteSystemInstalled) return;

        if (
            !scene.world ||
            !scene.player ||
            !scene.drawCharacter ||
            !scene.renderGame
        ) {
            return;
        }

        scene._spriteSystemInstalled = true;
        scene._spriteSystemReady = false;

        var layer = new PIXI.Container();

        scene.world.addChild(layer);
        scene._spriteLayer = layer;

        scene._spriteFrames = [];
        scene._enemySprites = [];
        scene._playerSprite = null;

        var image = new Image();

        image.onload = function() {
            // Не обновляем уже закрытую сцену
            if (!scene._spriteLayer ||
                scene._spriteLayer.destroyed) {
                return;
            }

            for (var i = 0; i < VARIANTS.length; i++) {
                scene._spriteFrames[i] = createFrames(image, i);
            }

            scene._playerSprite = createSprite(
                scene._spriteFrames[0]
            );

            layer.addChild(scene._playerSprite);

            // Теперь персонажи рисуются спрайтами
            // вместо старых прямоугольников.
            scene.drawCharacter = function() {};

            scene._spriteSystemReady = true;
        };

        image.onerror = function() {
            console.error(
                '[NS_SpriteSystem] Не найден файл: ' + SHEET
            );
        };

        image.src = SHEET;

        var oldRender = scene.renderGame;

        scene.renderGame = function() {
            oldRender.call(this);

            if (!this._spriteSystemReady) return;

            updateSprite(
                this._playerSprite,
                this.player,
                this._spriteFrames[0],
                this
            );

            this._playerSprite.visible = !this.dead;

            // Удаляем спрайты исчезнувших врагов
            for (var j = this._enemySprites.length - 1; j >= 0; j--) {
                var entry = this._enemySprites[j];

                if (
                    entry.entity.dead ||
                    this.enemies.indexOf(entry.entity) < 0
                ) {
                    layer.removeChild(entry.sprite);
                    entry.sprite.destroy();
                    this._enemySprites.splice(j, 1);
                }
            }

            // Создаём спрайты для новых противников
            for (var k = 0; k < this.enemies.length; k++) {
                var enemy = this.enemies[k];
                var found = null;

                for (var n = 0; n < this._enemySprites.length; n++) {
                    if (this._enemySprites[n].entity === enemy) {
                        found = this._enemySprites[n];
                        break;
                    }
                }

                if (!found) {
                    var variant = Math.min(
                        4, (enemy.type || 0) + 1
                    );

                    var spr = createSprite(
                        this._spriteFrames[variant]
                    );

                    layer.addChild(spr);

                    found = {
                        entity: enemy,
                        sprite: spr,
                        variant: variant
                    };

                    this._enemySprites.push(found);
                }

                updateSprite(
                    found.sprite,
                    enemy,
                    this._spriteFrames[found.variant],
                    this
                );
            }
        };
    }

    var _baseUpdate = Scene_Base.prototype.update;

    Scene_Base.prototype.update = function() {
        _baseUpdate.call(this);

        if (
            this.constructor &&
            this.constructor.name === 'Scene_NeonSlaughter'
        ) {
            install(this);
        }
    };

})();
