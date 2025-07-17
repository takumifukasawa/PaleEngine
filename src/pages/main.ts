import { createGPU } from '@/PaleGL/core/gpu.ts';
import {
    createGLSLSoundWrapper,
    getSoundCurrentTime,
    loadSound,
    playSound,
    resetSoundPosition,
    stopSound,
    updateShader,
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

#shader-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

#shader-editor-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
}

#shader-editor h3 {
  margin: 0 0 10px 0;
  color: #333;
}

#ace-editor {
  width: 100%;
  height: 100%;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
}

#shader-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

#compile-btn {
  background-color: #2196F3;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#compile-btn:hover {
  background-color: #1976D2;
}

#compile-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

#reset-btn {
  background-color: #FF9800;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#reset-btn:hover {
  background-color: #F57C00;
}

#save-btn {
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#save-btn:hover {
  background-color: #45a049;
}

#load-btn {
  background-color: #9C27B0;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#load-btn:hover {
  background-color: #7B1FA2;
}

#export-btn {
  background-color: #607D8B;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#export-btn:hover {
  background-color: #455A64;
}

#import-btn {
  background-color: #795548;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#import-btn:hover {
  background-color: #5D4037;
}

#file-input {
  display: none;
}

#error-display {
  min-height: 20px;
  max-height: 200px;
  padding: 12px;
  background-color: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  color: #c62828;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  display: none;
  overflow-y: auto;
  line-height: 1.4;
}

#error-display.show {
  display: block;
}

#error-display .error-summary {
  font-weight: bold;
  color: #b71c1c;
  margin-bottom: 8px;
}

#error-display .error-item {
  margin-bottom: 4px;
  padding-left: 16px;
}

#error-display .error-line {
  color: #666;
  font-size: 11px;
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

// シェーダーエディタ
const shaderEditorElement = document.createElement('div');
shaderEditorElement.setAttribute('id', 'shader-editor');
wrapperElement.appendChild(shaderEditorElement);

const shaderTitle = document.createElement('h3');
shaderTitle.textContent = 'GLSL Shader Editor';
shaderEditorElement.appendChild(shaderTitle);

// シェーダーエディタコンテナ
const shaderEditorContainer = document.createElement('div');
shaderEditorContainer.setAttribute('id', 'shader-editor-container');
shaderEditorElement.appendChild(shaderEditorContainer);

// Ace.jsエディター用のdiv
const aceEditorDiv = document.createElement('div');
aceEditorDiv.setAttribute('id', 'ace-editor');
shaderEditorContainer.appendChild(aceEditorDiv);

// Ace.jsエディターの初期化
const aceEditor = (window as any).ace.edit('ace-editor');
aceEditor.setTheme('ace/theme/twilight');
aceEditor.session.setMode('ace/mode/c_cpp'); // GLSLモードの代わりにC++モードを使用

// 改行文字を正しく処理するため、文字列の改行を正規化
const normalizedShader = soundVertexShader.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
aceEditor.setValue(normalizedShader, -1); // -1 でカーソルを先頭に設定

// Vimモードを有効化
aceEditor.setKeyboardHandler('ace/keyboard/vim');

aceEditor.setOptions({
    fontSize: '14px',
    showLineNumbers: true,
    showGutter: true,
    highlightActiveLine: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    tabSize: 2,
    useSoftTabs: true,
    wrap: false,
    showPrintMargin: false
});

// 改行文字を正しく表示するための設定
aceEditor.getSession().setUseWrapMode(false);
aceEditor.getSession().setNewLineMode('unix');

// デバッグ用：行数を確認
console.log('Original shader length:', soundVertexShader.length);
console.log('Normalized shader length:', normalizedShader.length);
console.log('Line count:', normalizedShader.split('\n').length);
console.log('First few lines:', normalizedShader.split('\n').slice(0, 5));

const shaderControlsElement = document.createElement('div');
shaderControlsElement.setAttribute('id', 'shader-controls');
shaderEditorElement.appendChild(shaderControlsElement);

const compileButton = document.createElement('button');
compileButton.setAttribute('id', 'compile-btn');
compileButton.textContent = 'コンパイル';
shaderControlsElement.appendChild(compileButton);

const resetButton = document.createElement('button');
resetButton.setAttribute('id', 'reset-btn');
resetButton.textContent = 'リセット';
shaderControlsElement.appendChild(resetButton);

const saveButton = document.createElement('button');
saveButton.setAttribute('id', 'save-btn');
saveButton.textContent = '保存';
shaderControlsElement.appendChild(saveButton);

const loadButton = document.createElement('button');
loadButton.setAttribute('id', 'load-btn');
loadButton.textContent = '読み込み';
shaderControlsElement.appendChild(loadButton);

const exportButton = document.createElement('button');
exportButton.setAttribute('id', 'export-btn');
exportButton.textContent = 'エクスポート';
shaderControlsElement.appendChild(exportButton);

const importButton = document.createElement('button');
importButton.setAttribute('id', 'import-btn');
importButton.textContent = 'インポート';
shaderControlsElement.appendChild(importButton);

const fileInput = document.createElement('input');
fileInput.setAttribute('id', 'file-input');
fileInput.type = 'file';
fileInput.accept = '.glsl,.txt';
shaderControlsElement.appendChild(fileInput);

const errorDisplay = document.createElement('div');
errorDisplay.setAttribute('id', 'error-display');
shaderEditorElement.appendChild(errorDisplay);

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
let isCompiling = false;
const originalShaderCode = soundVertexShader;

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

// エラー表示を更新する関数
const showError = (message: string) => {
    errorDisplay.textContent = message;
    errorDisplay.classList.add('show');
    
    // エラーメッセージをスクロール可能にする
    errorDisplay.scrollTop = 0;
};

const hideError = () => {
    errorDisplay.textContent = '';
    errorDisplay.classList.remove('show');
};

// 行番号を更新する関数（Ace.jsが自動で行うため削除）
const updateLineNumbers = () => {
    // Ace.jsが自動で行番号を管理するため、この関数は不要
};

// エラー行をハイライトする関数
const highlightErrorLines = (errorMessage: string) => {
    // 行番号を抽出してハイライト
    const lineMatches = errorMessage.match(/行\s*(\d+)/g);
    if (lineMatches) {
        const lines = lineMatches.map(match => parseInt(match.replace(/行\s*/, ''), 10));
        
        // Ace.jsエディターで該当行をハイライト
        lines.forEach(lineNumber => {
            if (lineNumber > 0) {
                // エラー行にスクロール
                aceEditor.gotoLine(lineNumber, 0, true);
                
                // アノテーションでエラーマークを表示
                const annotations = aceEditor.getSession().getAnnotations();
                annotations.push({
                    row: lineNumber - 1,
                    column: 0,
                    text: 'シェーダーエラー',
                    type: 'error'
                });
                aceEditor.getSession().setAnnotations(annotations);
            }
        });
    }
};

// 行番号とテキストエリアの同期スクロール（Ace.jsが自動で行うため削除）
const syncScroll = () => {
    // Ace.jsが自動でスクロールを管理するため、この関数は不要
};

// ローカルストレージ関連の定数
const STORAGE_KEY = 'pale-sound-maker-shader';
const STORAGE_PREFIX = 'pale-sound-maker-project-';

// ローカルストレージからシェーダーコードを読み込む
const loadFromLocalStorage = () => {
    try {
        const savedShader = localStorage.getItem(STORAGE_KEY);
        if (savedShader) {
            aceEditor.setValue(savedShader, -1);
            console.log('シェーダーコードを復元しました');
        }
    } catch (error) {
        console.error('ローカルストレージからの読み込みエラー:', error);
    }
};

// ローカルストレージにシェーダーコードを保存する
const saveToLocalStorage = () => {
    try {
        localStorage.setItem(STORAGE_KEY, aceEditor.getValue());
        console.log('シェーダーコードを保存しました');
        return true;
    } catch (error) {
        console.error('ローカルストレージへの保存エラー:', error);
        return false;
    }
};

// 自動保存機能（テキストエリアの変更時に呼び出される）
const autoSave = () => {
    saveToLocalStorage();
};

// ファイルエクスポート機能
const exportToFile = () => {
    try {
        const shaderCode = aceEditor.getValue();
        const blob = new Blob([shaderCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sound-shader-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.glsl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('シェーダーファイルをエクスポートしました');
        return true;
    } catch (error) {
        console.error('ファイルエクスポートエラー:', error);
        return false;
    }
};

// ファイルインポート機能
const importFromFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('ファイルの読み込みに失敗しました'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('ファイルの読み込み中にエラーが発生しました'));
        };
        
        reader.readAsText(file);
    });
};

// プロジェクト管理機能
const saveProject = (name: string) => {
    try {
        const projectData = {
            name,
            shaderCode: aceEditor.getValue(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(projectData));
        console.log(`プロジェクト "${name}" を保存しました`);
        return true;
    } catch (error) {
        console.error('プロジェクト保存エラー:', error);
        return false;
    }
};

const loadProject = (name: string) => {
    try {
        const saved = localStorage.getItem(STORAGE_PREFIX + name);
        if (saved) {
            const projectData = JSON.parse(saved);
            aceEditor.setValue(projectData.shaderCode, -1);
            console.log(`プロジェクト "${name}" を読み込みました`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('プロジェクト読み込みエラー:', error);
        return false;
    }
};

const getProjectList = () => {
    try {
        const projects = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                const name = key.substring(STORAGE_PREFIX.length);
                const data = JSON.parse(localStorage.getItem(key)!);
                projects.push({
                    name,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            }
        }
        return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
        console.error('プロジェクト一覧取得エラー:', error);
        return [];
    }
};

const deleteProject = (name: string) => {
    try {
        localStorage.removeItem(STORAGE_PREFIX + name);
        console.log(`プロジェクト "${name}" を削除しました`);
        return true;
    } catch (error) {
        console.error('プロジェクト削除エラー:', error);
        return false;
    }
};

const showProjectDialog = () => {
    const projects = getProjectList();
    let dialogHTML = '保存されたプロジェクト:\n\n';
    
    if (projects.length === 0) {
        dialogHTML += '保存されたプロジェクトはありません。';
    } else {
        projects.forEach((project, index) => {
            dialogHTML += `${index + 1}. ${project.name} (${new Date(project.updatedAt).toLocaleString()})\n`;
        });
    }
    
    dialogHTML += '\n読み込みたいプロジェクト番号を入力してください (キャンセルする場合は空欄):';
    
    const input = prompt(dialogHTML);
    if (input && input.trim()) {
        const index = parseInt(input.trim()) - 1;
        if (index >= 0 && index < projects.length) {
            const confirmed = confirm(`プロジェクト "${projects[index].name}" を読み込みますか？現在の内容は失われます。`);
            if (confirmed) {
                if (loadProject(projects[index].name)) {
                    hideError();
                    return true;
                }
            }
        } else {
            alert('無効な番号です。');
        }
    }
    return false;
};

const showSaveProjectDialog = () => {
    const name = prompt('プロジェクト名を入力してください:');
    if (name && name.trim()) {
        const trimmedName = name.trim();
        
        // 既存プロジェクトのチェック
        const existing = localStorage.getItem(STORAGE_PREFIX + trimmedName);
        if (existing) {
            const confirmed = confirm(`プロジェクト "${trimmedName}" は既に存在します。上書きしますか？`);
            if (!confirmed) {
                return false;
            }
        }
        
        return saveProject(trimmedName);
    }
    return false;
};

// コンパイルボタンのイベントリスナー
compileButton.addEventListener('click', () => {
    if (isCompiling) return;
    
    isCompiling = true;
    compileButton.disabled = true;
    compileButton.textContent = 'コンパイル中...';
    hideError();
    
    try {
        const shaderCode = aceEditor.getValue();
        
        // エラーアノテーションをクリア
        aceEditor.getSession().setAnnotations([]);
        
        // シェーダーを更新
        const result = updateShader(glslSoundWrapper, shaderCode);
        
        if (result.success) {
            // 成功時：再生位置をリセット
            currentTime = 0;
            isPlaying = false;
            playButton.textContent = '再生';
            resetSoundPosition(glslSoundWrapper);
            updateTimeDisplay();
            
            console.log('シェーダーコンパイル成功');
        } else {
            // エラー時：エラーメッセージを表示
            const errorMessage = result.error || 'Unknown compilation error';
            showError(errorMessage);
            highlightErrorLines(errorMessage);
            console.error('シェーダーコンパイルエラー:', result.error);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
        showError(errorMessage);
        highlightErrorLines(errorMessage);
        console.error('予期しないエラー:', error);
    } finally {
        isCompiling = false;
        compileButton.disabled = false;
        compileButton.textContent = 'コンパイル';
    }
});

// リセットボタンのイベントリスナー
resetButton.addEventListener('click', () => {
    if (isCompiling) return;
    
    aceEditor.setValue(originalShaderCode, -1);
    aceEditor.getSession().setAnnotations([]);
    hideError();
    
    // 元のシェーダーでコンパイル
    const result = updateShader(glslSoundWrapper, originalShaderCode);
    
    if (result.success) {
        currentTime = 0;
        isPlaying = false;
        playButton.textContent = '再生';
        resetSoundPosition(glslSoundWrapper);
        updateTimeDisplay();
        
        console.log('シェーダーをリセットしました');
    } else {
        showError(result.error || 'Reset failed');
        console.error('リセットエラー:', result.error);
    }
});

// 保存ボタンのイベントリスナー（プロジェクト管理機能）
saveButton.addEventListener('click', () => {
    if (showSaveProjectDialog()) {
        // 成功時の視覚的フィードバック
        saveButton.textContent = '保存完了！';
        setTimeout(() => {
            saveButton.textContent = '保存';
        }, 1000);
    } else {
        // エラー時の視覚的フィードバック
        saveButton.textContent = '保存エラー';
        setTimeout(() => {
            saveButton.textContent = '保存';
        }, 1000);
    }
});

// 読み込みボタンのイベントリスナー（プロジェクト管理機能）
loadButton.addEventListener('click', () => {
    if (showProjectDialog()) {
        // 成功時の視覚的フィードバック
        loadButton.textContent = '読み込み完了！';
        setTimeout(() => {
            loadButton.textContent = '読み込み';
        }, 1000);
    }
});

// エクスポートボタンのイベントリスナー
exportButton.addEventListener('click', () => {
    if (exportToFile()) {
        // 成功時の視覚的フィードバック
        exportButton.textContent = 'エクスポート完了！';
        setTimeout(() => {
            exportButton.textContent = 'エクスポート';
        }, 1000);
    } else {
        // エラー時の視覚的フィードバック
        exportButton.textContent = 'エクスポートエラー';
        setTimeout(() => {
            exportButton.textContent = 'エクスポート';
        }, 1000);
    }
});

// インポートボタンのイベントリスナー
importButton.addEventListener('click', () => {
    fileInput.click();
});

// ファイル選択時のイベントリスナー
fileInput.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
        const confirmed = confirm('現在の内容を破棄してファイルを読み込みますか？');
        if (confirmed) {
            try {
                const shaderCode = await importFromFile(file);
                aceEditor.setValue(shaderCode, -1);
                aceEditor.getSession().setAnnotations([]);
                hideError();
                
                // 成功時の視覚的フィードバック
                importButton.textContent = 'インポート完了！';
                setTimeout(() => {
                    importButton.textContent = 'インポート';
                }, 1000);
                
                console.log('シェーダーファイルをインポートしました');
            } catch (error) {
                console.error('ファイルインポートエラー:', error);
                showError(error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました');
                
                // エラー時の視覚的フィードバック
                importButton.textContent = 'インポートエラー';
                setTimeout(() => {
                    importButton.textContent = 'インポート';
                }, 1000);
            }
        }
    }
    
    // ファイル選択をリセット
    target.value = '';
});

// Ace.jsエディターのイベントリスナー（自動保存）
aceEditor.on('change', () => {
    autoSave();
});

// ドラッグ&ドロップ機能
const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    shaderEditorContainer.style.backgroundColor = '#e8f5e8';
};

const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    shaderEditorContainer.style.backgroundColor = '#fff';
};

const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    shaderEditorContainer.style.backgroundColor = '#fff';
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        
        // ファイルタイプのチェック
        if (!file.name.endsWith('.glsl') && !file.name.endsWith('.txt')) {
            showError('GLSLファイル (.glsl) またはテキストファイル (.txt) のみ対応しています。');
            return;
        }
        
        const confirmed = confirm(`ファイル "${file.name}" を読み込みますか？現在の内容は失われます。`);
        if (confirmed) {
            try {
                const shaderCode = await importFromFile(file);
                aceEditor.setValue(shaderCode, -1);
                aceEditor.getSession().setAnnotations([]);
                hideError();
                console.log(`ファイル "${file.name}" をドラッグ&ドロップで読み込みました`);
            } catch (error) {
                console.error('ドラッグ&ドロップエラー:', error);
                showError(error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました');
            }
        }
    }
};

// ドラッグ&ドロップイベントリスナー
shaderEditorContainer.addEventListener('dragover', handleDragOver);
shaderEditorContainer.addEventListener('dragleave', handleDragLeave);
shaderEditorContainer.addEventListener('drop', handleDrop);

// 初期化
loadFromLocalStorage();

const main = () => {
    loadSound(glslSoundWrapper);
    // 自動再生を削除し、手動再生に変更
    updateTimeDisplay();
};

main();
