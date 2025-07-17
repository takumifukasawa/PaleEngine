import {
    createGLSLSound,
    getGLSLSoundCurrentTime,
    GLSLSound,
    loadGLSLSound,
    playGLSLSound,
    setGLSLSoundVolume, stopGLSLSound
} from '@/PaleGL/core/glslSound.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { parseShaderError, formatShaderError } from '@/PaleGL/utilities/shaderErrorParser.ts';

export type GLSLSoundWrapper = {
    glslSound: GLSLSound;
    isPlaying: boolean;
    // load: () => void;
    // play: (args?: { volume?: number; time?: number; reload?: boolean }) => void;
    // stop: () => void;
    // getCurrentTime: () => number | undefined;
}

export function createGLSLSoundWrapper(gpu: Gpu, shader: string, duration: number): GLSLSoundWrapper {
    const glslSound: GLSLSound = createGLSLSound(gpu, shader, duration);
    // let _isPlaying = false;

    // const load = () => {
    //     glslSound = 
    // };

    // const warmup = () => {
    //     glslSound?.setVolume(0);
    //     glslSound?.play(0);
    // };

    // const play = ({ volume = 1, time = 0, reload = false }: { volume?: number; time?: number, reload?: boolean } = {}) => {
    //     console.log(`[glslSoundWrapper.play] play time: ${time}`);
    //     if (reload) {
    //         stop();
    //         // 120BPM x 64measure = 128sec
    //         // 120BPM x 72measure = 144sec
    //         load();
    //     }
    //     _isPlaying = true;
    //     glslSound?.setVolume(volume);
    //     glslSound?.play(time);
    //     setGLSLSoundVolume(glslSound, volume);
    // };

    // const stop = () => {
    //     if(!_isPlaying) {
    //         return;
    //     }
    //     console.log('[glslSoundWrapper.stop]');
    //     _isPlaying = false;
    //     glslSound?.stop();
    // };
    // 
    // const isPlaying = () => _isPlaying;
    // 
    // const getCurrentTime = () => {
    //     return glslSound?.getCurrentTime();
    // }

    return {
        glslSound,
        isPlaying: false,
        // load,
        // play,
        // stop,
        // getCurrentTime
        // warmup,
    };
}

export function loadSound(glslSoundWrapper: GLSLSoundWrapper) {
    loadGLSLSound(glslSoundWrapper.glslSound);
}

export function playSound(glslSoundWrapper: GLSLSoundWrapper, args: { volume?: number; time?: number; reload?: boolean } = {}) {
    const { volume = 1, time = 0, reload = false } = args;
    console.log(`[glslSoundWrapper.play] args - volume: ${volume}, time: ${time}, reload: ${reload}`);
    if (reload) {
        stop();
        loadSound(glslSoundWrapper);
    }
    glslSoundWrapper.isPlaying = true;
    setGLSLSoundVolume(glslSoundWrapper.glslSound, volume);
    playGLSLSound(glslSoundWrapper.glslSound, time);
    setGLSLSoundVolume(glslSoundWrapper.glslSound, volume);
}

export function stopSound(glslSoundWrapper: GLSLSoundWrapper) {
    if (!glslSoundWrapper.isPlaying) {
        return;
    }
    console.log('[glslSoundWrapper.stop]');
    glslSoundWrapper.isPlaying = false;
    stopGLSLSound(glslSoundWrapper.glslSound);
}

export function resetSoundPosition(glslSoundWrapper: GLSLSoundWrapper) {
    console.log('[glslSoundWrapper.resetPosition]');
    glslSoundWrapper.glslSound.currentTime = 0;
    glslSoundWrapper.glslSound.startTime = 0;
    glslSoundWrapper.glslSound.offsetTime = 0;
}

export function updateShader(glslSoundWrapper: GLSLSoundWrapper, newShader: string): { success: boolean; error?: string } {
    try {
        console.log('[glslSoundWrapper.updateShader] Updating shader...');
        
        // 現在再生中の場合は停止
        const wasPlaying = glslSoundWrapper.isPlaying;
        if (wasPlaying) {
            stopSound(glslSoundWrapper);
        }
        
        // 新しいシェーダーでGLSLSoundを再作成
        const newGlslSound = createGLSLSound(glslSoundWrapper.glslSound.gpu, newShader, glslSoundWrapper.glslSound.duration);
        
        // 音源データを再生成
        loadGLSLSound(newGlslSound);
        
        // 古いGLSLSoundを新しいものに置き換え
        glslSoundWrapper.glslSound = newGlslSound;
        glslSoundWrapper.isPlaying = false;
        
        console.log('[glslSoundWrapper.updateShader] Shader updated successfully');
        return { success: true };
        
    } catch (error) {
        console.error('[glslSoundWrapper.updateShader] Error updating shader:', error);
        
        // エラーメッセージを解析してフォーマット
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const parsedError = parseShaderError(errorMessage);
        const formattedError = formatShaderError(parsedError);
        
        return { 
            success: false, 
            error: formattedError
        };
    }
}

export function getSoundCurrentTime(glslSoundWrapper: GLSLSoundWrapper) {
    return getGLSLSoundCurrentTime(glslSoundWrapper.glslSound);
}
