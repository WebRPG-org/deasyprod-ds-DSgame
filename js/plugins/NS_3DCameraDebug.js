
/*:
 * @plugindesc v1.0 NEON SLAUGHTER - 3D Camera Debug
 * @author OpenAI
 *
 * @help
 * Диагностика камеры Pixi3D.
 *
 * F7 - переключить режим камеры.
 *
 * Должен находиться ПОСЛЕ NS_3DWorld.
 *
 * ВНИМАНИЕ:
 * Временно изменяет положение первого
 * 3D-объекта и скрывает остальные.
 * Использовать только для диагностики.
 */

(function() {
    'use strict';

    var MODES = [
        'PERSPECTIVE - FRONT',
        'ORTHOGRAPHIC - FRONT',
        'ORTHOGRAPHIC - TOP (-90)',
        'ORTHOGRAPHIC - BOTTOM (+90)',
        'ORTHOGRAPHIC - MAP'
    ];

    function install(scene) {
        if (scene._nsCameraDebugInstalled) return;

        if (!scene._ns3DMeshes ||
            !scene._ns3DMeshes.length ||
            !scene.renderGame) {
            return;
        }

        scene._nsCameraDebugInstalled = true;
        scene._nsDebugMode = 0;

        var info = new Sprite(
            new Bitmap(Graphics.boxWidth, 100)
        );

        scene.addChild(info);
        scene._nsDebugInfo = info;

        // Отладочный прицел
        var marker = new PIXI.Graphics();
        scene.addChild(marker);

        scene._nsDebugMarker = marker;

        scene._nsDebugKey = function(e) {
            // F7
            if (e.keyCode === 118) {
                e.preventDefault();

                scene._nsDebugMode =
                    (scene._nsDebugMode + 1) % MODES.length;

                console.log(
                    '[3D DEBUG] Mode:',
                    MODES[scene._nsDebugMode]
                );
            }
        };

        window.addEventListener(
            'keydown',
            scene._nsDebugKey
        );

        var oldRender = scene.renderGame;

        scene.renderGame = function() {
            oldRender.call(this);

            var camera = PIXI3D.Camera.main;
            var meshes = this._ns3DMeshes;

            if (!camera || !meshes.length) return;

            var mesh = meshes[0];
            var mode = this._nsDebugMode;

            // Временно скрываем остальные объекты
            for (var i = 1; i < meshes.length; i++) {
                meshes[i].visible = false;
            }

            mesh.visible = true;
            mesh.renderable = true;

            // Делаем объект достаточно крупным
            mesh.scale.set(1, 1, 1);

            // Режим 0: обычная перспектива
            if (mode === 0) {
                camera.orthographic = false;
                camera.rotationQuaternion.setEulerAngles(
                    0, 0, 0
                );
                camera.position.set(0, 0, 5);

                mesh.position.set(0, 0, 0);
            }

            // Режим 1: ортографическая камера спереди
            if (mode === 1) {
                camera.orthographic = true;
                camera.orthographicSize = 3;

                camera.rotationQuaternion.setEulerAngles(
                    0, 0, 0
                );

                camera.position.set(0, 0, 5);
                mesh.position.set(0, 0, 0);
            }

            // Режим 2: камера сверху
            if (mode === 2) {
                camera.orthographic = true;
                camera.orthographicSize = 3;

                camera.rotationQuaternion.setEulerAngles(
                    -90, 0, 0
                );

                camera.position.set(0, 8, 0);
                mesh.position.set(0, 0, 0);
            }

            // Режим 3: противоположная ориентация
            if (mode === 3) {
                camera.orthographic = true;
                camera.orthographicSize = 3;

                camera.rotationQuaternion.setEulerAngles(
                    90, 0, 0
                );

                camera.position.set(0, -8, 0);
                mesh.position.set(0, 0, 0);
            }

            // Режим 4: координаты нашей карты
            if (mode === 4) {
                camera.orthographic = true;
                camera.orthographicSize = 3;

                camera.rotationQuaternion.setEulerAngles(
                    -90, 0, 0
                );

                var cx =
                    (this._nsCameraX || 0) + 480;

                var cy =
                    (this._nsCameraY || 0) + 300;

                camera.position.set(
                    cx / 100,
                    12,
                    cy / 100
                );

                mesh.position.set(
                    cx / 100,
                    0,
                    cy / 100
                );
            }

            // Информация на экране
            var b = this._nsDebugInfo.bitmap;

            if (b.width !== Graphics.boxWidth) {
                this._nsDebugInfo.bitmap =
                    b = new Bitmap(Graphics.boxWidth, 100);
            }

            b.clear();

            b.fillRect(
                0, 0,
                Graphics.boxWidth,
                83,
                'rgba(0,0,0,0.85)'
            );

            b.fontFace = 'GameFont';
            b.fontSize = 21;
            b.textColor = '#55ff88';

            b.drawText(
                '3D CAMERA DEBUG',
                12, 4,
                Graphics.boxWidth - 24,
                30,
                'left'
            );

            b.fontSize = 18;
            b.textColor = '#ffffff';

            b.drawText(
                'MODE ' + mode + ': ' + MODES[mode],
                12, 31,
                Graphics.boxWidth - 24,
                27,
                'left'
            );

            b.fontSize = 15;
            b.textColor = '#ffff88';

            b.drawText(
                'PRESS F7 TO SWITCH CAMERA',
                12, 57,
                Graphics.boxWidth - 24,
                24,
                'left'
            );

            // Отмечаем центр экрана
            var g = this._nsDebugMarker;

            g.clear();

            var mx = Graphics.boxWidth / 2;
            var my = Graphics.boxHeight / 2;

            g.lineStyle(2, 0xffea00, 0.9);

            g.moveTo(mx - 20, my);
            g.lineTo(mx + 20, my);

            g.moveTo(mx, my - 20);
            g.lineTo(mx, my + 20);

            g.drawCircle(mx, my, 25);
        };

        var oldTerminate = scene.terminate;

        scene.terminate = function() {
            window.removeEventListener(
                'keydown',
                this._nsDebugKey
            );

            oldTerminate.call(this);
        };

        console.log('[3D DEBUG] Initialized');
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
