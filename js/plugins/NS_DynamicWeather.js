
/*:
 * @plugindesc v1.0 NEON SLAUGHTER - Dynamic 3D Weather
 * @author OpenAI
 *
 * @help
 * Динамическая погода с 3D-частицами Pixi3D.
 *
 * Требуется:
 * PIXI.js 7.4.3
 * Pixi3D
 * NeonSlaughter
 *
 * Режимы:
 * clear - ясно
 * rain  - дождь
 * storm - гроза
 * fog   - туман
 * snow  - снег
 * auto  - автоматическая смена
 *
 * Команды плагина:
 *
 * NSWeather auto
 * NSWeather clear
 * NSWeather rain
 * NSWeather storm
 * NSWeather fog
 * NSWeather snow
 *
 * Подключать после остальных NS-плагинов.
 */

(function() {
    'use strict';

    var NAME = 'NS_DynamicWeather';

    var CONFIG = {
        // Максимальное количество 3D-частиц
        particleCount: 60,

        // Продолжительность одного состояния
        minDuration: 900,
        maxDuration: 1800,

        // Скорость перехода между состояниями
        transitionSpeed: 0.015,

        // Порывы ветра
        windSpeed: 0.018,

        // Интенсивность грозы
        lightningChance: 0.006,

        // Прозрачность тумана
        fogAlpha: 0.14,

        // Показывать название погоды при смене
        showNotification: true
    };

    var MODES = [
        'clear',
        'rain',
        'storm',
        'fog',
        'snow'
    ];

    var LABELS = {
        clear: 'CLEAR WEATHER',
        rain: 'RAIN',
        storm: 'THUNDERSTORM',
        fog: 'FOG',
        snow: 'SNOW'
    };

    var COLORS = {
        rain: '#8bc9e8',
        snow: '#ffffff'
    };

    // Режим, установленный командой события
    var requestedMode = 'auto';

    function random(a, b) {
        return a + Math.random() * (b - a);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function log(text) {
        console.log('[' + NAME + '] ' + text);
    }

    // ============================================
    // СОЗДАНИЕ 3D-ЧАСТИЦ
    // ============================================

    function createParticle(scene) {
        var mesh = PIXI3D.Mesh3D.createCube();

        mesh.material.baseColor =
            PIXI3D.Color.fromHex(COLORS.rain);

        mesh.scale.set(
            0.018,
            0.20,
            0.018
        );

        mesh.position.set(
            random(-4, 4),
            random(-3, 3),
            random(-0.7, 0.7)
        );

        mesh.visible = false;

        // Добавляем 3D-частицы непосредственно в сцену
        var index = scene.getChildIndex(scene.world) + 1;

        scene.addChildAt(mesh, index);

        return {
            mesh: mesh,
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            speed: random(0.045, 0.095),
            drift: random(-0.006, 0.006),
            phase: random(0, Math.PI * 2)
        };
    }

    function configureParticle(p, mode) {
        if (mode === 'snow') {
            p.mesh.material.baseColor =
                PIXI3D.Color.fromHex(COLORS.snow);

            p.mesh.scale.set(
                0.045,
                0.045,
                0.045
            );

            p.speed = random(0.008, 0.025);
        } else {
            p.mesh.material.baseColor =
                PIXI3D.Color.fromHex(COLORS.rain);

            p.mesh.scale.set(
                0.018,
                mode === 'storm' ? 0.29 : 0.19,
                0.018
            );

            p.speed = mode === 'storm'
                ? random(0.10, 0.17)
                : random(0.055, 0.095);
        }
    }

    // ============================================
    // ПЕРЕКЛЮЧЕНИЕ ПОГОДЫ
    // ============================================

    function setWeather(scene, mode) {
        if (MODES.indexOf(mode) < 0) {
            mode = 'clear';
        }

        scene._weatherMode = mode;
        scene._weatherAge = 0;

        scene._weatherDuration = Math.floor(
            random(
                CONFIG.minDuration,
                CONFIG.maxDuration
            )
        );

        scene._weatherWindTarget = random(-1, 1);

        for (var i = 0; i < scene._weatherParticles.length; i++) {
            configureParticle(
                scene._weatherParticles[i],
                mode
            );
        }

        if (CONFIG.showNotification && scene.addText) {
            scene.addText(
                scene.player.x,
                scene.player.y - 55,
                LABELS[mode],
                mode === 'storm' ? 0xffdd66 : 0xaaddff,
                100
            );
        }

        log('Weather changed: ' + mode);
    }

    function chooseNextWeather(scene) {
        // Не выбираем одно и то же состояние дважды
        var choices = MODES.filter(function(m) {
            return m !== scene._weatherMode;
        });

        var index = Math.floor(
            Math.random() * choices.length
        );

        return choices[index];
    }

    // ============================================
    // ОБНОВЛЕНИЕ ПОГОДЫ
    // ============================================

    function updateWeather(scene) {
        if (!scene._weatherReady) return;

        if (scene.paused) return;

        scene._weatherFrame++;
        scene._weatherAge++;

        // Автоматическая смена
        if (requestedMode === 'auto') {
            if (scene._weatherAge >= scene._weatherDuration) {
                setWeather(scene, chooseNextWeather(scene));
            }
        } else if (scene._weatherMode !== requestedMode) {
            setWeather(scene, requestedMode);
        }

        var mode = scene._weatherMode;
        var active =
            mode === 'rain' ||
            mode === 'storm' ||
            mode === 'snow';

        // Плавное изменение интенсивности
        var desired = active ? 1 : 0;

        scene._weatherIntensity +=
            (desired - scene._weatherIntensity) *
            CONFIG.transitionSpeed;

        if (Math.abs(
            desired - scene._weatherIntensity
        ) < 0.001) {
            scene._weatherIntensity = desired;
        }

        // Ветер
        scene._weatherWind +=
            (scene._weatherWindTarget - scene._weatherWind) *
            0.002;

        var wind =
            scene._weatherWind * CONFIG.windSpeed;

        // Небольшая естественная пульсация ветра
        wind += Math.sin(
            scene._weatherFrame * 0.008
        ) * 0.005;

        // ========================================
        // ДВИЖЕНИЕ 3D-ЧАСТИЦ
        // ========================================

        for (var i = 0; i < scene._weatherParticles.length; i++) {
            var p = scene._weatherParticles[i];

            p.mesh.visible =
                active &&
                scene._weatherIntensity > 0.03;

            if (!p.mesh.visible) continue;

            // Падение
            p.y -= p.speed;

            // Ветер
            p.x += wind + p.drift;

            // Снег дополнительно колеблется
            if (mode === 'snow') {
                p.x += Math.sin(
                    scene._weatherFrame * 0.025 +
                    p.phase
                ) * 0.008;
            }

            // Зацикливание частиц
            if (p.y < -3.3) {
                p.y = 3.3;
                p.x = random(-4, 4);
                p.z = random(-0.7, 0.7);
            }

            if (p.x < -4.5) p.x = 4.5;
            if (p.x > 4.5) p.x = -4.5;

            p.mesh.position.set(
                p.x,
                p.y,
                p.z
            );

            p.mesh.alpha = scene._weatherIntensity;
        }

        // ========================================
        // МОЛНИИ
        // ========================================

        if (mode === 'storm' &&
            Math.random() < CONFIG.lightningChance) {

            scene._weatherLightning = random(5, 10);
        }

        if (scene._weatherLightning > 0) {
            scene._weatherLightning--;
        }

        drawAtmosphere(scene);
    }

    // ============================================
    // ТУМАН И ЗАТЕМНЕНИЕ
    // ============================================

    function drawAtmosphere(scene) {
        var g = scene._weatherOverlay;

        if (!g) return;

        g.clear();

        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        var mode = scene._weatherMode;

        // Затемнение во время дождя
        if (mode === 'rain' || mode === 'storm') {
            g.beginFill(
                0x17263d,
                mode === 'storm' ? 0.22 : 0.10
            );

            g.drawRect(0, 0, w, h);
            g.endFill();
        }

        // Движущиеся слои тумана
        if (mode === 'fog') {
            var time = scene._weatherFrame;

            g.beginFill(0xb5c6be, CONFIG.fogAlpha);
            g.drawRect(0, 0, w, h);
            g.endFill();

            for (var i = 0; i < 5; i++) {
                var offset =
                    (time * (0.12 + i * 0.035)) %
                    (w + 450);

                var x = offset - 450;
                var y = h * (i + 0.5) / 5;

                g.beginFill(
                    0xdde8dc,
                    0.025 + i * 0.006
                );

                g.drawEllipse(
                    x + 180,
                    y,
                    230,
                    85
                );

                g.endFill();
            }
        }

        // Вспышка молнии
        if (scene._weatherLightning > 0) {
            var alpha =
                scene._weatherLightning / 10 * 0.65;

            g.beginFill(0xf1f5ff, alpha);
            g.drawRect(0, 0, w, h);
            g.endFill();
        }
    }

    // ============================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================

    function install(scene) {
        if (scene._dynamicWeatherInstalled) return;

        if (!scene.world ||
            !scene.player ||
            !scene.renderGame) {
            return;
        }

        scene._dynamicWeatherInstalled = true;

        if (typeof PIXI3D === 'undefined') {
            console.error(
                '[NS_DynamicWeather] Pixi3D missing!'
            );
            return;
        }

        scene._weatherParticles = [];
        scene._weatherMode = 'clear';
        scene._weatherIntensity = 0;
        scene._weatherWind = 0;
        scene._weatherWindTarget = 0;

        scene._weatherFrame = 0;
        scene._weatherAge = 0;
        scene._weatherDuration = 300;
        scene._weatherLightning = 0;
        scene._weatherReady = false;

        try {
            // Используем стандартную 3D-камеру.
            // Не меняем её положение или проекцию.

            // Свет для 3D-частиц
            var light = new PIXI3D.Light();

            light.position.set(-1, 0, 3);

            PIXI3D.LightingEnvironment.main.lights.push(light);

            scene._weatherLight = light;

            // Создаём пул частиц один раз
            for (var i = 0; i < CONFIG.particleCount; i++) {
                scene._weatherParticles.push(
                    createParticle(scene)
                );
            }

            // Слой атмосферных эффектов.
            // Размещаем ниже HUD.
            var overlay = new PIXI.Graphics();

            var hudIndex = scene.getChildIndex(scene.hud);

            scene.addChildAt(overlay, hudIndex);

            scene._weatherOverlay = overlay;

            scene._weatherReady = true;

            if (requestedMode === 'auto') {
                setWeather(scene, 'clear');
                scene._weatherDuration = 180;
            } else {
                setWeather(scene, requestedMode);
            }

            log('Dynamic 3D weather initialized');

        } catch (error) {
            console.error(
                '[NS_DynamicWeather] Initialization error:',
                error
            );

            return;
        }

        // ========================================
        // ОБНОВЛЕНИЕ
        // ========================================

        var oldRender = scene.renderGame;

        scene.renderGame = function() {
            oldRender.call(this);
            updateWeather(this);
        };

        // ========================================
        // ОЧИСТКА
        // ========================================

        var oldTerminate = scene.terminate;

        scene.terminate = function() {
            var lights =
                PIXI3D.LightingEnvironment.main.lights;

            var index = lights.indexOf(this._weatherLight);

            if (index >= 0) {
                lights.splice(index, 1);
            }

            for (var i = 0; i < this._weatherParticles.length; i++) {
                var mesh = this._weatherParticles[i].mesh;

                if (mesh.parent) {
                    mesh.parent.removeChild(mesh);
                }

                mesh.destroy();
            }

            this._weatherParticles = [];

            if (this._weatherOverlay) {
                if (this._weatherOverlay.parent) {
                    this._weatherOverlay.parent.removeChild(
                        this._weatherOverlay
                    );
                }

                this._weatherOverlay.destroy();
            }

            oldTerminate.call(this);
        };
    }

    // ============================================
    // КОМАНДЫ ПЛАГИНА
    // ============================================

    var _pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(
        command, args
    ) {
        _pluginCommand.call(this, command, args);

        if (String(command).toLowerCase() === 'nsweather') {
            var mode = String(args[0] || 'auto').toLowerCase();

            if (mode === 'auto' ||
                MODES.indexOf(mode) >= 0) {

                requestedMode = mode;

                log('Requested weather: ' + mode);
            }
        }
    };

    // ============================================
    // ПОДКЛЮЧЕНИЕ К СЦЕНЕ
    // ============================================

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
