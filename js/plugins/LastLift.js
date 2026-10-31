/*:
 * @plugindesc Последний лифт — mobile-first RPG Maker MV episode.
 * @author DSgame
 * @help Load after LastLiftStory. Starts a dedicated MV scene at boot.
 * Progress is stored separately from MV saves in local browser storage.
 */
(function() {
    'use strict';
    var Story = window.LastLiftStory;
    var W = 480, H = 900, SAVE = 'dsgame.last-lift.episode-1.v1';
    var C = { bg: 0x111813, panel: 0x1b251e, line: 0x344135, ink: 0xe7e6d3,
        muted: 0xa0ad96, dim: 0x687763, gold: 0xe2b878, green: 0xc1d2a5, dark: 0x111a14 };
    var COLORS = { snow: '#9ab9bb', bureau: '#bc9167', garden: '#98b698', mirror: '#7d9caa', home: '#dab16b', cabin: '#c1cfa8' };

    SceneManager._screenWidth = SceneManager._boxWidth = W;
    SceneManager._screenHeight = SceneManager._boxHeight = H;
    // Portrait is letterboxed safely in landscape and on desktop as well.
    Graphics._defaultStretchMode = function() { return true; };
    Graphics._updateRealScale = function() {
        var css = getComputedStyle(document.body);
        var horizontal = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight);
        var vertical = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom);
        this._realScale = Math.min((window.innerWidth - horizontal) / this._width, (window.innerHeight - vertical) / this._height);
    };
    Graphics._centerElement = function(element) {
        var css = getComputedStyle(document.body);
        var left = parseFloat(css.paddingLeft), top = parseFloat(css.paddingTop);
        var width = element.width * this._realScale, height = element.height * this._realScale;
        element.style.cssText += ';position:absolute;margin:0;right:auto;bottom:auto;';
        element.style.left = (left + (window.innerWidth - left - parseFloat(css.paddingRight) - width) / 2) + 'px';
        element.style.top = (top + (window.innerHeight - top - parseFloat(css.paddingBottom) - height) / 2) + 'px';
        element.style.width = width + 'px'; element.style.height = height + 'px';
    };

    function readSave() {
        try { return Story.restore(JSON.parse(localStorage.getItem(SAVE))); }
        catch (e) { return null; }
    }
    function rect(g, x, y, w, h, color, alpha) {
        g.beginFill(color, alpha === undefined ? 1 : alpha).drawRect(x, y, w, h).endFill();
    }
    function rounded(g, x, y, w, h, color, radius) {
        g.beginFill(color).drawRoundedRect(x, y, w, h, radius || 12).endFill();
    }

    // Original low-resolution illustrations. No remote resources or asset build.
    function illustration(kind, state, title) {
        var canvas = document.createElement('canvas');
        canvas.width = 216; canvas.height = 138;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        var seed = 17;
        function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
        function r(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
        function line(x, y, x2, y2, color) {
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
        }
        function person(x, y, coat, small) {
            var h = small ? 19 : 26;
            r(x - 2, y - h - 7, 7, 8, '#262a24'); r(x - 1, y - h - 5, 5, 6, '#c5ad88');
            r(x - 3, y - h, 10, h - 6, coat); r(x - 5, y - h + 4, 3, 11, coat);
            r(x + 7, y - h + 4, 3, 12, coat); r(x - 2, y - 6, 3, 7, '#222b27'); r(x + 4, y - 6, 3, 7, '#222b27');
            r(x - 3, y - 1, 5, 2, '#101916'); r(x + 4, y - 1, 5, 2, '#101916');
            r(x - 3, y - h + 1, 10, 2, '#c49863');
        }
        function suitcase(x, y) { r(x, y, 13, 10, '#664c35'); r(x + 1, y + 1, 11, 7, '#9b754e'); r(x + 3, y - 2, 6, 2, '#3b3528'); r(x + 3, y + 1, 1, 8, '#c4a678'); }
        function floor(color) {
            r(0, 104, 216, 34, color);
            for (var i = 0; i < 8; i++) line(108, 83, (i - 2) * 53, 138, '#30443a');
            for (var j = 0; j < 4; j++) line(0, 108 + j * j * 2, 216, 108 + j * j * 2, '#30443a');
        }
        r(0, 0, 216, 138, '#1c3029');
        if (kind === 'cabin') {
            r(0, 0, 216, 138, '#1b2b23'); floor('#384338');
            r(23, 5, 166, 124, '#62694f'); r(28, 9, 156, 112, '#293e30');
            r(35, 14, 140, 82, '#51604a'); r(40, 17, 130, 74, '#4b5b45');
            for (var p = 0; p < 12; p++) r(41 + p * 11, 17, 1, 74, '#42543e');
            r(35, 91, 140, 4, '#c2b381'); r(36, 95, 138, 4, '#172e24');
            r(39, 98, 133, 22, '#4a4d3c');
            for (var t = 0; t < 7; t++) line(107, 91, 30 + t * 26, 126, '#343e30');
            r(80, 13, 53, 5, '#8e8963'); r(85, 15, 43, 2, '#eee0ab');
            r(45, 34, 22, 26, '#293c30'); r(47, 36, 18, 22, '#b5bc92');
            r(50, 40, 12, 1, '#5b7155'); r(50, 44, 10, 1, '#5b7155'); r(50, 48, 8, 1, '#5b7155');
            r(49, 82, 35, 6, '#9f8657'); r(52, 88, 3, 17, '#363f2e'); r(77, 88, 3, 17, '#363f2e');
            if (state.flags.upgraded) { r(46, 64, 44, 3, '#b3a878'); for (var n = 0; n < 8; n++) line(47 + n * 6, 66, 51 + n * 5, 75, '#697954'); }
            if (state.girl || title) { person(125, 109, '#99604a', true); suitcase(137, 101); }
            if (state.flower) { r(76, 75, 2, 7, '#7f996c'); r(73, 71, 7, 5, '#e4db9e'); }
            r(10, 0, 18, 138, '#263c30'); r(187, 0, 20, 138, '#263c30');
            r(16, 0, 4, 138, '#6b7456'); r(190, 0, 4, 138, '#7a7c59');
            r(193, 46, 10, 33, '#1d3026');
            for (var b = 0; b < 5; b++) r(196, 49 + b * 5, 3, 2, b === 3 ? '#e1bd77' : '#859571');
            r(83, 0, 46, 11, '#111d18');
            ctx.font = '8px monospace'; ctx.fillStyle = '#e3b76d'; ctx.fillText(title ? '108' : String(state.floor).padStart(2, '0'), 99, 8);
            if (title) { r(28, 13, 29, 111, '#5c6951'); r(157, 13, 30, 111, '#4a5d48'); r(56, 13, 2, 111, '#a3a67a'); r(156, 13, 2, 111, '#a3a67a'); }
            r(0, 129, 216, 9, '#15251c'); r(27, 128, 161, 2, '#88916a');
        } else if (kind === 'snow') {
            r(0, 0, 216, 108, '#405452'); floor('#5b6c64');
            for (var w = 0; w < 3; w++) {
                r(18 + w * 73, 10, 36, 59, '#233d3e'); r(21 + w * 73, 13, 30, 53, '#799597');
                r(36 + w * 73, 13, 2, 53, '#334e4d'); r(21 + w * 73, 39, 30, 2, '#334e4d');
            }
            r(17, 82, 48, 7, '#776c4e'); r(20, 89, 3, 22, '#2c3d32'); r(58, 89, 3, 22, '#2c3d32');
            r(24, 77, 14, 6, '#d4ccb0'); line(24, 77, 31, 81, '#847b61');
            r(179, 76, 19, 31, '#233d35'); r(183, 82, 4, 3, '#d9b96d');
            for (var s = 0; s < 28; s++) r(rnd() * 216, 110 + rnd() * 27, 4 + rnd() * 12, 1, '#a7b8aa');
            if (!state.girl) { person(127, 117, '#9b6150', true); suitcase(139, 109); }
        } else if (kind === 'bureau') {
            r(0, 0, 216, 106, '#3a3b2d'); floor('#4a4933');
            for (var sy = 0; sy < 4; sy++) for (var sx = 0; sx < 8; sx++) {
                var xx = 7 + sx * 26, yy = 8 + sy * 22;
                r(xx, yy, 22, 19, '#575342'); r(xx + 2, yy + 2, 18, 14, rnd() > 0.5 ? '#827454' : '#69634d');
                r(xx + 8, yy + 8, 7, 3, '#b5ab82'); r(xx + 10, yy + 12, 3, 1, '#292e25');
            }
            person(132, 99, '#6d7860', false); r(47, 85, 126, 16, '#8e7750'); r(51, 101, 118, 28, '#544b34');
            r(52, 104, 116, 2, '#a68a58'); r(67, 78, 29, 8, '#28382b'); r(72, 72, 19, 8, '#cec19a');
            r(116, 82, 7, 3, '#e2c283'); r(123, 81, 4, 5, '#e2c283');
            r(18, 2, 2, 43, '#272d25'); r(5, 40, 30, 4, '#b4a06b'); r(10, 44, 20, 2, '#e7d29c');
        } else if (kind === 'garden') {
            r(0, 0, 216, 138, '#1e382e'); floor('#2a4130');
            for (var gy = 0; gy < 3; gy++) for (var gx = 0; gx < 7; gx++) {
                r(gx * 34, gy * 36, 32, 34, '#324b3b'); r(gx * 34 + 2, gy * 36 + 2, 28, 30, '#415c43');
            }
            for (var l = 0; l < 38; l++) {
                var lx = rnd() * 216, ly = 70 + rnd() * 65;
                r(lx, ly, 2, 24, '#476846'); r(lx - 5, ly + 3, 6, 3, '#668354'); r(lx + 1, ly + 9, 7, 3, '#78915c');
            }
            r(88, 106, 42, 19, '#736345'); r(84, 102, 50, 6, '#a38b5c'); r(106, 74, 2, 30, '#8caa6d');
            r(99, 70, 16, 8, '#d6d7a6'); r(104, 66, 6, 16, '#e9e0ac'); r(105, 72, 4, 4, '#c5aa64');
            r(107, 0, 1, 22, '#161f1a'); r(91, 22, 34, 6, '#79805c'); r(95, 28, 26, 2, state.flags.garden && !state.flower ? '#525d45' : '#eee2a7');
            r(179, 19, 6, 83, '#789073'); r(175, 30, 14, 5, '#506a4e');
        } else if (kind === 'mirror') {
            r(0, 0, 216, 138, '#25383b'); floor('#3b4a47');
            [9, 119].forEach(function(mx) {
                r(mx, 10, 88, 112, '#718075'); r(mx + 5, 14, 78, 103, '#293e3d'); r(mx + 9, 19, 70, 94, '#3f5652');
                r(mx + 12, 65, 64, 3, '#a6a887'); r(mx + 35, 3, 22, 9, '#122528');
                r(mx + 41, 5, 10, 3, '#b5c5a4');
            });
            person(160, 111, '#73827b', false); r(105, 0, 6, 138, '#91a29a');
            for (var f = 0; f < 14; f++) line(128 + f * 5, 20, 119 + f * 5, 112, 'rgba(157,188,177,.1)');
        } else if (kind === 'home') {
            r(0, 0, 216, 138, '#4e4935'); floor('#65583c');
            r(76, 6, 79, 108, '#b3a479'); r(82, 12, 67, 99, '#81724e'); r(139, 67, 3, 3, '#d4ba77');
            r(14, 19, 43, 51, '#263c37'); r(18, 23, 35, 43, '#c1b77f'); r(34, 23, 3, 43, '#6d6a4d');
            r(0, 104, 68, 9, '#99845a'); r(15, 113, 4, 25, '#342f23'); r(58, 113, 4, 25, '#342f23');
            r(31, 97, 8, 7, '#d3c49a'); r(39, 99, 3, 3, '#b6a276');
            person(111, 115, '#383f32', false); r(99, 76, 12, 5, '#b9a783');
        }
        // Deterministic grain and vignette preserve the handmade, quiet palette.
        for (var grain = 0; grain < 650; grain++) r(rnd() * 216, rnd() * 138, 1, 1, rnd() > 0.5 ? 'rgba(225,231,196,.055)' : 'rgba(0,0,0,.09)');
        var glow = ctx.createRadialGradient(108, 40, 15, 108, 65, 145);
        glow.addColorStop(0, 'rgba(226,207,139,.06)'); glow.addColorStop(1, 'rgba(3,12,8,.58)');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, 216, 138);
        var texture = PIXI.Texture.from(canvas);
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        return texture;
    }

    var Audio = {
        enabled: false, context: null, voices: [],
        toggle: function() { this.enabled = !this.enabled; this.sync(); return this.enabled; },
        sync: function() {
            if (!this.enabled || document.hidden) {
                this.voices.forEach(function(v) { v.stop(); v.disconnect(); }); this.voices = [];
                return;
            }
            if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.context.resume().catch(function() {});
            if (this.voices.length) return;
            var self = this;
            [55, 82.4069, 110.15].forEach(function(f) {
                var voice = self.context.createOscillator(), gain = self.context.createGain();
                voice.type = 'sine'; voice.frequency.value = f; gain.gain.value = 0.013;
                voice.connect(gain); gain.connect(self.context.destination); voice.start(); self.voices.push(voice);
                voice.onended = function() { gain.disconnect(); };
            });
        },
        ding: function() {
            if (!this.enabled || !this.context) return;
            var ctx = this.context, v = ctx.createOscillator(), g = ctx.createGain();
            v.type = 'sine'; v.frequency.value = 659.25; g.gain.setValueAtTime(0.06, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
            v.connect(g); g.connect(ctx.destination); v.start(); v.stop(ctx.currentTime + 0.7);
            v.onended = function() { v.disconnect(); g.disconnect(); };
        }
    };

    function Scene_LastLift() { this.initialize.apply(this, arguments); }
    Scene_LastLift.prototype = Object.create(Scene_Base.prototype);
    Scene_LastLift.prototype.constructor = Scene_LastLift;
    Scene_LastLift.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this.state = readSave(); this._title = true; this._confirm = false;
        this._frame = 0; this._travel = 0; this._buttons = []; this._artCache = {};
        this._journalPage = 0; this._saveError = false;
    };
    Scene_LastLift.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._ui = new PIXI.Container(); this.addChild(this._ui);
        this._effects = new PIXI.Graphics(); this.addChild(this._effects);
        this.createAccessibility(); this.refresh();
    };
    Scene_LastLift.prototype.createAccessibility = function() {
        var self = this;
        this._controls = document.createElement('div'); this._controls.id = 'last-lift-controls';
        this._controls.setAttribute('role', 'group'); this._controls.setAttribute('aria-label', 'Последний лифт — управление');
        this._controls.style.cssText = 'position:fixed;z-index:20;pointer-events:none;';
        // MV cancels native touch clicks at document level. Keep accessible HTML
        // controls out of that handler, while preserving the browser's click.
        ['touchstart', 'touchmove', 'touchend'].forEach(function(type) {
            self._controls.addEventListener(type, function(e) { e.stopPropagation(); }, { passive: true });
        });
        document.body.appendChild(this._controls);
        this._live = document.createElement('div'); this._live.setAttribute('aria-live', 'polite');
        this._live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';
        document.body.appendChild(this._live);
        this._onResize = function() { self.positionControls(); };
        this._onVisibility = function() { Audio.sync(); };
        this._onKey = function(e) {
            if (e.repeat || self._travel) return;
            if (e.key === 'Escape' && !self._title && ['intro', 'hand', 'invitation', 'ending'].indexOf(self.state.node) < 0) self.change('cabin');
            if (/^[1-3]$/.test(e.key) && !self._title && self.state.node !== 'panel') {
                var choice = Story.present(self.state).choices[Number(e.key) - 1];
                if (choice && choice.enabled) self.change(choice.id);
            }
        };
        window.addEventListener('resize', this._onResize);
        document.addEventListener('visibilitychange', this._onVisibility);
        document.addEventListener('keydown', this._onKey);
        this.positionControls();
    };
    Scene_LastLift.prototype.positionControls = function() {
        if (!Graphics._canvas) return;
        var r = Graphics._canvas.getBoundingClientRect(), style = this._controls.style;
        style.left = r.left + 'px'; style.top = r.top + 'px'; style.width = r.width + 'px'; style.height = r.height + 'px';
    };
    Scene_LastLift.prototype.text = function(value, x, y, size, color, options) {
        var style = { fontFamily: 'Arial, sans-serif', fontSize: size || 18, fill: color || C.ink,
            lineHeight: (size || 18) * 1.38, wordWrap: true, wordWrapWidth: 424, resolution: 2 };
        Object.keys(options || {}).forEach(function(k) { style[k] = options[k]; });
        var t = new PIXI.Text(value, style); t.position.set(x, y); this._ui.addChild(t); return t;
    };
    Scene_LastLift.prototype.label = function(value, x, y, color) {
        return this.text(value, x, y, 12, color || C.muted, { fontFamily: 'monospace', letterSpacing: 1.4 });
    };
    Scene_LastLift.prototype.button = function(id, label, x, y, w, h, callback, options) {
        options = options || {};
        var enabled = options.enabled !== false;
        var g = new PIXI.Graphics(); this._ui.addChild(g);
        var fill = options.primary ? C.green : options.flat ? C.bg : C.panel;
        rounded(g, x, y, w, h, fill, 10);
        if (!options.primary && !options.flat) g.lineStyle(1, C.line).drawRoundedRect(x + 0.5, y + 0.5, w - 1, h - 1, 10);
        var color = enabled ? (options.primary ? C.dark : C.ink) : C.dim;
        if (!enabled) g.alpha = 0.6;
        var t = this.text(label, x + (options.alignLeft ? 18 : w / 2), y + (options.hint ? 8 : h / 2), options.size || 17, color,
            { fontWeight: options.primary ? 'bold' : 'normal', wordWrapWidth: w - 32 });
        t.anchor.set(options.alignLeft ? 0 : 0.5, options.hint ? 0 : 0.5);
        if (options.hint) this.text(options.hint, x + 18, y + 32, 12, enabled ? (options.primary ? 0x42523b : C.muted) : C.dim, { wordWrapWidth: w - 30 });
        var b = document.createElement('button'); b.type = 'button'; b.dataset.action = id;
        b.textContent = label; b.setAttribute('aria-label', label + (options.hint ? '. ' + options.hint : ''));
        b.disabled = !enabled;
        b.style.cssText = 'position:absolute;pointer-events:auto;background:transparent;color:transparent;border:0;border-radius:10px;cursor:pointer;font-size:1px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;';
        b.style.left = (x / W * 100) + '%'; b.style.top = (y / H * 100) + '%';
        b.style.width = (w / W * 100) + '%'; b.style.height = (h / H * 100) + '%';
        var self = this;
        b.onclick = function() { if (!self._travel && enabled) { try { Audio.sync(); } catch (e) { Audio.enabled = false; } callback(); } };
        this._controls.appendChild(b); this._buttons.push(b);
    };
    Scene_LastLift.prototype.art = function(kind, y, height, title) {
        var s = this.state || Story.fresh();
        var key = [kind, s.girl, s.floor, s.flags.upgraded, s.flower, s.flags.garden, title].join(':');
        if (!this._artCache[key]) this._artCache[key] = illustration(kind, s, title);
        var image = new PIXI.Sprite(this._artCache[key]);
        image.position.set(24, y); image.width = 432; image.height = height;
        this._ui.addChild(image);
        var border = new PIXI.Graphics(); border.lineStyle(1, C.line).drawRect(24.5, y + 0.5, 431, height - 1);
        this._ui.addChild(border); this._artY = y; this._artH = height; this._artKind = kind;
    };
    Scene_LastLift.prototype.refresh = function() {
        this._ui.removeChildren().forEach(function(c) { c.destroy({ children: true }); });
        this._controls.replaceChildren(); this._buttons = [];
        var g = new PIXI.Graphics(); this._ui.addChild(g); rect(g, 0, 0, W, H, C.bg);
        for (var i = 0; i < 18; i++) rect(g, 24, i * 54, 432, 1, 0x253124, 0.18);
        if (this._title) this.drawTitle();
        else {
            this.drawHeader();
            var p = Story.present(this.state);
            if (this.state.node === 'panel') this.drawPanel();
            else if (this.state.node === 'journal') this.drawJournal();
            else if (this.state.node === 'ending') this.drawEnding(p);
            else this.drawStory(p);
            if (['intro', 'hand', 'invitation', 'ending'].indexOf(this.state.node) < 0) this.drawNav();
            this._live.textContent = p.eyebrow + '. ' + p.title + '. ' + p.text;
        }
        if (this._saveError) this.text('Не удалось сохранить: разрешите хранилище браузера.', 24, 883, 11, C.gold);
        this.positionControls();
    };
    Scene_LastLift.prototype.drawTitle = function() {
        var self = this;
        this.label('ИСТОРИИ МЕЖДУ ЭТАЖАМИ', 28, 37);
        this.text('ПОСЛЕДНИЙ', 25, 92, 45, C.ink, { fontFamily: 'Georgia, serif', letterSpacing: 1 });
        this.text('ЛИФТ', 25, 145, 72, C.green, { fontFamily: 'Georgia, serif', letterSpacing: 8 });
        this.label('01 / ПАССАЖИР БЕЗ ЭТАЖА', 29, 244, C.gold);
        this.art('cabin', 282, 276, true);
        this.text('Каждый этаж — другой мир.\nКого ты возьмёшь с собой?', 28, 585, 20, C.muted, { lineHeight: 29 });
        if (this._confirm) {
            this.text('Начать заново? Текущий путь будет заменён.', 28, 656, 16, C.gold);
            this.button('confirmNew', 'НАЧАТЬ НОВЫЙ ПУТЬ', 28, 700, 424, 60, function() { self.newGame(); }, { primary: true });
            this.button('cancelNew', 'Вернуться', 28, 774, 424, 56, function() { self._confirm = false; self.refresh(); });
        } else {
            this.button('start', this.state ? 'ПРОДОЛЖИТЬ ПУТЬ  →' : 'ВОЙТИ В ЛИФТ  →', 28, 686, 424, 62,
                function() { if (!self.state) self.newGame(); else { self._title = false; self.refresh(); } }, { primary: true });
            if (this.state) this.button('new', 'Начать сначала', 28, 762, 424, 56, function() { self._confirm = true; self.refresh(); });
        }
        this.label('ОДНА КАБИНА. ПЯТЬ ЭТАЖЕЙ. ТВОИ РЕШЕНИЯ.', 28, 856, C.dim);
        this._live.textContent = 'Последний лифт. Эпизод первый: Пассажир без этажа.';
    };
    Scene_LastLift.prototype.drawHeader = function() {
        var self = this;
        this.label('ПОСЛЕДНИЙ ЛИФТ', 25, 27, C.green);
        this.label('ПАССАЖИР БЕЗ ЭТАЖА', 25, 49, C.dim);
        this.button('sound', Audio.enabled ? 'ЗВУК: ВКЛ' : 'ЗВУК: ВЫКЛ', 331, 18, 125, 52, function() {
            try { Audio.toggle(); } catch (e) { Audio.enabled = false; }
            self.refresh();
        }, { flat: true, size: 12 });
        var meters = [
            ['ЗАРЯД', this.state.power + '/8', C.gold],
            ['МЕСТА', Story.load(this.state) + '/' + Story.capacity(this.state), C.green],
            ['ДОВЕРИЕ', this.state.girl ? String(this.state.trust) : '—', C.muted]
        ];
        var g = new PIXI.Graphics(); this._ui.addChild(g);
        meters.forEach(function(m, i) {
            rounded(g, 24 + i * 147, 84, 138, 34, C.panel, 6);
            self.text(m[0], 34 + i * 147, 94, 10, C.muted, { letterSpacing: 1 });
            self.text(m[1], 145 + i * 147, 90, 17, m[2], { fontFamily: 'monospace' }).anchor.x = 1;
        });
    };
    Scene_LastLift.prototype.drawStory = function(p) {
        var self = this;
        this.art(p.art || 'cabin', 134, 276, false);
        this.label(p.eyebrow, 27, 434, C.gold);
        this.text(p.title, 25, 461, 27, C.ink, { fontFamily: 'Georgia, serif' });
        this.text(p.text, 27, 509, 18, C.muted, { lineHeight: 26, wordWrapWidth: 423 });
        p.choices.forEach(function(c, i) {
            self.button(c.id, c.label, 24, 634 + i * 64, 432, 60, function() { self.change(c.id); },
                { primary: i === 0 && c.enabled, enabled: c.enabled, hint: c.hint, alignLeft: true, size: 17 });
        });
        if (['intro', 'hand', 'invitation'].indexOf(this.state.node) >= 0) this.label('КАСАЙСЯ КНОПОК · ПРОГРЕСС СОХРАНЯЕТСЯ', 27, 856, C.dim);
    };
    Scene_LastLift.prototype.drawNav = function() {
        var self = this;
        var items = [['cabin', 'КАБИНА'], ['panel', 'ЭТАЖИ'], ['journal', 'ДНЕВНИК']];
        var g = new PIXI.Graphics(); g.lineStyle(1, C.line).moveTo(24, 829).lineTo(456, 829); this._ui.addChild(g);
        items.forEach(function(item, i) {
            self.button('nav:' + item[0], item[1], 24 + i * 147, 834, 138, 60, function() { self.change(item[0]); },
                { flat: true, size: 13 });
            if (self.state.node === item[0]) rect(g, 79 + i * 147, 830, 28, 2, C.gold);
        });
    };
    Scene_LastLift.prototype.drawPanel = function() {
        var self = this;
        this.art('cabin', 134, 190, false);
        this.label('ПАНЕЛЬ ВЫЗОВА', 27, 348, C.gold);
        this.text('Куда поедем?', 25, 371, 30, C.ink, { fontFamily: 'Georgia, serif' });
        this.text('1 заряд за поездку · осмотр текущего этажа бесплатно', 27, 415, 13, C.muted);
        Story.floors.forEach(function(f, i) {
            var open = Story.unlocked(self.state, f);
            var current = f.id === self.state.floor;
            var enabled = open && (current || self.state.power >= 1);
            self.button('travel:' + f.id, (open ? f.code : '···') + '    ' + (open ? f.title : 'Неизвестный этаж'),
                24, 450 + i * 70, 432, 62, function() { self.change('travel:' + f.id); },
                { enabled: enabled, alignLeft: true, size: 18, hint: !open ? 'Сначала исследуй предыдущий этаж' : current ? 'Вы здесь · открыть двери' : !enabled ? 'Нет заряда — используй ручной привод в кабине' : f.note });
        });
    };
    Scene_LastLift.prototype.drawJournal = function() {
        var self = this;
        this._artKind = null;
        this.label('ВЕЩИ И ВОСПОМИНАНИЯ', 27, 145, C.gold);
        this.text('Не дать себе забыть', 25, 171, 30, C.ink, { fontFamily: 'Georgia, serif' });
        var cargo = [];
        if (this.state.girl) cargo.push('Мира и чемодан · 2 места');
        if (this.state.scrap) cargo.push('Металлическая пластина · 1 место');
        if (this.state.key) cargo.push('Ключ от квартиры 108 · 1 место');
        if (this.state.flower) cargo.push('Светящийся цветок · 1 место');
        this.text(cargo.length ? cargo.join('\n') : 'В кабине пока только ты.', 27, 224, 17, C.green, { lineHeight: 27 });
        this.label('ПАМЯТЬ: ' + this.state.memory + '   /   ПОЕЗДОК: ' + this.state.trips, 27, 349);
        var logs = this.state.log.slice().reverse();
        var pages = Math.max(1, Math.ceil(logs.length / 4));
        this._journalPage = Math.min(this._journalPage, pages - 1);
        logs.slice(this._journalPage * 4, this._journalPage * 4 + 4).forEach(function(log, i) {
            var y = 398 + i * 87;
            self.text(String(logs.length - self._journalPage * 4 - i).padStart(2, '0'), 27, y, 12, C.gold, { fontFamily: 'monospace' });
            self.text(log, 62, y - 2, 16, C.muted, { wordWrapWidth: 383, lineHeight: 23 });
        });
        if (!logs.length) this.text('«Ты живёшь на 108-м».\nПока это всё, что ты знаешь.', 27, 400, 19, C.muted);
        if (pages > 1) {
            this.button('journal:prev', '← НОВЕЕ', 24, 765, 160, 52, function() { self._journalPage--; self.refresh(); }, { enabled: this._journalPage > 0, size: 13 });
            this.button('journal:next', 'РАНЬШЕ →', 296, 765, 160, 52, function() { self._journalPage++; self.refresh(); }, { enabled: this._journalPage < pages - 1, size: 13 });
            this.label((this._journalPage + 1) + '/' + pages, 225, 783);
        }
    };
    Scene_LastLift.prototype.drawEnding = function(p) {
        var self = this;
        this.art(p.art, 134, 230, false);
        this.label(p.eyebrow, 27, 393, C.gold);
        this.text(p.title, 25, 425, 34, C.green, { fontFamily: 'Georgia, serif' });
        this.text(p.text, 27, 486, 19, C.ink, { lineHeight: 28, wordWrapWidth: 420 });
        this.label('ЭТОТ ПУТЬ ОСТАНЕТСЯ С ТОБОЙ.', 27, 710, C.dim);
        this.button('title', 'В ГЛАВНОЕ МЕНЮ', 24, 761, 432, 60, function() { self._title = true; self.refresh(); }, { primary: true });
        this.label('ПАССАЖИР БЕЗ ЭТАЖА · ОДИН ИЗ ТРЁХ ФИНАЛОВ', 27, 855, C.dim);
    };
    Scene_LastLift.prototype.newGame = function() {
        this.state = Story.fresh(); this._title = false; this._confirm = false; this._journalPage = 0;
        this.save(); this.refresh();
    };
    Scene_LastLift.prototype.save = function() {
        try { localStorage.setItem(SAVE, JSON.stringify(this.state)); this._saveError = false; }
        catch (e) { this._saveError = true; }
    };
    Scene_LastLift.prototype.change = function(id) {
        if (this._travel || this._title) return;
        var next = Story.act(this.state, id);
        if (next === this.state) return;
        this.state = next;
        if (id.indexOf('travel:') === 0) { this._travel = 48; Audio.ding(); }
        this.save(); this.refresh();
        if (this._travel) this._buttons.forEach(function(b) { b.disabled = true; });
    };
    Scene_LastLift.prototype.update = function() {
        Scene_Base.prototype.update.call(this); this._frame++;
        this._effects.clear();
        if (this._artKind === 'snow') {
            for (var i = 0; i < 34; i++) {
                var x = 25 + (i * 61 + this._frame * 0.12) % 428;
                var y = this._artY + (i * 31 + this._frame * (0.24 + (i % 3) * 0.1)) % this._artH;
                rect(this._effects, x, y, i % 3 === 0 ? 3 : 2, 2, 0xd0ded4, 0.55);
            }
        }
        if (this._travel > 0) {
            var fraction = Math.min(1, this._travel / 30);
            var doorWidth = 216 * fraction;
            rect(this._effects, 24, this._artY, doorWidth, this._artH, 0x40503c);
            rect(this._effects, 456 - doorWidth, this._artY, doorWidth, this._artH, 0x344633);
            rect(this._effects, 24 + doorWidth - 2, this._artY, 2, this._artH, C.gold, 0.5);
            this._travel--;
            if (!this._travel) this.refresh();
        }
        if (this._frame % 60 === 0) this.positionControls();
    };
    Scene_LastLift.prototype.terminate = function() {
        window.removeEventListener('resize', this._onResize);
        document.removeEventListener('visibilitychange', this._onVisibility);
        document.removeEventListener('keydown', this._onKey);
        this._controls.remove(); this._live.remove();
        Audio.enabled = false; Audio.sync();
        Object.keys(this._artCache).forEach(function(k) { this._artCache[k].destroy(true); }, this);
        Scene_Base.prototype.terminate.call(this);
    };

    window.Scene_LastLift = Scene_LastLift;
    var bootStart = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        bootStart.call(this);
        if (!DataManager.isBattleTest() && !DataManager.isEventTest()) {
            SceneManager.goto(Scene_LastLift);
            document.title = 'Последний лифт · Пассажир без этажа';
        }
    };
})();
