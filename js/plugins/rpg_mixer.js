//==============================================================================
// rpg_mixer.js
//------------------------------------------------------------------------------
// Copyright (c) 2025 Ryan Bramantya All rights reserved.
// Licensed under Apache License
// https://www.apache.org/licenses/LICENSE-2.0.txt
// =============================================================================
/*:
 * @plugindesc [2.1.0] A unified dynamic audio mixer for RPG Maker MV with BGM/ME queue handling
 * @author RyanBram
 * @url http://ryanbram.itch.io/
 * @target MV MZ
 *
 * @help
 * --- Introduction ---
 * This plugin acts as a central mixer to play various external audio formats.
 * It features DYNAMIC LOADING, global effects for MIDI, and SMART PRELOADING.
 *
 * Version 2.1.0 adds proper BGM/ME queue handling for non-native formats.
 *
 * --- External Audio Formats ---
 * RPG Maker's editor only recognizes ogg extension for audio assets. To play MIDI
 * or MOD files, you need to add a suffix to the filename and place the actual
 * audio data in BGM, or ME directory. The plugin detects the format based on
 * the suffix and loads the corresponding backend.  The suffix tricks the editor into
 * accepting the file while allowing the plugin to identify and load the correct
 * backend for MIDI/MOD playback.
 *
 * Supported Formats:
 * - MIDI: .mid, .rmi (suffix: _mid, _rmi)
 *   *) Requires a soundfont file named "soundfont.sf2" placed in the ./audio directory
 * - MOD: .mod, .xm, .s3m, .it, .mptm, .mo3 (suffix: _mod, _xm, _s3m, _it, _mptm, _mo3)
 *
 * Examples:
 * - To play "Battle.mid", rename the file to "Battle_mid.ogg"
 * - To play "Song.mod", rename the file to "Song_mod.ogg"
 * - To play "Track.xm", rename the file to "Track_xm.ogg"
 *
 * @param --- MIDI Effects ---
 *
 * @param Enable Reverb
 * @desc Enables the global reverb effect for MIDI playback.
 * @type boolean
 * @default false
 *
 * @param Reverb Mix Level
 * @desc Controls the reverb volume. 0.0 (dry) to 1.0 (wet).
 * Reasonable values: 0.2 - 0.5
 * @type number
 * @decimals 2
 * @default 0.3
 *
 * @param Reverb IR File (Optional)
 * @desc The .wav file for reverb. If left empty, it will use the
 * default reverb sound from the library.
 * @type file
 * @dir audio/
 * @default
 *
 * @param Enable Chorus
 * @desc Enables the global chorus effect for MIDI playback.
 * @type boolean
 * @default false
 *
 * @param Chorus Depth (s)
 * @desc Controls the chorus modulation width in seconds.
 * Reasonable values: 0.001 - 0.004
 * @type number
 * @decimals 3
 * @default 0.002
 *
 * @param Chorus Rate (Hz)
 * @desc Controls the chorus modulation speed in Hertz.
 * Reasonable values: 0.5 - 2.0
 * @type number
 * @decimals 2
 * @default 1.5
 *
 * @param Chorus Delay (s)
 * @desc Base delay time for the chorus in seconds.
 * Reasonable values: 0.020 - 0.035
 * @type number
 * @decimals 3
 * @default 0.025
 */

/*:ja
 * @plugindesc [2.1.0] RPG Maker MV/MZ 用の統合ダイナミックオーディオミキサー、BGM/ME キュー処理付き
 * @author RyanBram
 * @url http://ryanbram.itch.io/
 * @target MV MZ
 *
 * @help
 * --- 導入 ---
 * このプラグインは、さまざまな外部オーディオ形式を再生するための中央ミキサーとして機能します。
 * DYNAMIC LOADING、MIDI のグローバルエフェクト、SMART PRELOADING を特徴とします。
 *
 * バージョン 2.1.0 では、非ネイティブ形式の BGM/ME キュー処理が適切に追加されました。
 *
 * --- 外部オーディオ形式 ---
 * RPG Maker のエディタはオーディオアセットに対して ogg 拡張子のみを認識します。MIDI
 * または MOD ファイルを再生するには、ファイル名にサフィックスを追加し、実際の
 * オーディオデータを BGM または ME ディレクトリに配置します。プラグインはサフィックスに基づいて
 * 形式を検出し、対応するバックエンドをロードします。サフィックスはエディタを騙して
 * ファイルを認識させ、プラグインが正しいバックエンドを識別してロードできるようにします。
 *
 * サポートされる形式:
 * - MIDI: .mid, .rmi (サフィックス: _mid, _rmi)
 *   *) "soundfont.sf2" という名前のサウンドフォントファイルを ./audio ディレクトリに配置する必要があります
 * - MOD: .mod, .xm, .s3m, .it, .mptm, .mo3 (サフィックス: _mod, _xm, _s3m, _it, _mptm, _mo3)
 *
 * 例:
 * - "Battle.mid" を再生するには、ファイルを "Battle_mid.ogg" にリネームします
 * - "Song.mod" を再生するには、ファイルを "Song_mod.ogg" にリネームします
 * - "Track.xm" を再生するには、ファイルを "Track_xm.ogg" にリネームします
 *
 * @param --- MIDI エフェクト ---
 *
 * @param Enable Reverb
 * @desc MIDI 再生のリバーブグローバルエフェクトを有効にします。
 * @type boolean
 * @default false
 *
 * @param Reverb Mix Level
 * @desc リバーブの音量を制御します。0.0 (ドライ) から 1.0 (ウェット)。
 * 合理的な値: 0.2 - 0.5
 * @type number
 * @decimals 2
 * @default 0.3
 *
 * @param Reverb IR File (Optional)
 * @desc リバーブの .wav ファイル。空の場合、デフォルトのリバーブ音が使用されます。
 * @type file
 * @dir audio/
 * @default
 *
 * @param Enable Chorus
 * @desc MIDI 再生のコーラスグローバルエフェクトを有効にします。
 * @type boolean
 * @default false
 *
 * @param Chorus Depth (s)
 * @desc コーラスの変調幅を秒単位で制御します。
 * 合理的な値: 0.001 - 0.004
 * @type number
 * @decimals 3
 * @default 0.002
 *
 * @param Chorus Rate (Hz)
 * @desc コーラスの変調速度をヘルツ単位で制御します。
 * 合理的な値: 0.5 - 2.0
 * @type number
 * @decimals 2
 * @default 1.5
 *
 * @param Chorus Delay (s)
 * @desc コーラスのベース遅延時間を秒単位で制御します。
 * 合理的な値: 0.020 - 0.035
 * @type number
 * @decimals 3
 * @default 0.025
 */

"use strict";

(function () {
  "use strict";

  // ============================================
  // Plugin Parameters
  // ============================================

  var pluginName = "rpg_mixer";
  var parameters = PluginManager.parameters(pluginName);
  var paramEnableReverb = parameters["Enable Reverb"] === "true";
  var paramReverbMix = parseFloat(parameters["Reverb Mix Level"] || 0.3);
  var paramReverbIRFile = parameters["Reverb IR File (Optional)"];
  var paramEnableChorus = parameters["Enable Chorus"] === "true";
  var paramChorusDepth = parseFloat(parameters["Chorus Depth (s)"] || 0.002);
  var paramChorusRate = parseFloat(parameters["Chorus Rate (Hz)"] || 1.5);
  var paramChorusDelay = parseFloat(parameters["Chorus Delay (s)"] || 0.025);

  // ============================================
  // Format Handlers - Map extensions to backends
  // ============================================

  const formatHandlers = {
    midi: {
      extensions: ["_mid", "_rmi"],
      backend: "spessasynth",
    },
    mod: {
      extensions: ["_mod", "_xm", "_s3m", "_it", "_mptm", "_mo3"],
      backend: "libopenmpt",
    },
  };

  // ============================================
  // Global Effects Manager
  // ============================================

  const EffectsManager = {
    _isInitialized: false,
    _pluginParameters: {
      enableChorus: paramEnableChorus,
      chorusDepth: paramChorusDepth,
      chorusRate: paramChorusRate,
      chorusDelay: paramChorusDelay,
      enableReverb: paramEnableReverb,
      reverbMix: paramReverbMix,
      reverbIRFile: paramReverbIRFile,
    },
    _context: null,
    _chorus: null,
    _reverb: null,
    _reverbDryGain: null,
    _reverbWetGain: null,
    _inputNode: null,
    _outputNode: null,

    initialize: function (SpessaLib, audioContext) {
      if (this._isInitialized || !audioContext) return;
      this._isInitialized = true;
      this._context = audioContext;

      if (SpessaLib.decodeReverb) {
        SpessaLib.decodeReverb(this._context);
      }

      console.log("[Rpg_Mixer] Initializing global effects...");

      this._inputNode = this._context.createGain();
      this._outputNode = this._context.createGain();
      let lastNode = this._inputNode;

      if (this._pluginParameters.enableChorus) {
        try {
          const chorusConfig = {
            depth: this._pluginParameters.chorusDepth,
            rate: this._pluginParameters.chorusRate,
            delay: this._pluginParameters.chorusDelay * 1000,
          };
          this._chorus = new SpessaLib.ChorusProcessor(
            this._context,
            chorusConfig
          );
          lastNode.connect(this._chorus.input);
          lastNode = this._chorus.output;
          console.log(
            "[Rpg_Mixer] Global Chorus effect enabled.",
            chorusConfig
          );
        } catch (e) {
          console.error(
            "[Rpg_Mixer] Failed to create or connect ChorusProcessor.",
            e
          );
        }
      }

      if (this._pluginParameters.enableReverb) {
        const reverbMixLevel = this._pluginParameters.reverbMix;
        console.log(
          "[Rpg_Mixer] Reverb enabled. Mix parameter from plugin:",
          reverbMixLevel
        );

        this._reverbDryGain = this._context.createGain();
        this._reverbWetGain = this._context.createGain();

        this._reverbDryGain.gain.value = 1.0 - reverbMixLevel;
        this._reverbWetGain.gain.value = reverbMixLevel;

        if (this._pluginParameters.reverbIRFile) {
          this._loadImpulseResponse().then((impulseResponse) => {
            if (impulseResponse) {
              try {
                const reverbConfig = { impulseResponse: impulseResponse };
                this._reverb = new SpessaLib.ReverbProcessor(
                  this._context,
                  reverbConfig
                );

                lastNode.connect(this._reverbDryGain);
                this._reverbDryGain.connect(this._outputNode);

                lastNode.connect(this._reverb.input);
                this._reverb.output.connect(this._reverbWetGain);
                this._reverbWetGain.connect(this._outputNode);

                console.log(
                  "[Rpg_Mixer] Global Reverb enabled with custom IR."
                );
              } catch (e) {
                console.error(
                  "[Rpg_Mixer] Failed to create ReverbProcessor with custom IR.",
                  e
                );
                lastNode.connect(this._outputNode);
              }
            } else {
              lastNode.connect(this._outputNode);
            }
          });
        } else {
          try {
            const reverbConfig = {};
            this._reverb = new SpessaLib.ReverbProcessor(
              this._context,
              reverbConfig
            );

            lastNode.connect(this._reverbDryGain);
            this._reverbDryGain.connect(this._outputNode);

            lastNode.connect(this._reverb.input);
            this._reverb.output.connect(this._reverbWetGain);
            this._reverbWetGain.connect(this._outputNode);

            console.log(
              "[Rpg_Mixer] Global Reverb enabled with default sound."
            );
          } catch (e) {
            console.error(
              "[Rpg_Mixer] Failed to create default ReverbProcessor.",
              e
            );
            lastNode.connect(this._outputNode);
          }
        }
      } else {
        lastNode.connect(this._outputNode);
      }
    },

    _loadImpulseResponse: async function () {
      const path = `audio/${this._pluginParameters.reverbIRFile}`;
      console.log(`[Rpg_Mixer] Loading Reverb Impulse Response from: ${path}`);
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this._context.decodeAudioData(arrayBuffer);
        return audioBuffer;
      } catch (e) {
        console.error(
          `[Rpg_Mixer] Failed to load or decode Impulse Response file '${path}'.`,
          e
        );
        return null;
      }
    },

    getInputNode: function () {
      return this._inputNode;
    },

    getOutputNode: function () {
      return this._outputNode;
    },
  };

  // ============================================
  // Debug Manager - F2 overlay
  // ============================================

  const DebugManager = {
    debugDiv: null,
    debugMode: 0,
    lastAudioInfo: {},
    isInitialized: false,

    initialize: function () {
      if (this.isInitialized) return;
      this.isInitialized = true;

      const div = document.createElement("div");
      div.id = "rpgMixerDebugInfo";
      div.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      div.style.color = "white";
      div.style.fontFamily = "monospace";
      div.style.fontSize = "16px";
      div.style.padding = "8px";
      div.style.position = "fixed";
      div.style.left = "0";
      div.style.bottom = "0";
      div.style.zIndex = "101";
      div.style.display = "none";
      document.body.appendChild(div);
      this.debugDiv = div;

      document.addEventListener("keydown", (event) => {
        if (event.keyCode === 113) {
          event.preventDefault();
          this.cycleMode();
        }
      });
    },

    cycleMode: function () {
      this.debugMode = (this.debugMode + 1) % 3;

      if (this.debugDiv) {
        this.debugDiv.style.display = this.debugMode > 0 ? "block" : "none";
      }

      if (this.debugMode > 0) {
        this.updateInfo(this.lastAudioInfo);
      }
    },

    show: function () {
      if (!this.isInitialized) {
        this.initialize();
      }
      if (this.debugMode === 0) {
        this.debugMode = 1;
      }
      if (this.debugDiv) {
        this.debugDiv.style.display = "block";
        if (this.lastAudioInfo) {
          this.updateInfo(this.lastAudioInfo);
        }
      }
    },

    hide: function () {
      if (this.debugDiv) {
        this.debugDiv.style.display = "none";
      }
    },

    updateInfo: function (info) {
      if (info && Object.keys(info).length > 0) {
        this.lastAudioInfo = info;
      }

      if (!this.debugDiv || this.debugMode === 0) return;

      const fileName = this.lastAudioInfo.fileName || "N/A";
      const backend = this.lastAudioInfo.backend || "N/A";
      let playbackMode = this.lastAudioInfo.playbackMode || "N/A";
      const loadTime =
        this.lastAudioInfo.loadTime !== undefined
          ? `${Math.round(this.lastAudioInfo.loadTime)}ms`
          : "Streaming";
      const decodeTime =
        this.lastAudioInfo.decodeTime !== undefined
          ? `${Math.round(this.lastAudioInfo.decodeTime)}ms`
          : "N/A";

      if (playbackMode.length > 0) {
        playbackMode =
          playbackMode.charAt(0).toUpperCase() + playbackMode.slice(1);
      }
      const effects = [];
      if (EffectsManager._chorus) effects.push("Chorus");
      if (EffectsManager._reverb) effects.push("Reverb");
      const effectsText = effects.length > 0 ? effects.join(" & ") : "None";

      const content = `
    <b style="color: #80ff80;">MODE: ${playbackMode}</b><br>
    <hr style="border-color: #555; margin: 4px 0;">
    <b>File:</b> ${fileName}<br>
    <b>Backend:</b> ${backend}<br>
    <b>Effects:</b> ${effectsText}<br>
    <b>Load Time:</b> ${loadTime}<br>
    <b>Parse Time:</b> ${decodeTime}
    `;

      this.debugDiv.innerHTML = content.trim().replace(/^\s+/gm, "");
    },
  };

  // ============================================
  // Backend Manager - Dynamic loading of audio backends
  // ============================================

  const BackendManager = {
    _state: {
      libopenmpt: "unloaded",
      spessasynth: "unloaded",
    },
    _promises: {},
    _spessa: {
      lib: null,
      audioContext: null,
      synthesizer: null,
      sequencer: null,
      gainNode: null,
    },

    require: function (backendName) {
      if (this._promises[backendName]) {
        return this._promises[backendName];
      }

      if (backendName === "libopenmpt") {
        this._promises.libopenmpt = this._requireLibOpenMPT();
      } else if (backendName === "spessasynth") {
        this._promises.spessasynth = this._requireSpessaSynth();
      } else {
        return Promise.reject(
          `[Rpg_Mixer] Backend '${backendName}' is not defined.`
        );
      }
      return this._promises[backendName];
    },

    _requireSpessaSynth: function () {
      return new Promise(async (resolve, reject) => {
        if (this._state.spessasynth === "ready")
          return resolve(this._spessa.lib);
        if (this._state.spessasynth === "failed")
          return reject(
            "[Rpg_Mixer] SpessaSynth engine previously failed to load."
          );

        console.log("[Rpg_Mixer] SpessaSynth engine loading started...");
        this._state.spessasynth = "loading";

        try {
          if (!this._spessa.lib) {
            await this._loadScript("js/libs/libspessasynth.worklet.js");
            await this._waitForSpessaLibrary();
            if (!this._spessa.lib)
              throw new Error("SpessaSynthLib not found on window.");
          }
          const audioContext = WebAudio._context || new AudioContext();
          if (audioContext.state === "suspended") await audioContext.resume();

          EffectsManager.initialize(this._spessa.lib, audioContext);

          if (!this._spessa.workletLoaded) {
            const workletUrl = this._spessa.lib.createWorkletBlobURL();
            await audioContext.audioWorklet.addModule(workletUrl);
            URL.revokeObjectURL(workletUrl);
            this._spessa.workletLoaded = true;
          }

          let soundfontBuffer = null;
          const primarySfUrl = "audio/soundfont.sf2";

          try {
            console.log(
              `[Rpg_Mixer] Attempting to load primary soundfont: ${primarySfUrl}`
            );
            const primarySfResponse = await fetch(primarySfUrl);
            if (!primarySfResponse.ok) {
              throw new Error(`HTTP status ${primarySfResponse.status}`);
            }
            soundfontBuffer = await primarySfResponse.arrayBuffer();
            console.log("[Rpg_Mixer] Primary soundfont loaded successfully.");
          } catch (primaryError) {
            console.warn(
              `[Rpg_Mixer] Primary soundfont failed to load (${primaryError.message}). Checking for Windows fallback...`
            );
            const isWindows =
              typeof process !== "undefined" && process.platform === "win32";
            if (isWindows) {
              const fallbackPath = "C:/Windows/System32/drivers/gm.dls";
              console.log(
                `[Rpg_Mixer] Windows detected. Attempting to load fallback: ${fallbackPath}`
              );
              try {
                const fs = require("fs").promises;
                const fileBuffer = await fs.readFile(fallbackPath);
                soundfontBuffer = fileBuffer.buffer.slice(
                  fileBuffer.byteOffset,
                  fileBuffer.byteOffset + fileBuffer.byteLength
                );
                console.log(
                  "[Rpg_Mixer] Fallback DLS soundfont loaded successfully."
                );
              } catch (fallbackError) {
                throw new Error(
                  `Primary SoundFont failed AND Windows fallback DLS could not be loaded from ${fallbackPath}. Reason: ${fallbackError.message}`
                );
              }
            } else {
              throw new Error(
                `Primary SoundFont not found. No fallback available for non-Windows OS.`
              );
            }
          }

          if (!soundfontBuffer) {
            throw new Error("Fatal: Could not load any valid soundfont.");
          }
          this._spessa.soundfontBuffer = soundfontBuffer;

          // Create global synthesizer and add soundfont once
          this._spessa.synthesizer = new this._spessa.lib.WorkletSynthesizer(
            audioContext
          );
          this._spessa.synthesizer.setMasterParameter("masterGain", 1.5);

          const effectsInput = EffectsManager.getInputNode();
          if (effectsInput) {
            this._spessa.synthesizer.connect(effectsInput);
          }

          await this._spessa.synthesizer.soundBankManager.addSoundBank(
            soundfontBuffer,
            "default"
          );
          console.log(
            "[Rpg_Mixer] Global synthesizer created and soundfont added."
          );

          this._state.spessasynth = "ready";
          console.log("[Rpg_Mixer] SpessaSynth engine is ready.");
          resolve(this._spessa.lib);
        } catch (error) {
          this._state.spessasynth = "failed";
          console.error(
            "[Rpg_Mixer] FAILED to initialize SpessaSynth engine.",
            error
          );
          reject(error);
        }
      });
    },

    _loadScript: function (path) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = path;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(`Failed to load script: ${path}`);
        document.body.appendChild(script);
      });
    },

    _waitForSpessaLibrary: function () {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (window.SpessaSynthLib) {
            clearInterval(interval);
            this._spessa.lib = window.SpessaSynthLib;
            resolve();
          }
        }, 50);
      });
    },

    _requireLibOpenMPT: function () {
      return new Promise((resolve, reject) => {
        if (this._state.libopenmpt === "ready") return resolve();
        if (this._state.libopenmpt === "failed")
          return reject("[Rpg_Mixer] libopenmpt backend failed to load.");

        this._state.libopenmpt = "loading";
        const workletPath = "js/libs/libopenmpt.worklet.js";

        if (!WebAudio._context) {
          return reject(
            "[Rpg_Mixer] WebAudio context not available for worklet loading."
          );
        }

        WebAudio._context.audioWorklet
          .addModule(workletPath)
          .then(() => {
            console.log(
              `[Rpg_Mixer] Backend 'libopenmpt' is ready. Using: Worklet`
            );
            this._state.libopenmpt = "ready";
            resolve();
          })
          .catch((error) => {
            console.error(
              `[Rpg_Mixer] FAILED to load worklet from ${workletPath}.`,
              error
            );
            this._state.libopenmpt = "failed";
            reject(
              "[Rpg_Mixer] FAILED to load backend script for 'libopenmpt'."
            );
          });
      });
    },
  };

  //=============================================================================
  // SpessasynthPlayer - MIDI playback via spessasynth
  //=============================================================================
  function SpessasynthPlayer() {
    this._gainNode = null;
    this._pannerNode = null;
    this._sequencer = null;
    this._isPlaying = false;
    this._loop = false;
    this._volume = 1;
    this._pitch = 1;
    this._pan = 0;
    this._onStopCallback = null;
    this._decodeTime = undefined;
  }

  SpessasynthPlayer.prototype.play = function (buffer, loop, offset, volume, context, onStop) {
    this._loop = loop;
    this._volume = volume;
    this._onStopCallback = onStop;

    const SpessaLib = BackendManager._spessa.lib;
    const synthesizer = BackendManager._spessa.synthesizer;

    if (!SpessaLib || !synthesizer) {
      console.error("[Rpg_Mixer] SpessaSynth synthesizer not ready.");
      return;
    }

    this._gainNode = context.createGain();
    this._gainNode.gain.value = this._volume;

    const effectsOutput = EffectsManager.getOutputNode();
    if (effectsOutput) {
      effectsOutput.disconnect();
      effectsOutput.connect(this._gainNode);
    } else {
      synthesizer.disconnect();
      synthesizer.connect(this._gainNode);
    }
    this._gainNode.connect(WebAudio._masterGainNode || context.destination);

    this._sequencer = new SpessaLib.Sequencer(synthesizer);

    const startTime = performance.now();
    this._sequencer.loadNewSongList([{ binary: buffer }]);
    this._decodeTime = performance.now() - startTime;
    this._sequencer.loopCount = this._loop ? Infinity : 0;
    this._sequencer.currentTime = offset || 0;
    this._sequencer.play();

    // Add end listener for ME handling
    this._sequencer.eventHandler.addEvent(
      "songEnded",
      "midi-end-listener",
      () => {
        console.log("[Rpg_Mixer] MIDI song ended, loop:", this._loop);
        if (!this._loop) {
          this._isPlaying = false;
          if (this._onStopCallback) {
            this._onStopCallback();
          }
        }
      }
    );

    this._isPlaying = true;
  };

  SpessasynthPlayer.prototype.stop = function () {
    if (this._sequencer) {
      this._sequencer.eventHandler.removeEvent(
        "songEnded",
        "midi-end-listener"
      );
      this._sequencer.pause();
      this._sequencer = null;
    }
    if (this._gainNode) {
      const effectsOutput = EffectsManager.getOutputNode();
      if (effectsOutput) {
        effectsOutput.disconnect();
      }
      this._gainNode.disconnect();
      this._gainNode = null;
    }
    this._isPlaying = false;
  };

  SpessasynthPlayer.prototype.seek = function () {
    if (this._sequencer) {
      return this._sequencer.currentTime || 0;
    }
    return 0;
  };

  SpessasynthPlayer.prototype.isPlaying = function () {
    return this._isPlaying;
  };

  SpessasynthPlayer.prototype.setVolume = function (value, context) {
    this._volume = value;
    if (this._gainNode && context) {
      this._gainNode.gain.setValueAtTime(this._volume, context.currentTime);
    }
  };

  SpessasynthPlayer.prototype.fadeIn = function (duration, volume, context) {
    if (!this._gainNode || !context) return;

    const currentTime = context.currentTime;
    const gain = this._gainNode.gain;

    gain.cancelScheduledValues(currentTime);
    gain.setValueAtTime(0, currentTime);
    gain.linearRampToValueAtTime(volume, currentTime + duration);
  };

  SpessasynthPlayer.prototype.fadeOut = function (duration, context, onComplete) {
    if (!this._gainNode || !context) return;

    const currentTime = context.currentTime;
    const gain = this._gainNode.gain;

    gain.cancelScheduledValues(currentTime);
    gain.setValueAtTime(gain.value, currentTime);
    gain.linearRampToValueAtTime(0.0001, currentTime + duration);

    if (onComplete) {
      setTimeout(onComplete, duration * 1000);
    }
  };

  SpessasynthPlayer.prototype.getDecodeTime = function () {
    return this._decodeTime;
  };

  SpessasynthPlayer.prototype.getGainNode = function () {
    return this._gainNode;
  };

  SpessasynthPlayer.prototype.setPitch = function (value, context) {
    this._pitch = value;
    // MIDI pitch change requires restarting the sequencer
    // This is complex and may cause audio glitches
    // For now, we'll just store the value
    // Full implementation would need to restart playback
    console.log("[Rpg_Mixer] SpessasynthPlayer: pitch change not yet fully supported for MIDI");
  };

  SpessasynthPlayer.prototype.setPan = function (value, context) {
    this._pan = value;
    if (!this._pannerNode && context) {
      // Create panner node if it doesn't exist
      this._pannerNode = context.createPanner();
      this._pannerNode.panningModel = "equalpower";
      
      // Reconnect audio graph
      if (this._gainNode) {
        this._gainNode.disconnect();
        this._gainNode.connect(this._pannerNode);
        this._pannerNode.connect(WebAudio._masterGainNode || context.destination);
      }
    }
    
    if (this._pannerNode) {
      var x = this._pan;
      var z = 1 - Math.abs(x);
      this._pannerNode.setPosition(x, 0, z);
    }
  };

  //=============================================================================
  // OpenmptPlayer - MOD playback via libopenmpt
  //=============================================================================
  function OpenmptPlayer() {
    this._gainNode = null;
    this._pannerNode = null;
    this._workletNode = null;
    this._currentPosition = 0;
    this._isPlaying = false;
    this._loop = false;
    this._volume = 1;
    this._pitch = 1;
    this._pan = 0;
    this._onStopCallback = null;
    this._decodeTime = undefined;
    this._context = null;
  }

  OpenmptPlayer.prototype.play = function (buffer, loop, offset, volume, context, onStop) {
    this._loop = loop;
    this._volume = volume;
    this._onStopCallback = onStop;
    this._context = context;

    const pos = offset || 0;
    this._currentPosition = pos;

    const startTime = performance.now();
    this._workletNode = new AudioWorkletNode(
      context,
      "libopenmpt-processor",
      {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      }
    );

    this._workletNode.port.onmessage = (msg) => {
      if (!this._workletNode || !this._workletNode.port) return;
      const data = msg.data;
      if (data.cmd === "pos") {
        this._currentPosition = data.pos;
      } else if (data.cmd === "meta" && pos > 0) {
        this._workletNode.port.postMessage({ cmd: "setPos", val: pos });
      } else if (data.cmd === "end") {
        console.log("[Rpg_Mixer] MOD song ended, loop:", this._loop);
        this._isPlaying = false;
        if (this._onStopCallback) {
          this._onStopCallback();
        }
        if (this._loop) {
          // For looping, restart playback
          this.stop();
          this.play(buffer, loop, 0, volume, context, onStop);
        } else {
          this.stop();
        }
      }
    };

    const config = {
      repeatCount: this._loop ? -1 : 0,
      stereoSeparation: 100,
      interpolationFilter: 0,
    };
    this._workletNode.port.postMessage({ cmd: "config", val: config });
    this._workletNode.port.postMessage({ cmd: "play", val: buffer });
    this._decodeTime = performance.now() - startTime;

    this._setupAudioNodes(context);
    this._workletNode.disconnect();
    this._workletNode.connect(this._gainNode);

    this._isPlaying = true;
  };

  OpenmptPlayer.prototype.stop = function () {
    if (this._workletNode) {
      this._workletNode.port.postMessage({ cmd: "stop" });
      this._workletNode.disconnect();
      this._workletNode = null;
    }
    if (this._gainNode) {
      this._gainNode.disconnect();
      this._gainNode = null;
    }
    this._isPlaying = false;
  };

  OpenmptPlayer.prototype.seek = function () {
    return this._currentPosition || 0;
  };

  OpenmptPlayer.prototype.isPlaying = function () {
    return this._isPlaying;
  };

  OpenmptPlayer.prototype.setVolume = function (value, context) {
    this._volume = value;
    if (this._gainNode && context) {
      this._gainNode.gain.setValueAtTime(this._volume, context.currentTime);
    }
  };

  OpenmptPlayer.prototype.fadeIn = function (duration, volume, context) {
    if (!this._gainNode || !context) return;

    const currentTime = context.currentTime;
    const gain = this._gainNode.gain;

    gain.cancelScheduledValues(currentTime);
    gain.setValueAtTime(0, currentTime);
    gain.linearRampToValueAtTime(volume, currentTime + duration);
  };

  OpenmptPlayer.prototype.fadeOut = function (duration, context, onComplete) {
    if (!this._gainNode || !context) return;

    const currentTime = context.currentTime;
    const gain = this._gainNode.gain;

    gain.cancelScheduledValues(currentTime);
    gain.setValueAtTime(gain.value, currentTime);
    gain.linearRampToValueAtTime(0.0001, currentTime + duration);

    if (onComplete) {
      setTimeout(onComplete, duration * 1000);
    }
  };

  OpenmptPlayer.prototype.getDecodeTime = function () {
    return this._decodeTime;
  };

  OpenmptPlayer.prototype.getGainNode = function () {
    return this._gainNode;
  };

  OpenmptPlayer.prototype._setupAudioNodes = function (context) {
    if (!this._gainNode) {
      this._gainNode = context.createGain();
      this._gainNode.disconnect();
      
      if (this._pannerNode) {
        this._gainNode.connect(this._pannerNode);
        this._pannerNode.connect(WebAudio._masterGainNode);
      } else {
        this._gainNode.connect(WebAudio._masterGainNode);
      }
    }
    this._gainNode.gain.value = this._volume;
  };

  OpenmptPlayer.prototype.setPitch = function (value, context) {
    this._pitch = value;
    // MOD pitch change requires restarting the playback
    // This is complex and may cause audio glitches
    // For now, we'll just store the value
    console.log("[Rpg_Mixer] OpenmptPlayer: pitch change not yet fully supported for MOD");
  };

  OpenmptPlayer.prototype.setPan = function (value, context) {
    this._pan = value;
    if (!this._pannerNode && context) {
      // Create panner node if it doesn't exist
      this._pannerNode = context.createPanner();
      this._pannerNode.panningModel = "equalpower";
      
      // Reconnect audio graph
      if (this._gainNode) {
        this._gainNode.disconnect();
        this._gainNode.connect(this._pannerNode);
        this._pannerNode.connect(WebAudio._masterGainNode || context.destination);
      }
    }
    
    if (this._pannerNode) {
      var x = this._pan;
      var z = 1 - Math.abs(x);
      this._pannerNode.setPosition(x, 0, z);
    }
  };

  //=============================================================================
  // ExternalAudio - Format-agnostic audio playback class
  //=============================================================================
  function ExternalAudio() {
    this.initialize.apply(this, arguments);
  }

  ExternalAudio.prototype.initialize = function (url, format) {
    this._url = url;
    this._format = format;
    this._buffer = null;
    this._volume = 1;
    this._pitch = 1;
    this._pan = 0;
    this._loop = false;
    this._isLoading = false;
    this._onLoadListeners = [];
    this._context = WebAudio._context;
    this._load();
    this._loadTime = undefined;
    this._stopListeners = [];
    this._isPlaying = false;
    this._player = null; // Will hold SpessasynthPlayer or OpenmptPlayer
  };

  ExternalAudio.prototype.play = function (loop, offset) {
    if (!this.isReady()) {
      this.addLoadListener(() => this.play(loop, offset));
      return;
    }

    const isSameSong =
      this._format === "midi" &&
      BackendManager._spessa.sequencer &&
      BackendManager._spessa.sequencer.activeSong &&
      BackendManager._spessa.sequencer.activeSong.arrayBuffer === this._buffer;

    if (!isSameSong) {
      this.stop();
    }

    this._loop = loop;
    const backendName = formatHandlers[this._format].backend;

    BackendManager.require(backendName)
      .then(() => {
        // Create appropriate player based on format
        if (this._format === "midi") {
          if (!this._player) {
            this._player = new SpessasynthPlayer();
          }
        } else if (this._format === "mod") {
          if (!this._player) {
            this._player = new OpenmptPlayer();
          }
        }

        if (this._player) {
          this._player.play(
            this._buffer,
            loop,
            offset,
            this._volume,
            this._context,
            () => this._callStopListeners()
          );
          this._isPlaying = true;
          console.log(
            "[Rpg_Mixer] ExternalAudio play started, format:",
            this._format,
            "loop:",
            loop
          );
          this._reportDebugInfo();
        }
      })
      .catch((error) => {
        console.error(
          `[Rpg_Mixer] Backend '${backendName}' failed to load.`,
          error
        );
      });
  };

  ExternalAudio.prototype.isReady = function () {
    return !!this._buffer;
  };

  ExternalAudio.prototype.isPlaying = function () {
    return this._isPlaying;
  };

  ExternalAudio.prototype.addLoadListener = function (listener) {
    this._onLoadListeners.push(listener);
  };

  ExternalAudio.prototype.addStopListener = function (listener) {
    this._stopListeners.push(listener);
  };

  ExternalAudio.prototype._callStopListeners = function () {
    while (this._stopListeners && this._stopListeners.length > 0) {
      var listener = this._stopListeners.shift();
      try {
        listener();
      } catch (e) {
        console.error("[Rpg_Mixer] stop listener error:", e);
      }
    }
  };

  ExternalAudio.prototype._callLoadListeners = function () {
    while (this._onLoadListeners.length > 0) {
      this._onLoadListeners.shift()();
    }
  };

  ExternalAudio.prototype._reportDebugInfo = function () {
    let fileName = this._url.substring(this._url.lastIndexOf("/") + 1);
    fileName = decodeURIComponent(fileName).replace(/\.ogg$/, "");
    let backendName = "N/A";
    let mode = "Unknown";

    if (this._format === "mod") {
      backendName = "libopenmpt";
      mode = "Worklet";
    } else if (this._format === "midi") {
      backendName = "spessasynth";
      mode = "Worklet";
    }

    const decodeTime = this._player ? this._player.getDecodeTime() : undefined;

    DebugManager.updateInfo({
      fileName: decodeURIComponent(fileName),
      backend: backendName,
      playbackMode: mode,
      loadTime: this._loadTime,
      decodeTime: decodeTime,
    });
  };

  ExternalAudio.prototype._load = function () {
    if (this._isLoading || this.isReady()) return;
    this._isLoading = true;
    const startTime = performance.now();
    const xhr = new XMLHttpRequest();
    xhr.open("GET", this._url);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      this._isLoading = false;
      if (xhr.status < 400) {
        this._loadTime = performance.now() - startTime;
        this._buffer = xhr.response;
        this._callLoadListeners();
      } else {
        console.error(`[Rpg_Mixer] Failed to load ${this._url}`);
      }
    };
    xhr.onerror = () => {
      this._isLoading = false;
      console.error(`[Rpg_Mixer] Network error on loading ${this._url}`);
    };
    xhr.send();
  };

  ExternalAudio.prototype.fadeOut = function (duration) {
    if (!this._player) return;
    this._player.fadeOut(duration, this._context, () => this.stop());
  };

  ExternalAudio.prototype.fadeIn = function (duration) {
    if (!this._player) return;
    this._player.fadeIn(duration, this._volume, this._context);
  };

  ExternalAudio.prototype.updateParameters = function (config) {
    if (config.volume !== undefined) {
      this.volume = config.volume / 100;
    }
  };

  ExternalAudio.prototype.stop = function () {
    console.log(
      "[Rpg_Mixer] ExternalAudio.stop() called, format:",
      this._format,
      "_isPlaying:",
      this._isPlaying
    );

    const wasPlaying = this._isPlaying;

    if (this._player) {
      this._player.stop();
    }
    this._isPlaying = false;

    // Only trigger stop listeners if we were actually playing before stop
    if (wasPlaying) {
      console.log("[Rpg_Mixer] Calling stop listeners because wasPlaying=true");
      this._callStopListeners();
    } else {
      console.log(
        "[Rpg_Mixer] NOT calling stop listeners because wasPlaying=false"
      );
    }
  };

  ExternalAudio.prototype.clear = function () {
    this.stop();
    this._player = null;
    this._buffer = null;
    this._volume = 1;
    this._pitch = 1;
    this._pan = 0;
    this._onLoadListeners = [];
    this._stopListeners = [];
    this._isPlaying = false;
    this._loadTime = undefined;
  };

  ExternalAudio.prototype.isError = function () {
    return false;
  };

  ExternalAudio.prototype.seek = function () {
    if (this._player) {
      return this._player.seek();
    }
    return 0;
  };

  Object.defineProperty(ExternalAudio.prototype, "url", {
    get: function () {
      return this._url;
    },
    configurable: true,
  });

  Object.defineProperty(ExternalAudio.prototype, "volume", {
    get: function () {
      return this._volume;
    },
    set: function (value) {
      this._volume = value;
      if (this._player) {
        this._player.setVolume(value, this._context);
      }
    },
    configurable: true,
  });

  Object.defineProperty(ExternalAudio.prototype, "pitch", {
    get: function () {
      return this._pitch;
    },
    set: function (value) {
      this._pitch = value;
      if (this._player) {
        this._player.setPitch(value, this._context);
      }
    },
    configurable: true,
  });

  Object.defineProperty(ExternalAudio.prototype, "pan", {
    get: function () {
      return this._pan;
    },
    set: function (value) {
      this._pan = value;
      if (this._player) {
        this._player.setPan(value, this._context);
      }
    },
    configurable: true,
  });

  //=============================================================================
  // WebAudio Compatibility Shim - Add stopListener support to native WebAudio
  //=============================================================================
  const _WebAudio_initialize = WebAudio.prototype.initialize;
  WebAudio.prototype.initialize = function (url) {
    _WebAudio_initialize.call(this, url);
    if (!this._stopListeners) {
      this._stopListeners = [];
    }
  };

  // Add addStopListener to native WebAudio if not exists
  if (!WebAudio.prototype.addStopListener) {
    WebAudio.prototype.addStopListener = function (listner) {
      if (!this._stopListeners) {
        this._stopListeners = [];
      }
      this._stopListeners.push(listner);
    };
  }

  // Hook into WebAudio.stop to call stop listeners
  const _WebAudio_stop = WebAudio.prototype.stop;
  WebAudio.prototype.stop = function () {
    _WebAudio_stop.call(this);
    if (this._stopListeners) {
      while (this._stopListeners.length > 0) {
        var listner = this._stopListeners.shift();
        try {
          listner();
        } catch (e) {
          console.error("[Rpg_Mixer] WebAudio stop listener error:", e);
        }
      }
    }
  };

  // Hook into WebAudio._onEnded to call stop listeners when audio ends naturally
  const _WebAudio_onEnded = WebAudio.prototype._onEnded;
  WebAudio.prototype._onEnded = function () {
    _WebAudio_onEnded.call(this);
    // Call stop listeners when audio ends naturally (for ME)
    if (this._stopListeners && !this._loop) {
      while (this._stopListeners.length > 0) {
        var listner = this._stopListeners.shift();
        try {
          listner();
        } catch (e) {
          console.error("[Rpg_Mixer] WebAudio onEnded listener error:", e);
        }
      }
    }
  };

  //=============================================================================
  // Html5Audio Compatibility Shim - Add stopListener support
  //=============================================================================
  
  // Add stopListener support to Html5Audio
  if (typeof Html5Audio !== "undefined") {
    Html5Audio._stopListeners = [];

    const _Html5Audio_addStopListener = Html5Audio.addStopListener;
    Html5Audio.addStopListener = function (listner) {
      if (_Html5Audio_addStopListener) {
        _Html5Audio_addStopListener.call(this, listner);
      } else {
        if (!this._stopListeners) {
          this._stopListeners = [];
        }
        this._stopListeners.push(listner);
      }
    };
  }

  //=============================================================================
  // AudioManager Integration with BGM/ME Queue
  //=============================================================================
  AudioManager._savedBgm = null;
  AudioManager._savedBgs = null;
  AudioManager._isPlayingMe = false;

  const _AudioManager_createBuffer = AudioManager.createBuffer;
  AudioManager.createBuffer = function (folder, name) {
    const nameWithoutExt = name.replace(/\.ogg$/, "");
    for (const format in formatHandlers) {
      const handler = formatHandlers[format];
      for (const ext of handler.extensions) {
        if (nameWithoutExt.endsWith(ext)) {
          const url =
            this._path + folder + "/" + encodeURIComponent(name) + ".ogg";
          return new ExternalAudio(url, format);
        }
      }
    }
    return _AudioManager_createBuffer.call(this, folder, name);
  };

  // Override playMe to handle BGM pause/resume for ALL formats
  const _AudioManager_playMe = AudioManager.playMe;
  AudioManager.playMe = function (me) {
    console.log("[Rpg_Mixer] playMe called:", me.name);
    this.stopMe();
    if (me.name) {
      // ALWAYS pause BGM when ME starts (regardless of format)
      if (this._bgmBuffer && this._currentBgm) {
        console.log(
          "[Rpg_Mixer] Pausing BGM:",
          this._currentBgm.name,
          "Type:",
          this._bgmBuffer.constructor.name
        );

        // For ExternalAudio (MIDI/MOD), use seek() method
        if (this._bgmBuffer instanceof ExternalAudio) {
          this._currentBgm.pos = this._bgmBuffer.seek();
          console.log(
            "[Rpg_Mixer] BGM ExternalAudio position saved:",
            this._currentBgm.pos
          );
        }
        // For native WebAudio, use seek() method too
        else if (this._bgmBuffer.seek) {
          this._currentBgm.pos = this._bgmBuffer.seek();
          console.log(
            "[Rpg_Mixer] BGM native position saved:",
            this._currentBgm.pos
          );
        }
        // Stop the BGM
        this._bgmBuffer.stop();
        console.log("[Rpg_Mixer] BGM stopped");
      }

      this._isPlayingMe = true;
      this._meBuffer = this.createBuffer("me", me.name);
      console.log(
        "[Rpg_Mixer] ME buffer created, Type:",
        this._meBuffer.constructor.name
      );

      this.updateMeParameters(me);
      this._meBuffer.play(false);

      // Add stop listener to resume BGM after ME ends
      console.log("[Rpg_Mixer] Adding stop listener to ME buffer");
      this._meBuffer.addStopListener(() => {
        console.log("[Rpg_Mixer] ME stop listener triggered");
        this._handleMeEnd();
      });
    }
  };

  // New method to handle ME end and BGM resume
  AudioManager._handleMeEnd = function () {
    console.log("[Rpg_Mixer] _handleMeEnd called");
    if (this._meBuffer) {
      this._meBuffer = null;
      this._isPlayingMe = false;
      console.log("[Rpg_Mixer] ME cleared, _isPlayingMe set to false");

      // Resume BGM if it was playing before ME
      if (this._currentBgm && this._currentBgm.name) {
        console.log(
          "[Rpg_Mixer] Attempting to resume BGM:",
          this._currentBgm.name,
          "from pos:",
          this._currentBgm.pos
        );

        // For ExternalAudio formats
        if (!this._bgmBuffer || !this._bgmBuffer.isPlaying()) {
          this._bgmBuffer = this.createBuffer("bgm", this._currentBgm.name);
          console.log(
            "[Rpg_Mixer] BGM buffer recreated, Type:",
            this._bgmBuffer.constructor.name
          );

          this.updateBgmParameters(this._currentBgm);
          this._bgmBuffer.play(true, this._currentBgm.pos || 0);
          this._bgmBuffer.fadeIn(this._replayFadeTime);
          console.log("[Rpg_Mixer] BGM resumed successfully");
        }
      } else {
        console.log("[Rpg_Mixer] No BGM to resume");
      }
    }
  };

  // Override stopMe to clear ME flag
  const _AudioManager_stopMe = AudioManager.stopMe;
  AudioManager.stopMe = function () {
    if (this._meBuffer) {
      this._meBuffer.stop();
      this._meBuffer = null;
      this._isPlayingMe = false;

      // Resume BGM after manual stop
      if (
        this._currentBgm &&
        this._currentBgm.name &&
        this._bgmBuffer &&
        !this._bgmBuffer.isPlaying()
      ) {
        this._bgmBuffer.play(true, this._currentBgm.pos || 0);
        this._bgmBuffer.fadeIn(this._replayFadeTime);
      }
    }
  };

  // Save BGM with proper position tracking
  const _AudioManager_saveBgm = AudioManager.saveBgm;
  AudioManager.saveBgm = function () {
    const savedBgm = _AudioManager_saveBgm.call(this);
    if (
      savedBgm &&
      this._bgmBuffer &&
      this._bgmBuffer instanceof ExternalAudio
    ) {
      savedBgm.pos = this._bgmBuffer.seek();
    }
    return savedBgm;
  };

  const _AudioManager_saveBgs = AudioManager.saveBgs;
  AudioManager.saveBgs = function () {
    const savedBgs = _AudioManager_saveBgs.call(this);
    if (
      savedBgs &&
      this._bgsBuffer &&
      this._bgsBuffer instanceof ExternalAudio
    ) {
      savedBgs.pos = this._bgsBuffer.seek();
    }
    return savedBgs;
  };

  // Debug info updates
  const _alias_AudioManager_playBgm = AudioManager.playBgm;
  AudioManager.playBgm = function (bgm, pos) {
    _alias_AudioManager_playBgm.call(this, bgm, pos);
    if (this._bgmBuffer && !(this._bgmBuffer instanceof ExternalAudio)) {
      DebugManager.updateInfo({
        fileName: bgm.name + ".ogg",
        backend: "stbvorbis",
        playbackMode: "Legacy",
        loadTime: undefined,
        decodeTime: undefined,
      });
    }
  };

  const _alias_AudioManager_playBgs = AudioManager.playBgs;
  AudioManager.playBgs = function (bgs, pos) {
    _alias_AudioManager_playBgs.call(this, bgs, pos);
    if (this._bgsBuffer && !(this._bgsBuffer instanceof ExternalAudio)) {
      DebugManager.updateInfo({
        fileName: bgs.name + ".ogg",
        backend: "stbvorbis",
        playbackMode: "Legacy",
        loadTime: undefined,
        decodeTime: undefined,
      });
    }
  };

  const _alias_AudioManager_stopBgm = AudioManager.stopBgm;
  AudioManager.stopBgm = function () {
    DebugManager.updateInfo({});
    _alias_AudioManager_stopBgm.call(this);
  };

  const _alias_AudioManager_stopBgs = AudioManager.stopBgs;
  AudioManager.stopBgs = function () {
    DebugManager.updateInfo({});
    _alias_AudioManager_stopBgs.call(this);
  };

  //=============================================================================
  // PreloadManager - Smart preloading for MIDI/MOD backends
  //=============================================================================
  const PreloadManager = {
    _backendsLoaded: {
      midi: false,
      mod: false,
    },
    _preloadedAudio: new Set(),
    _preloadPromises: [],

    scanGameAudio: function () {
      const audioFiles = new Set();

      if ($dataSystem) {
        if ($dataSystem.titleBgm && $dataSystem.titleBgm.name) {
          audioFiles.add({ name: $dataSystem.titleBgm.name, type: "bgm" });
        }
        if ($dataSystem.battleBgm && $dataSystem.battleBgm.name) {
          audioFiles.add({ name: $dataSystem.battleBgm.name, type: "bgm" });
        }
        if ($dataSystem.victoryMe && $dataSystem.victoryMe.name) {
          audioFiles.add({ name: $dataSystem.victoryMe.name, type: "me" });
        }
        if ($dataSystem.defeatMe && $dataSystem.defeatMe.name) {
          audioFiles.add({ name: $dataSystem.defeatMe.name, type: "me" });
        }
      }

      if ($dataMapInfos) {
        for (let i = 1; i < $dataMapInfos.length; i++) {
          const mapInfo = $dataMapInfos[i];
          if (mapInfo) {
            this._scanMapData(i, audioFiles);
          }
        }
      }

      console.log("[Rpg_Mixer] Scanned audio files:", Array.from(audioFiles));
      return audioFiles;
    },

    _scanMapData: function (mapId, audioFiles) {
      const xhr = new XMLHttpRequest();
      const url = "data/Map%1.json".format(mapId.padZero(3));
      xhr.open("GET", url, false);
      xhr.overrideMimeType("application/json");
      try {
        xhr.send(null);
        if (xhr.status === 200) {
          const mapData = JSON.parse(xhr.responseText);
          if (mapData && mapData.events) {
            for (const event of mapData.events) {
              if (!event) continue;
              for (const page of event.pages) {
                for (const command of page.list) {
                  if (command.code === 241 && command.parameters[0]) {
                    audioFiles.add({
                      name: command.parameters[0].name,
                      type: "bgm",
                    });
                  } else if (command.code === 249 && command.parameters[0]) {
                    audioFiles.add({
                      name: command.parameters[0].name,
                      type: "me",
                    });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
    },

    getAudioFormat: function (filename) {
      for (const format in formatHandlers) {
        const handler = formatHandlers[format];
        for (const ext of handler.extensions) {
          if (filename.endsWith(ext)) {
            return format;
          }
        }
      }
      return null;
    },

    preloadBackends: async function (audioFiles) {
      const needsMidi = Array.from(audioFiles).some((file) => {
        const format = this.getAudioFormat(file.name);
        return format === "midi";
      });

      const needsMod = Array.from(audioFiles).some((file) => {
        const format = this.getAudioFormat(file.name);
        return format === "mod";
      });

      const promises = [];

      if (needsMidi && !this._backendsLoaded.midi) {
        console.log("[Rpg_Mixer] Preloading MIDI backend...");
        promises.push(
          BackendManager.require("spessasynth").then(() => {
            this._backendsLoaded.midi = true;
            console.log("[Rpg_Mixer] MIDI backend preloaded successfully.");
          })
        );
      }

      if (needsMod && !this._backendsLoaded.mod) {
        console.log("[Rpg_Mixer] Preloading MOD backend...");
        promises.push(
          BackendManager.require("libopenmpt").then(() => {
            this._backendsLoaded.mod = true;
            console.log("[Rpg_Mixer] MOD backend preloaded successfully.");
          })
        );
      }

      return Promise.all(promises);
    },

    initialize: async function () {
      console.log("[Rpg_Mixer] Starting preload process...");

      const audioFiles = this.scanGameAudio();
      await this.preloadBackends(audioFiles);

      console.log("[Rpg_Mixer] Preload process completed.");
    },

    isBackendReady: function (format) {
      if (format === "midi") return this._backendsLoaded.midi;
      if (format === "mod") return this._backendsLoaded.mod;
      return true;
    },
  };

  const _Scene_Boot_start = Scene_Boot.prototype.start;
  Scene_Boot.prototype.start = function () {
    _Scene_Boot_start.call(this);
    DebugManager.initialize();
  };

  const _Scene_Boot_isReady = Scene_Boot.prototype.isReady;
  Scene_Boot.prototype.isReady = function () {
    if (!this._preloadInitialized) {
      this._preloadInitialized = true;
      this._preloadComplete = false;

      PreloadManager.initialize()
        .then(() => {
          this._preloadComplete = true;
          console.log("[Rpg_Mixer] All preloading complete, game ready.");
        })
        .catch((err) => {
          console.error("[Rpg_Mixer] Preload error:", err);
          this._preloadComplete = true;
        });
    }

    return _Scene_Boot_isReady.call(this) && this._preloadComplete;
  };

  console.log(
    "[Rpg_Mixer] Unified dynamic audio player loaded (v2.1.0 with BGM/ME queue)."
  );
})();
