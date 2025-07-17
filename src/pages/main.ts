import { createGPU } from '@/PaleGL/core/gpu.ts';
import {
    createGLSLSoundWrapper,
    getSoundCurrentTime,
    loadSound,
    playSound,
    resetSoundPosition,
    stopSound,
} from '@/PaleGL/utilities/createGLSLSoundWrapper.ts';
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


`;
const styleElement = document.createElement('style');
styleElement.innerText = stylesText;
document.head.appendChild(styleElement);

const SOUND_DURATION = 144; // [sec]

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

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

// シークバー
const seekBar = document.createElement('input');
seekBar.setAttribute('id', 'seekbar');
seekBar.type = 'range';
seekBar.min = '0';
seekBar.max = SOUND_DURATION.toString();
seekBar.step = '0.1';
seekBar.value = '0';
controlsElement.appendChild(seekBar);

// 時間表示
const timeDisplay = document.createElement('div');
timeDisplay.setAttribute('id', 'time-display');
timeDisplay.textContent = `0.0s / ${SOUND_DURATION.toFixed(1)}s`;
controlsElement.appendChild(timeDisplay);

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
    }
    timeDisplay.textContent = `${currentTime.toFixed(1)}s / ${SOUND_DURATION.toFixed(1)}s`;

    if (isPlaying || isSeeking) {
        animationId = requestAnimationFrame(updateTimeDisplay);
    }
};

// 再生ボタンのイベントリスナー
playButton.addEventListener('click', () => {
    if (!isPlaying) {
        isPlaying = true;
        playButton.textContent = '一時停止';
        playSound(glslSoundWrapper, { time: currentTime });
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
            playSound(glslSoundWrapper, { time: currentTime });
            if (!animationId) {
                updateTimeDisplay();
            }
        }

        wasPlayingBeforeSeek = false;
    }
};

seekBar.addEventListener('mouseup', handleSeekEnd);
seekBar.addEventListener('touchend', handleSeekEnd);

const main = () => {
    loadSound(glslSoundWrapper);
    // 自動再生を削除し、手動再生に変更
    updateTimeDisplay();
};

main();
