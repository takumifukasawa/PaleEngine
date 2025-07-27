import { createGPU } from '@/PaleGL/core/gpu.ts';
import {
    createGLSLSoundWrapper,
    getSoundCurrentTime,
    loadSound,
    playSound,
    resetSoundPosition, setSoundVolume,
    stopSound,
} from '@/PaleGL/utilities/createGLSLSoundWrapper.ts';
// import soundVertexShader from './shaders/sound-vertex-test.glsl';
import soundVertexShader from './shaders/sound-vertex.glsl';

//--------------------

const stylesText = `

* {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
} 

#wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

#controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

#button-controls {
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

#play-btn {
  background-color: #4CAF50;
  color: white;
}

#play-btn:hover {
  background-color: #45a049;
}

#stop-btn {
  background-color: #f44336;
  color: white;
}

#stop-btn:hover {
  background-color: #da190b;
}

#seekbar {
  width: 300px;
  height: 5px;
  background-color: #ddd;
  border-radius: 5px;
  appearance: none;
  outline: none;
}

#seekbar::-webkit-slider-thumb {
  appearance: none;
  width: 15px;
  height: 15px;
  background-color: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}

#seekbar::-moz-range-thumb {
  width: 15px;
  height: 15px;
  background-color: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

#time-display {
  font-family: monospace;
  font-size: 14px;
  color: #666;
}

#volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

#volume-label {
  font-size: 14px;
  color: #666;
  min-width: 60px;
}

#volumebar {
  width: 200px;
  height: 5px;
  background-color: #ddd;
  border-radius: 5px;
  appearance: none;
  outline: none;
}

#volumebar::-webkit-slider-thumb {
  appearance: none;
  width: 15px;
  height: 15px;
  background-color: #2196F3;
  border-radius: 50%;
  cursor: pointer;
}

#volumebar::-moz-range-thumb {
  width: 15px;
  height: 15px;
  background-color: #2196F3;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

#seek-mode-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

#seek-mode-toggle label {
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

#seek-mode-toggle input[type="radio"] {
  margin-right: 5px;
}

#measure-seekbar {
  width: 300px;
  height: 5px;
  background-color: #ddd;
  border-radius: 5px;
  appearance: none;
  outline: none;
}

#measure-seekbar::-webkit-slider-thumb {
  appearance: none;
  width: 15px;
  height: 15px;
  background-color: #FF9800;
  border-radius: 50%;
  cursor: pointer;
}

#measure-seekbar::-moz-range-thumb {
  width: 15px;
  height: 15px;
  background-color: #FF9800;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

#measure-display {
  font-family: monospace;
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

#music-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #e8f4fd;
  border-radius: 8px;
  border: 1px solid #bee5eb;
}

#music-info-title {
  font-size: 16px;
  font-weight: bold;
  color: #0c5460;
  margin-bottom: 5px;
}

#music-info-details {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
}

.music-info-item {
  font-size: 14px;
  color: #495057;
  background-color: white;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

#text-input-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.text-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.text-input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.text-input-label {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

.text-input-field {
  padding: 6px 10px;
  font-size: 14px;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  text-align: center;
  font-family: monospace;
  width: 80px;
  transition: border-color 0.3s;
}

.text-input-field:focus {
  outline: none;
  border-color: #4CAF50;
}

.text-input-field.error {
  border-color: #f44336;
  background-color: #ffebee;
}

.jump-button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #2196F3;
  color: white;
  transition: background-color 0.3s;
}

.jump-button:hover {
  background-color: #1976D2;
}

.jump-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  font-size: 11px;
  color: #f44336;
  margin-top: 2px;
  min-height: 14px;
}


`;
const styleElement = document.createElement('style');
styleElement.innerText = stylesText;
document.head.appendChild(styleElement);

// 音楽の小節情報
const MUSIC_BPM = 124; // BPM（1分間の拍数）
const BEATS_PER_MEASURE = 4; // 1小節あたりの拍数
const TOTAL_MEASURES = 88; // 総小節数
const SECONDS_PER_BEAT = 60 / MUSIC_BPM; // 1拍の秒数
const SECONDS_PER_MEASURE = SECONDS_PER_BEAT * BEATS_PER_MEASURE; // 1小節の秒数
const SOUND_DURATION = TOTAL_MEASURES * SECONDS_PER_MEASURE; // 合計音の時間 [sec]

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

// 音楽情報表示
const musicInfoElement = document.createElement('div');
musicInfoElement.setAttribute('id', 'music-info');
wrapperElement.appendChild(musicInfoElement);

const musicInfoTitle = document.createElement('div');
musicInfoTitle.setAttribute('id', 'music-info-title');
musicInfoTitle.textContent = '楽曲情報';
musicInfoElement.appendChild(musicInfoTitle);

const musicInfoDetails = document.createElement('div');
musicInfoDetails.setAttribute('id', 'music-info-details');
musicInfoElement.appendChild(musicInfoDetails);

const bpmInfo = document.createElement('div');
bpmInfo.className = 'music-info-item';
bpmInfo.textContent = `BPM: ${MUSIC_BPM}`;
musicInfoDetails.appendChild(bpmInfo);

const beatsInfo = document.createElement('div');
beatsInfo.className = 'music-info-item';
beatsInfo.textContent = `拍子: ${BEATS_PER_MEASURE}/4`;
musicInfoDetails.appendChild(beatsInfo);

const measuresInfo = document.createElement('div');
measuresInfo.className = 'music-info-item';
measuresInfo.textContent = `総小節数: ${TOTAL_MEASURES}`;
musicInfoDetails.appendChild(measuresInfo);

const durationInfo = document.createElement('div');
durationInfo.className = 'music-info-item';
const minutes = Math.floor(SOUND_DURATION / 60);
const seconds = (SOUND_DURATION % 60).toFixed(1);
durationInfo.textContent = `再生時間: ${minutes}:${seconds.padStart(4, '0')}`;
musicInfoDetails.appendChild(durationInfo);

// 音声コントローラーUI
const controlsElement = document.createElement('div');
controlsElement.setAttribute('id', 'controls');
wrapperElement.appendChild(controlsElement);

// ボタンコントロール
const buttonControlsElement = document.createElement('div');
buttonControlsElement.setAttribute('id', 'button-controls');
controlsElement.appendChild(buttonControlsElement);

const playButton = document.createElement('button');
playButton.setAttribute('id', 'play-btn');
playButton.textContent = '再生';
buttonControlsElement.appendChild(playButton);

const stopButton = document.createElement('button');
stopButton.setAttribute('id', 'stop-btn');
stopButton.textContent = '停止';
buttonControlsElement.appendChild(stopButton);

// シークモード切り替え
const seekModeToggleElement = document.createElement('div');
seekModeToggleElement.setAttribute('id', 'seek-mode-toggle');
controlsElement.appendChild(seekModeToggleElement);

const timeSeekRadio = document.createElement('input');
timeSeekRadio.type = 'radio';
timeSeekRadio.name = 'seekMode';
timeSeekRadio.id = 'time-seek-radio';
timeSeekRadio.value = 'time';

const timeSeekLabel = document.createElement('label');
timeSeekLabel.setAttribute('for', 'time-seek-radio');
timeSeekLabel.textContent = '時間ベース';

const measureSeekRadio = document.createElement('input');
measureSeekRadio.type = 'radio';
measureSeekRadio.name = 'seekMode';
measureSeekRadio.id = 'measure-seek-radio';
measureSeekRadio.value = 'measure';
measureSeekRadio.checked = true;

const measureSeekLabel = document.createElement('label');
measureSeekLabel.setAttribute('for', 'measure-seek-radio');
measureSeekLabel.textContent = '小節ベース';

seekModeToggleElement.appendChild(timeSeekRadio);
seekModeToggleElement.appendChild(timeSeekLabel);
seekModeToggleElement.appendChild(measureSeekRadio);
seekModeToggleElement.appendChild(measureSeekLabel);

// 時間ベースシークバー
const seekBar = document.createElement('input');
seekBar.setAttribute('id', 'seekbar');
seekBar.type = 'range';
seekBar.min = '0';
seekBar.max = SOUND_DURATION.toString();
seekBar.step = '0.1';
seekBar.value = '0';
seekBar.style.display = 'none'; // 初期状態では非表示
controlsElement.appendChild(seekBar);

// 小節ベースシークバー
const measureSeekBar = document.createElement('input');
measureSeekBar.setAttribute('id', 'measure-seekbar');
measureSeekBar.type = 'range';
measureSeekBar.min = '1';
measureSeekBar.max = TOTAL_MEASURES.toString();
measureSeekBar.step = '1';
measureSeekBar.value = '1';
controlsElement.appendChild(measureSeekBar);

// 時間表示
const timeDisplay = document.createElement('div');
timeDisplay.setAttribute('id', 'time-display');
timeDisplay.textContent = `0.0s / ${SOUND_DURATION.toFixed(1)}s`;
timeDisplay.style.display = 'none'; // 初期状態では非表示
controlsElement.appendChild(timeDisplay);

// 小節表示
const measureDisplay = document.createElement('div');
measureDisplay.setAttribute('id', 'measure-display');
measureDisplay.textContent = `小節 1 / ${TOTAL_MEASURES}`;
controlsElement.appendChild(measureDisplay);

// 文字入力コントロール
const textInputControlsElement = document.createElement('div');
textInputControlsElement.setAttribute('id', 'text-input-controls');
controlsElement.appendChild(textInputControlsElement);

// 時間入力グループ
const timeInputGroup = document.createElement('div');
timeInputGroup.className = 'text-input-group';
timeInputGroup.style.display = 'none'; // 初期状態では非表示

const timeInputLabel = document.createElement('div');
timeInputLabel.className = 'text-input-label';
timeInputLabel.textContent = '時間指定 (mm:ss.s)';
timeInputGroup.appendChild(timeInputLabel);

const timeInputRow = document.createElement('div');
timeInputRow.className = 'text-input-row';
timeInputGroup.appendChild(timeInputRow);

const timeInputField = document.createElement('input');
timeInputField.className = 'text-input-field';
timeInputField.type = 'text';
timeInputField.placeholder = '1:23.5';
timeInputField.setAttribute('id', 'time-input-field');
timeInputRow.appendChild(timeInputField);

const timeJumpButton = document.createElement('button');
timeJumpButton.className = 'jump-button';
timeJumpButton.textContent = 'ジャンプ';
timeJumpButton.setAttribute('id', 'time-jump-button');
timeInputRow.appendChild(timeJumpButton);

const timeErrorMessage = document.createElement('div');
timeErrorMessage.className = 'error-message';
timeInputGroup.appendChild(timeErrorMessage);

textInputControlsElement.appendChild(timeInputGroup);

// 小節入力グループ
const measureInputGroup = document.createElement('div');
measureInputGroup.className = 'text-input-group';

const measureInputLabel = document.createElement('div');
measureInputLabel.className = 'text-input-label';
measureInputLabel.textContent = '小節指定';
measureInputGroup.appendChild(measureInputLabel);

const measureInputRow = document.createElement('div');
measureInputRow.className = 'text-input-row';
measureInputGroup.appendChild(measureInputRow);

const measureInputField = document.createElement('input');
measureInputField.className = 'text-input-field';
measureInputField.type = 'text';
measureInputField.placeholder = '45';
measureInputField.setAttribute('id', 'measure-input-field');
measureInputRow.appendChild(measureInputField);

const measureJumpButton = document.createElement('button');
measureJumpButton.className = 'jump-button';
measureJumpButton.textContent = 'ジャンプ';
measureJumpButton.setAttribute('id', 'measure-jump-button');
measureInputRow.appendChild(measureJumpButton);

const measureErrorMessage = document.createElement('div');
measureErrorMessage.className = 'error-message';
measureInputGroup.appendChild(measureErrorMessage);

textInputControlsElement.appendChild(measureInputGroup);

// ボリュームコントロール
const volumeControlElement = document.createElement('div');
volumeControlElement.setAttribute('id', 'volume-control');
controlsElement.appendChild(volumeControlElement);

const volumeLabel = document.createElement('div');
volumeLabel.setAttribute('id', 'volume-label');
volumeLabel.textContent = 'ボリューム: 100%';
volumeControlElement.appendChild(volumeLabel);

const volumeBar = document.createElement('input');
volumeBar.setAttribute('id', 'volumebar');
volumeBar.type = 'range';
volumeBar.min = '0';
volumeBar.max = '100';
volumeBar.step = '1';
volumeBar.value = '100';
volumeControlElement.appendChild(volumeBar);

const canvasElement = document.createElement('canvas');
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true })!;
const gpu = createGPU(gl);

const glslSoundWrapper = createGLSLSoundWrapper(gpu, soundVertexShader, SOUND_DURATION);

let isPlaying = false;
let currentTime = 0;
let animationId: number | null = null;
let isSeeking = false;
let wasPlayingBeforeSeek = false;
let currentVolume = 1.0; // 初期ボリューム100%
let currentSeekMode: 'time' | 'measure' = 'measure'; // 現在のシークモード

// 時間と小節の相互変換関数
const timeToMeasure = (timeInSeconds: number): number => {
    return Math.floor(timeInSeconds / SECONDS_PER_MEASURE) + 1;
};

const measureToTime = (measure: number): number => {
    return (measure - 1) * SECONDS_PER_MEASURE;
};

const getCurrentMeasure = (): number => {
    return timeToMeasure(currentTime);
};

// 時間文字列パース関数
const parseTimeString = (timeString: string): { isValid: boolean; seconds?: number; error?: string } => {
    if (!timeString.trim()) {
        return { isValid: false, error: '時間を入力してください' };
    }

    // mm:ss.s, mm:ss, m:ss.s, m:ss の形式をサポート
    const timePattern = /^(\d{1,2}):([0-5]?\d)(?:\.(\d{1,3}))?$/;
    const match = timeString.trim().match(timePattern);

    if (!match) {
        return { isValid: false, error: 'mm:ss.s 形式で入力してください' };
    }

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

    const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;

    if (totalSeconds > SOUND_DURATION) {
        const maxMinutes = Math.floor(SOUND_DURATION / 60);
        const maxSeconds = (SOUND_DURATION % 60).toFixed(1);
        return { 
            isValid: false, 
            error: `最大時間は ${maxMinutes}:${maxSeconds.padStart(4, '0')} です` 
        };
    }

    return { isValid: true, seconds: totalSeconds };
};

// 小節番号パース関数
const parseMeasureString = (measureString: string): { isValid: boolean; measure?: number; error?: string } => {
    if (!measureString.trim()) {
        return { isValid: false, error: '小節番号を入力してください' };
    }

    const measureNumber = parseInt(measureString.trim(), 10);

    if (isNaN(measureNumber)) {
        return { isValid: false, error: '数値で入力してください' };
    }

    if (measureNumber < 1 || measureNumber > TOTAL_MEASURES) {
        return { 
            isValid: false, 
            error: `1〜${TOTAL_MEASURES} の範囲で入力してください` 
        };
    }

    return { isValid: true, measure: measureNumber };
};

// エラー表示とスタイル制御関数
const showInputError = (inputField: HTMLInputElement, errorElement: HTMLElement, errorMessage: string) => {
    inputField.classList.add('error');
    errorElement.textContent = errorMessage;
};

const clearInputError = (inputField: HTMLInputElement, errorElement: HTMLElement) => {
    inputField.classList.remove('error');
    errorElement.textContent = '';
};

// 統一されたシーク処理関数
const performSeek = (targetTime: number) => {
    // 再生中の場合は一時停止
    if (isPlaying) {
        stopSound(glslSoundWrapper);
        wasPlayingBeforeSeek = true;
        isSeeking = true;
    }

    currentTime = Math.max(0, Math.min(targetTime, SOUND_DURATION));
    updateTimeDisplay();

    // 再生中だった場合は指定位置から再開
    if (wasPlayingBeforeSeek) {
        playSound(glslSoundWrapper, { time: currentTime, volume: currentVolume });
        wasPlayingBeforeSeek = false;
        isSeeking = false;
        if (!animationId) {
            updateTimeDisplay();
        }
    }
};

// 時間表示を更新する関数
const updateTimeDisplay = () => {
    if (isPlaying && !isSeeking) {
        currentTime = getSoundCurrentTime(glslSoundWrapper);
        if (currentTime >= SOUND_DURATION) {
            isPlaying = false;
            currentTime = SOUND_DURATION;
            playButton.textContent = '再生';
        }
    }

    if (!isSeeking) {
        seekBar.value = currentTime.toString();
        measureSeekBar.value = getCurrentMeasure().toString();
    }
    
    // 表示更新
    timeDisplay.textContent = `${currentTime.toFixed(1)}s / ${SOUND_DURATION.toFixed(1)}s`;
    measureDisplay.textContent = `小節 ${getCurrentMeasure()} / ${TOTAL_MEASURES}`;

    if (isPlaying || isSeeking) {
        animationId = requestAnimationFrame(updateTimeDisplay);
    }
};

// 再生ボタンのイベントリスナー
playButton.addEventListener('click', () => {
    if (!isPlaying) {
        isPlaying = true;
        playButton.textContent = '一時停止';
        playSound(glslSoundWrapper, { time: currentTime, volume: currentVolume });
        updateTimeDisplay();
    } else {
        isPlaying = false;
        playButton.textContent = '再生';
        stopSound(glslSoundWrapper);
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
});

// 停止ボタンのイベントリスナー
stopButton.addEventListener('click', () => {
    isPlaying = false;
    currentTime = 0;
    playButton.textContent = '再生';
    stopSound(glslSoundWrapper);
    resetSoundPosition(glslSoundWrapper);
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    updateTimeDisplay();
});

// シークバーのイベントリスナー
seekBar.addEventListener('input', () => {
    if (!isSeeking) {
        // シーク開始時：再生中だった場合は停止して状態を保存
        wasPlayingBeforeSeek = isPlaying;
        if (isPlaying) {
            stopSound(glslSoundWrapper);
        }
        isSeeking = true;
        if (!animationId) {
            updateTimeDisplay();
        }
    }

    currentTime = parseFloat(seekBar.value);
    updateTimeDisplay();
});

// シーク終了を検知するためのmouseupとtouchendイベント
const handleSeekEnd = () => {
    if (isSeeking) {
        isSeeking = false;

        // シーク前に再生中だった場合は再生を再開
        if (wasPlayingBeforeSeek) {
            playSound(glslSoundWrapper, { time: currentTime, volume: currentVolume });
            if (!animationId) {
                updateTimeDisplay();
            }
        }

        wasPlayingBeforeSeek = false;
    }
};

seekBar.addEventListener('mouseup', handleSeekEnd);
seekBar.addEventListener('touchend', handleSeekEnd);

// 小節シークバーのイベントリスナー
measureSeekBar.addEventListener('input', () => {
    if (!isSeeking) {
        // シーク開始時：再生中だった場合は停止して状態を保存
        wasPlayingBeforeSeek = isPlaying;
        if (isPlaying) {
            stopSound(glslSoundWrapper);
        }
        isSeeking = true;
        if (!animationId) {
            updateTimeDisplay();
        }
    }

    const targetMeasure = parseInt(measureSeekBar.value);
    currentTime = measureToTime(targetMeasure);
    updateTimeDisplay();
});

// 小節シーク終了を検知するためのmouseupとtouchendイベント
const handleMeasureSeekEnd = () => {
    if (isSeeking) {
        isSeeking = false;

        // シーク前に再生中だった場合は再生を再開
        if (wasPlayingBeforeSeek) {
            playSound(glslSoundWrapper, { time: currentTime, volume: currentVolume });
            if (!animationId) {
                updateTimeDisplay();
            }
        }

        wasPlayingBeforeSeek = false;
    }
};

measureSeekBar.addEventListener('mouseup', handleMeasureSeekEnd);
measureSeekBar.addEventListener('touchend', handleMeasureSeekEnd);

// ボリュームスライダーのイベントリスナー
volumeBar.addEventListener('input', () => {
    currentVolume = parseFloat(volumeBar.value) / 100; // 0-100を0-1に変換
    volumeLabel.textContent = `ボリューム: ${volumeBar.value}%`;
    
    // 再生中の場合は即座にボリュームを反映
    if (isPlaying) {
        // setSoundVolume(glslSoundWrapper, currentVolume);
        setSoundVolume(glslSoundWrapper, currentVolume);
    }
});

// 時間ジャンプボタンのイベントリスナー
timeJumpButton.addEventListener('click', () => {
    clearInputError(timeInputField, timeErrorMessage);
    
    const parseResult = parseTimeString(timeInputField.value);
    if (!parseResult.isValid) {
        showInputError(timeInputField, timeErrorMessage, parseResult.error!);
        return;
    }
    
    performSeek(parseResult.seconds!);
    timeInputField.value = ''; // 成功時はクリア
});

// 小節ジャンプボタンのイベントリスナー
measureJumpButton.addEventListener('click', () => {
    clearInputError(measureInputField, measureErrorMessage);
    
    const parseResult = parseMeasureString(measureInputField.value);
    if (!parseResult.isValid) {
        showInputError(measureInputField, measureErrorMessage, parseResult.error!);
        return;
    }
    
    const targetTime = measureToTime(parseResult.measure!);
    performSeek(targetTime);
    measureInputField.value = ''; // 成功時はクリア
});

// 入力フィールドでのEnterキー対応
timeInputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        timeJumpButton.click();
    }
});

measureInputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        measureJumpButton.click();
    }
});

// 入力中のエラークリア
timeInputField.addEventListener('input', () => {
    clearInputError(timeInputField, timeErrorMessage);
});

measureInputField.addEventListener('input', () => {
    clearInputError(measureInputField, measureErrorMessage);
});

// シークモード切り替えのイベントリスナー
const handleSeekModeChange = () => {
    const selectedMode = document.querySelector('input[name="seekMode"]:checked') as HTMLInputElement;
    currentSeekMode = selectedMode.value as 'time' | 'measure';
    
    if (currentSeekMode === 'time') {
        // 時間ベースモード
        seekBar.style.display = 'block';
        timeDisplay.style.display = 'block';
        measureSeekBar.style.display = 'none';
        measureDisplay.style.display = 'none';
        timeInputGroup.style.display = 'block';
        measureInputGroup.style.display = 'none';
    } else {
        // 小節ベースモード
        seekBar.style.display = 'none';
        timeDisplay.style.display = 'none';
        measureSeekBar.style.display = 'block';
        measureDisplay.style.display = 'block';
        timeInputGroup.style.display = 'none';
        measureInputGroup.style.display = 'block';
    }
};

timeSeekRadio.addEventListener('change', handleSeekModeChange);
measureSeekRadio.addEventListener('change', handleSeekModeChange);

const main = () => {
    loadSound(glslSoundWrapper);
    // 初期ボリュームを設定
    setSoundVolume(glslSoundWrapper, currentVolume);
    // 自動再生を削除し、手動再生に変更
    updateTimeDisplay();
};

main();
