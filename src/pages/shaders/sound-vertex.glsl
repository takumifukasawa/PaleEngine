// ref:
// https://www.shadertoy.com/view/flcyRH
// https://github.com/0b5vr/wavenerd-dubplates/blob/main/shaders/20241117_planefiller.glsl

#version 300 es

precision highp float;

#include <common>
#include <rand>
#include <perlin>

uniform float uBlockOffset;
uniform float uSampleRate;

out vec2 vSound;

// --- custom begin

#define BPM 124.
// #define SAMPLE_RATE 44100.

// --- custom end

// #define PI 3.1415
#define TAU 6.2831

#define SA(a) clamp(a, 0., 1.)

#define tri(p) (1.-4.*abs(fract(p)-0.5))
#define repeat(i, n) for (int i = ZERO; i < n; i++)
#define lofi(i,m) (floor((i)/(m))*(m))

// #define saturate(x) clamp( x, 0.0, 1.0 )
#define linearstep(a,b,t) saturate( ( ( t ) - ( a ) ) / ( ( b ) - ( a ) ) )
#define smootherstep(t) ( t * t * t * ( t * ( t * 6.0 - 15.0 ) + 10.0 ) )

#define T1 1.
#define T2 2.
#define T4 4.
#define T8 8.
#define T16 16.
#define T32 32.

#define N2(a, b) (a | (b << 8))
#define N3(a, b, c) (a | (b << 8) | (c << 16))
#define N4(a, b, c, d) (a | (b << 8) | (c << 16) | (d << 24))
#define N5(a, b, c, d, e) (a | (b << 8) | (c << 16) | (d << 24) | (e << 32))

#define O(a) 0, a

#define S(a) 1, a

#define CH(a,b) a, b

#define Ab1N 32
#define Ab1F 32.
#define Eb2N 39
#define Eb2F 39.
#define Ab2N 44
#define Ab2F 44.
#define Ab3N 56
#define Ab3F 56.
#define Eb3N 51
#define Eb3F 51.
#define B2N 47
#define B2F 47.
#define Bb3N 58
#define Bb3F 58.
#define B3N 59
#define B3F 59.
#define Eb4N 63
#define Eb4F 63.
#define F4N 65
#define F4F 65.

// base
#define B0(a) 23, a
#define Eb1(a) 27, a
#define E1(a) 28, a
#define F1(a) 29, a
#define Gb1(a) 30, a
#define G1(a) 31, a
#define Ab1(a) Ab1N, a
#define A1(a) 33, a
#define Bb1(a) 34, a
#define B1(a) 35, a
#define C2(a) 36, a
#define Db2(a) 37, a
#define Eb2(a) 39, a
#define E2(a) 40, a
#define F2(a) 41, a
#define Gb2(a) 42, a
#define G2(a) 43, a
#define Ab2(a) Ab2N, a
#define A2(a) 45, a
#define Bb2(a) 46, a
#define B2(a) B2N, a
#define C3(a) 48, a
#define Db3(a) 49, a
#define D3(a) 50, a
#define Eb3(a) 51, a
#define E3(a) 52, a
#define F3(a) 53, a
#define Gb3(a) 54, a
#define G3(a) 55, a
#define Ab3(a) Ab3N, a
#define A3(a) 57, a
#define Bb3(a) Bb3N, a
#define B3(a) B3N, a
#define C4(a) 60, a
#define Db4(a) 61, a
#define D4(a) 62, a
#define Eb4(a) Eb4N, a
#define E4(a) 64, a
#define F4(a) F4N, a
#define Gb4(a) 66, a
#define G4(a) 67, a
#define Ab4(a) 68, a
#define A4(a) 69, a
#define Bb4(a) 70, a
#define B4(a) 71, a
#define C5(a) 72, a
#define Db5(a) 73, a
#define D5(a) 74, a
#define Eb5(a) 75, a
#define E5(a) 76, a
#define F5(a) 77, a
#define Gb5(a) 78, a
#define G5(a) 79, a
#define Ab5(a) 80, a
#define A5(a) 81, a
#define Bb5(a) 82, a
#define B5(a) 83, a
#define C6(a) 84, a
#define Db6(a) 85, a
#define D6(a) 86, a
#define Eb6(a) 87, a
#define E6(a) 88, a

/*
MIDI Number,Note Name,Frequency
21,A0,27.5
22,Bb0,29.14
23,B0,30.87
24,C1,32.7
25,Db1,34.65
26,D1,36.71
27,Eb1,38.89
28,E1,41.2
29,F1,43.65
30,Gb1,46.25
31,G1,49.0
32,Ab1,51.91
33,A1,55.0
34,Bb1,58.27
35,B1,61.74
36,C2,65.41
37,Db2,69.3
38,D2,73.42
39,Eb2,77.78
40,E2,82.41
41,F2,87.31
42,Gb2,92.5
43,G2,98.0
44,Ab2,103.83
45,A2,110.0
46,Bb2,116.54
47,B2,123.47
48,C3,130.81
49,Db3,138.59
50,D3,146.83
51,Eb3,155.56
52,E3,164.81
53,F3,174.61
54,Gb3,185.0
55,G3,196.0
56,Ab3,207.65
57,A3,220.0
58,Bb3,233.08
59,B3,246.94
60,C4,261.63
61,Db4,277.18
62,D4,293.66
63,Eb4,311.13
64,E4,329.63
65,F4,349.23
66,Gb4,369.99
67,G4,392.0
68,Ab4,415.3
69,A4,440.0
70,Bb4,466.16
71,B4,493.88
72,C5,523.25
73,Db5,554.37
74,D5,587.33
75,Eb5,622.25
76,E5,659.26
77,F5,698.46
78,Gb5,739.99
79,G5,783.99
80,Ab5,830.61
81,A5,880.0
82,Bb5,932.33
83,B5,987.77
84,C6,1046.5
85,Db6,1108.73
86,D6,1174.66
87,Eb6,1244.51
88,E6,1318.51
89,F6,1396.91
90,Gb6,1479.98
91,G6,1567.98
92,Ab6,1661.22
93,A6,1760.0
94,Bb6,1864.66
95,B6,1975.53
96,C7,2093.0
97,Db7,2217.46
98,D7,2349.32
99,Eb7,2489.02
100,E7,2637.02
101,F7,2793.83
102,Gb7,2959.96
103,G7,3135.96
104,Ab7,3322.44
105,A7,3520.0
106,Bb7,3729.31
107,B7,3951.07
108,C8,4186.01
*/

// https://www.shadertoy.com/view/XlXcW4
vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

// https://www.shadertoy.com/view/4djSRW
vec4 noise(float p) {
    vec4 p4 = fract(vec4(p) * vec4(.1050, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 55.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

// https://www.shadertoy.com/view/4sSSWz
float noise2(float phi) { return fract(sin(phi * 0.055753) * 122.3762) * 4.0 - 3.0; }

// ----------

// quantize https://www.shadertoy.com/view/ldfSW2
float quan(float s, float c) {
    return floor(s / c) * c;
}

float nse(float x) {
    return fract(sin(x * 110.082) * 19871.8972);
}

float dist(float s, float d) {
    return clamp(s * d, -1., 1.);
}

// 4拍で1小節
float beatToMeasure(float beat) {
    return beat * .25;
}

// time[sec]
float timeToBeat(float time) {
    return time / 60. * BPM;
}

float beatToTime(float beat) {
    return beat / BPM * 60.;
}

bool isInMeasure(float measure, float start, float end) {
    return start <= measure && measure < end;
}

float measureRange(float measure, float start, float end) {
    return step(start, measure) * (1. - step(end, measure));
}

float measureNorRange(float measure, float start, float end) {
    return 1. - step(start, measure) * (1. - step(end, measure));
}

#define BEAT_TO_TIME(beat) beat / BPM * 60.

// MIDI:69 = NOTE:A4 = 440Hz
// なんで12で割るのかはわからない. 半音含め12で1オクターブ変わるから？このあたり？
// https://newt.phys.unsw.edu.au/jw/notes.html
// 多分これが式
// https://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
float noteToFreq(float n) {
    return 440. * pow(2., (n - 69.) / 12.);
}

float sine(float freq, float time) {
    return sin(freq * TAU * time);
}

float sine(float phase) {
    return sin(TAU * phase);
}

float rhy(float time, float fade) {
    return pow(fract(-time), 6. - fade * 3.);
}

vec2 delay(float time, float dt) {
    return exp(-2. * dt) * sin(6.4831 * 440. * time) * vec2(rhy(time - dt * .3, dt), rhy(time - dt * .5, dt));
}


// ----------------------------------------------------------------

// マルチタップディレイリバーブ
vec2 reverb(vec2 input, float time, float roomSize, float damping, float wetLevel) {
    vec2 wet = vec2(0.0);
    
    // 早期反射 (Early Reflections)
    float earlyDelays[8] = float[8](
        0.011, 0.019, 0.023, 0.031,
        0.037, 0.043, 0.047, 0.053
    );
    
    for(int i = 0; i < 8; i++) {
        float delayTime = earlyDelays[i] * roomSize;
        float attenuation = exp(-float(i) * 0.2) * 0.25;
        
        // ステレオスプレッド用の位相シフト
        float phaseL = time - delayTime;
        float phaseR = time - (delayTime * 1.1);
        
        wet.x += input.x * attenuation * sin(phaseL * 100.0) * exp(-phaseL * damping);
        wet.y += input.y * attenuation * sin(phaseR * 100.0) * exp(-phaseR * damping);
    }
    
    // 後期反射 (Late Reflections) - より長い遅延
    float lateDelays[6] = float[6](
        0.067, 0.089, 0.113, 0.137, 0.167, 0.193
    );
    
    for(int i = 0; i < 6; i++) {
        float delayTime = lateDelays[i] * roomSize * 2.0;
        float attenuation = exp(-float(i + 8) * 0.25) * 0.2;
        
        // フィードバック付きコムフィルター効果
        float phaseL = time - delayTime;
        float phaseR = time - (delayTime * 0.9);
        
        float filterL = sin(phaseL * 50.0) * exp(-phaseL * damping * 2.0);
        float filterR = sin(phaseR * 55.0) * exp(-phaseR * damping * 2.0);
        
        wet.x += input.x * attenuation * filterL;
        wet.y += input.y * attenuation * filterR;
    }
    
    // 拡散用オールパスフィルター効果
    float diffusionTime = 0.031 * roomSize;
    float diffusionL = sin((time - diffusionTime) * 80.0) * exp(-(time - diffusionTime) * damping);
    float diffusionR = sin((time - diffusionTime * 1.2) * 85.0) * exp(-(time - diffusionTime * 1.2) * damping);
    
    wet.x += input.y * 0.2 * diffusionL; // クロスフィード
    wet.y += input.x * 0.2 * diffusionR;
    
    // ダンピング処理（高域減衰）
    wet *= (1.0 - damping * 0.5);
    
    // ドライ/ウェットミックス
    return mix(input, input + wet, wetLevel);
}

// サワサワ感のための高品質ノイズテクスチャ
float smoothNoise(float x) {
    float f0 = floor(x);
    float f1 = f0 + 1.0;
    float t = x - f0;
    t = t * t * (3.0 - 2.0 * t); // smoothstep
    
    float v0 = fract(sin(f0 * 12.9898 + 78.233) * 43758.5453);
    float v1 = fract(sin(f1 * 12.9898 + 78.233) * 43758.5453);
    
    return mix(v0, v1, t) * 2.0 - 1.0;
}

// 複数オクターブのノイズ（フラクタルノイズ）
float fractalNoise(float x, int octaves) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for(int i = 0; i < octaves; i++) {
        value += smoothNoise(x * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value / maxValue;
}

// ざわめきエフェクト
vec2 rustleEffect(vec2 input, float time, float intensity, float speed) {
    vec2 rustle = vec2(0.0);
    
    // 複数の周波数でざわめきを作成
    float baseFreq = speed * 0.5;
    
    // 低域ざわめき（遠くの人の話し声的な）
    float lowRustle = fractalNoise(time * baseFreq * 0.3, 4) * 0.6;
    
    // 中域ざわめき（紙のざわめき的な）
    float midRustle = fractalNoise(time * baseFreq * 1.2, 6) * 0.8;
    
    // 高域ざわめき（細かいノイズ）
    float highRustle = fractalNoise(time * baseFreq * 3.5, 8) * 0.5;
    
    // ステレオフィールドでのざわめき
    float leftPhase = time * baseFreq + 0.3;
    float rightPhase = time * baseFreq * 1.1 + 0.7;
    
    rustle.x = (lowRustle + midRustle + highRustle) * fractalNoise(leftPhase, 3);
    rustle.y = (lowRustle + midRustle + highRustle) * fractalNoise(rightPhase, 3);
    
    // ざわめきの動的な変化（波のような強弱）
    float wave = sin(time * speed * 0.1) * 0.5 + 0.5;
    rustle *= wave * intensity;
    
    // 元の音に微細なざわめきを追加
    return input + rustle * 0.35;
}

float saw(float note, float phase) {
    return 2. * fract(phase) - 1.;
}

float square(float note, float phase) {
    return fract(phase) < .5 ? -1. : 1.;
}

float triangle(float note, float phase) {
    return 1. - 4. * abs(fract(phase) - .5);
}


// // low pass filter
// // 広域カット
// // ref: https://www.shadertoy.com/view/4sjSW1 
// float lowPassFilter(float inp, float cut_lp, float res_lp) {
//     float n1 = 0.0;
//     float n2 = 0.0;
//     float n3 = 0.0;
//     float n4 = 0.0;
//     float fb_lp = 0.0;
//     float fb_hp = 0.0;
//     float hp = 0.0;
//     float p4=1.0e-24;
//     fb_lp 	= res_lp+res_lp/(1.0-cut_lp + 1e-20);
//     n1 		= n1+cut_lp*(inp-n1+fb_lp*(n1-n2))+p4;
//     n2		= n2+cut_lp*(n1-n2);
//     return n2;
// }


// low pass filter (高域カット)
vec2 lowPassFilter(vec2 input, float cutoffFreq) {
    float sampleRate = 44100.;
    float rc = 1.0 / (TAU * cutoffFreq);
    float dt = 1.0 / sampleRate;
    float alpha = dt / (rc + dt);
    
    // 簡易的なローパスフィルター実装
    // LPF = input * alpha (高周波を減衰)
    return input * alpha + input * (1.0 - alpha) * 0.5;
}

// high pass filter (低域カット)
vec2 highPassFilter(vec2 input, float cutoffFreq) {
    float sampleRate = 44100.;
    float rc = 1.0 / (TAU * cutoffFreq);
    float dt = 1.0 / sampleRate;
    float alpha = rc / (rc + dt);
    
    // 簡易的なハイパスフィルター実装
    // HPF = input - LPF(input) の原理を応用
    vec2 lowPassed = input * (1.0 - alpha);
    return input - lowPassed;
}

// ピンクノイズ（1/f特性）- アナログ感の基礎
float pinkNoise(float x) {
    // 複数オクターブのノイズを重ねて1/f特性を近似
    float n = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    
    for(int i = 0; i < 6; i++) {
        n += smoothNoise(x * frequency) * amplitude;
        amplitude *= 0.5;  // 各オクターブで振幅半減
        frequency *= 2.0;
    }
    
    return n * 0.3; // 適度な範囲に正規化
}

// アナログ感のあるLFO
float analogLFO(float time, float freq, int waveform, float drift, float instability) {
    // 基本周波数にドリフトを追加（アナログの周波数不安定性）
    float driftedFreq = freq * (1.0 + pinkNoise(time * 0.1) * drift);
    
    // 基本波形
    float lfo = 0.0;
    float phase = time * driftedFreq;
    
    if (waveform == 0) {
        // アナログ正弦波 - 微細な歪みを追加
        lfo = sin(TAU * phase);
        lfo += sin(TAU * phase * 3.0) * 0.05; // 3次高調波歪み
        lfo += pinkNoise(time * 10.0) * 0.03; // ノイズ混入
    }
    else if (waveform == 1) {
        // アナログ三角波 - 丸みを帯びた
        float t = fract(phase);
        lfo = abs(t * 2.0 - 1.0) * 2.0 - 1.0;
        lfo = sign(lfo) * pow(abs(lfo), 0.8); // 軽い丸み
    }
    else if (waveform == 2) {
        // アナログのこぎり波 - 温かみのある
        float t = fract(phase);
        lfo = t * 2.0 - 1.0;
        lfo += sin(TAU * phase * 2.0) * 0.1; // 2次高調波
    }
    else if (waveform == 3) {
        // アナログ矩形波 - エッジが丸い
        float t = fract(phase);
        lfo = t < 0.5 ? -1.0 : 1.0;
        lfo = tanh(lfo * 8.0); // エッジを丸く
    }
    
    // 振幅の不安定性（アナログVCAの特性）
    float ampModulation = 1.0 + pinkNoise(time * 0.3) * instability;
    
    // 温度変化シミュレーション（ゆっくりとした変動）
    float temperatureDrift = sin(time * 0.02) * 0.02;
    
    return lfo * ampModulation * (1.0 + temperatureDrift);
}

// マルチLFO（複数のLFOを組み合わせ）
float multiLFO(float time, float baseFreq, float complexity) {
    float lfo1 = analogLFO(time, baseFreq, 0, 0.05, 0.03);           // メイン正弦波
    float lfo2 = analogLFO(time, baseFreq * 1.3, 1, 0.03, 0.02);    // 三角波でモジュレーション
    float lfo3 = analogLFO(time, baseFreq * 0.7, 2, 0.02, 0.01);    // のこぎり波で微細変調
    
    // 複雑さに応じてミックス
    return lfo1 + lfo2 * complexity * 0.3 + lfo3 * complexity * 0.2;
}

// サイドチェイン用キックドラムのエンベロープ検出
float kickEnvelope(vec2 kickSound, float attackTime, float releaseTime) {
    // キックの音量を検出
    float kickLevel = length(kickSound);
    
    // エンベロープフォロワー
    // アタック（キックが鳴った瞬間に素早く反応）
    float attack = 1.0 - smoothstep(0.0, attackTime, kickLevel);
    
    // リリース（キックが減衰するにつれてゆっくり戻る）
    float release = 1.0 - exp(-releaseTime * kickLevel);
    
    return min(attack, release);
}

// ハウス風サイドチェインコンプレッサー
vec2 sidechainCompress(vec2 input, vec2 kickTrigger, float intensity, float time) {
    // キックの強度を検出
    float kickStrength = length(kickTrigger);
    
    // BPMに同期したサイドチェインパターン（124 BPM = 4/4拍子）
    float beat = timeToBeat(time);
    float beatPhase = fract(beat * 0.5); // 8分音符でのフェーズ
    
    // キックタイミングでのサイドチェイン
    float sidechainEnv = 1.0;
    
    if (kickStrength > 0.01) {
        // キック発生時の圧縮カーブ
        float compressTime = beatPhase * 2.0; // 0-2の範囲
        
        // ハウス特有の"パンピング"効果
        float pumpCurve = exp(-compressTime * 8.0) * (1.0 - exp(-compressTime * 25.0));
        
        // サイドチェインの深さ
        sidechainEnv = 1.0 - (pumpCurve * intensity * kickStrength * 5.0);
        sidechainEnv = clamp(sidechainEnv, 0.1, 1.0); // 完全にミュートしない
    }
    
    return input * sidechainEnv;
}


// ----------------------------------------------------------------
// effects
// ----------------------------------------------------------------

float smoothInEnvelope(float t, float is, float io, float so) {
    float rt = clamp(0., 1., mix(is, io, (t - is) / (io - is)));
    // return mix(0., 1., rt) * max(.5, exp(t * so));
    // return mix(0., 1., rt);
    return smoothstep(is, io, t) * max(.5, exp(t * so));
}

float sineWave(float t, float phase, float s) {
  return sin(t * phase * PI) * s + (1. - s);
}

// ii: attack in
// io: attack out
// ik: attack min vol
// dk: decay power
// km: sustain
// oi: release in
// oo: release out
// ok: release max vol
float sustainedFX(float ii, float io, float ik, float dk, float km, float oi, float oo, float ok, float t) {
    return ((1. - ik) + smoothstep(ii, io, t) * ik) * max(exp(-dk * t + io), km) * (1. - smoothstep(oi, oo, t) * ok);
}


// --- base

// ref: https://www.shadertoy.com/view/ldXXDj
float base( float note, float time )
{
    float freq = noteToFreq(note);
    float ph = 1.0;
    ph *= sin(6.283185*freq*time*2.0);
    ph *= 0.5+0.5*max(0.0,5.0-0.01*freq);
    ph *= exp(-time*freq*0.2);

    float y = 0.0;
    y += 0.70*sin(1.00*TAU*freq*time+ph)*exp2(-0.7*0.007*freq*time);
    y += 0.20*sin(2.01*TAU*freq*time+ph)*exp2(-0.7*0.011*freq*time);
    y += 0.20*sin(3.01*TAU*freq*time+ph)*exp2(-0.7*0.015*freq*time);
    y += 0.16*sin(4.01*TAU*freq*time+ph)*exp2(-0.7*0.018*freq*time);
    y += 0.13*sin(5.01*TAU*freq*time+ph)*exp2(-0.7*0.021*freq*time);
    y += 0.10*sin(6.01*TAU*freq*time+ph)*exp2(-0.7*0.027*freq*time);
    y += 0.09*sin(8.01*TAU*freq*time+ph)*exp2(-0.7*0.030*freq*time);
    y += 0.07*sin(9.01*TAU*freq*time+ph)*exp2(-0.7*0.033*freq*time);

    y += 0.35*y*y*y;
    y += 0.10*y*y*y;

    y *= 1.0 + 1.5*exp(-8.0*time);
    y *= clamp( time/0.004, 0.0, 1.0 );

    y *= 2.5-1.5*clamp( log2(freq)/10.0,0.0,1.0);
    y *= .1;
    return y;
}

// --- drums

vec2 kick(float note, float time) {
    // float amp = exp(-5. * time);
    // float phase = 50. * time - 10. * exp(-70. * time);
    // return amp * sine(phase);

    float amp = exp(-3.2 * time);
    float phase = 35. * time - 16. * exp(-60. * time);
    return vec2(amp * sine(phase));
}

vec2 kickLow(float note, float time) {
    float amp = exp(-3.2 * time);
    float phase = 15. * time - 16. * exp(-25. * time);
    return vec2(amp * sine(phase));
}

vec2 kickAttack(float note, float t) {
    float i = t * uSampleRate;
    float env = exp(-t * 28.);
    float v = .5 * env * (.7 * noise2(i) + .38 * sin(45. * i));
    return vec2(v);
}

vec2 hihat1(float note, float time) {
    float amp = exp(-50. * time);
    return amp * noise(time * 100.).xy;
}

vec2 hihat2(float note, float time) {
    float amp = exp(-70. * time);
    return amp * noise(time * 300.).xy;
}

vec2 snare(float note, float t) {
    float i = t * uSampleRate;
    float env = exp(-t * 17.);
    float v = .3 * env * (2.3 * noise2(i) + .5 * sin(30. * i));
    return vec2(v);
}

vec2 snareFill(float note, float t) {
    float i = t * uSampleRate;
    float env = exp(-t * 30.);
    float v = .2 * env * (2.3 * noise2(i) + .5 * sin(30. * i));
    return vec2(v);
}

vec2 crash1(float note, float time) {
    float aa = 15.;
    time = sqrt(time * aa) / aa;
    float amp = exp(max(time - .15, 0.) * -5.);
    float v = nse(quan(mod(time, .6), .0001));
    v = dist(v, .1) * amp;
    return vec2(dist(v * amp, 2.));
}

// --- synthesizer

#define NSPC 256

// hard clipping distortion
vec2 dist(vec2 s, float d) { return clamp(s * d, -1.0, 1.0); }

float _filter(float h, float cut) {
    cut -= 20.0;
    float df = max(h - cut, 0.0), df2 = abs(h - cut);
    return exp(-0.005 * df * df) * 0.5 + exp(df2 * df2 * -0.1) * 2.2;
}

vec2 attackbass(float note, float t) {
    vec2 v = vec2(0.0);
    float dr = 0.15;
    float amp = smoothstep(0.1, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);
    float f = noteToFreq(note);
    float sqr = 0.1;
   
    // no attenuation 
    amp = 1.;

    float base = f;
    float flt = exp(t * -1.5) * 30.0;
    for (int i = 0; i < NSPC; i++) {
        float h = float(i + 1);
        float inten = 2.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-2.0 * max(2.0 - h, 0.0));  // + exp(abs(h - flt) * -2.0) * 8.0;

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));
        v.y += inten * sin(TAU * (t * base * h));
    }

    float o = v.x * amp;  // exp(max(tnote - 0.3, 0.0) * -5.0);

    // o = dist(o, 2.5);

    return vec2(dist(v * amp, 2.0));
}

vec2 leadsub(float note, float t) {
    vec2 v = vec2(0.0);
    float dr = 0.1;
    float amp = smoothstep(0.2, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);
    float f = noteToFreq(note);
    float sqr = 0.03;
   
    // no attenuation 
    amp = 1.;

    float base = f;
    float flt = exp(t * -3.5) * 20.0;
    
    for (int i = 0; i < NSPC; i++) {
        float h = float(i + 1);
        float inten = 2.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-2.0 * max(2.0 - h, 0.0));

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));
        v.y += inten * sin(TAU * (t * base * h));
    }

    float o = v.x * amp;

    return vec2(dist(v * amp, 2.0));
}

vec2 leadsub2(float note, float t) {
    vec2 v = vec2(0.0);
    float dr = 0.1;
    float amp = smoothstep(0.2, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);
    float f = noteToFreq(note);
    float sqr = 0.05;

    // no attenuation 
    amp = 1.;

    float base = f;
    float flt = exp(t * -2.5) * 20.0;
    for (int i = 0; i < NSPC; i++) {
        float h = float(i + 1);
        float inten = 4.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-3.0 * max(1.9 - h, 0.0));

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));
        v.y += inten * sin(TAU * (t * base * h));
    }

    float o = v.x * amp;

    return vec2(dist(v * amp, 2.0));
}

// ref: https://www.shadertoy.com/view/ldfSW2
vec2 synth(float note, float t) {
    vec2 v = vec2(0.0);
    float dr = 0.15;
    float amp = smoothstep(0.1, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);
    float f = noteToFreq(note);
    float sqr = 0.1;
    
    // no attenuation
    amp = 1.;

    float base = f;
    float flt = exp(t * -1.5) * 30.0;
    for (int i = 0; i < NSPC; i++) {
        float h = float(i + 1);
        float inten = 2.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-2.0 * max(2.0 - h, 0.0));

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));
        v.y += inten * sin(TAU * (t * base * h));
    }

    float o = v.x * amp;

    return vec2(dist(v * amp, 2.0));
}

vec2 bass(float note, float time) {
    float freq = noteToFreq(note);
    return vec2(square(note, freq * time) + sine(freq * time)) / 1.5;
}

vec2 pad(float note, float time) {
    float freq = noteToFreq(note);
    float vib = .2 * sine(3. * time);
    return vec2(
    saw(1., freq * .99 * time + vib),
    saw(1., freq * 1.01 * time + vib)
    );
}

vec2 arp(float note, float time) {
    float freq = noteToFreq(note);
    float fmamp = .1 * exp(-50. * time);
    float fm = fmamp * sine(time * freq * 7.);
    // float amp = exp(-20. * time);
    float amp = exp(-20. * time);
    return amp * vec2(
    sine(freq * .99 * time + fm),
    sine(freq * 1.01 * time + fm)
    );
}

// --- electric piano
// ref: https://www.shadertoy.com/view/3scfD2

#define msin(x,m) sin(TAU*(x)+(m))

float cps(float notenumber)
{
    // Convert from MIDI note number to cycles per second
    return 440.*exp2((notenumber-69.)/12.);
}

vec2 epiano(float note, float t)
{
    float nuance = 1.;

    float freq = cps(note);

    // freq : frequency of note
    // t : time since beginning of note
    // nuance : 1 is mezzo-forte, smaller is piano, larger is forte
    vec2 f0 = vec2(freq*0.998, freq*1.002);

    // Glassy attack : slightly sharp,
    // modulated at 14 * base frequency with a sharply decaying envelope
    // and with a relatively fast decay
    vec2 glass = msin((f0+3.)*t, msin(14.*f0*t,0.) * exp(-30.*t) * nuance) * exp(-4.*t)  * nuance;
    glass = sin(glass); // Distort at high nuances

    // Body of the sound : perfectly in tune,
    // index of modulation depends on nuance and is boosted a bit for low notes
    vec2 body = msin(f0*t, msin(f0*t,0.) * exp(-0.5*t) * nuance * pow(440./f0.x, 0.5)) * exp(-t) * nuance;

    // Pan the attack depending on which note it is
    float panDir = clamp(log2(freq/400.)/2., -1., 1.); // -1 is left, 1 is right
    vec2 pan = normalize(vec2(0.5-0.5*panDir, 0.5+0.5*panDir));
    return (glass*pan + body) * 0.05 * smoothstep(0.,0.001,t);
}

// guitar
// ref: https://www.shadertoy.com/view/lsyczW

float si(float i) { return sin(fract(i) * PI * 2.0); }

float guitar3(float time, float frequency, float B) {
   float ret = 0.0;
    float energy = 1.0;
    for (int i = 1; i < 15; i++) {
//      float f = frequency * pow(float(i),1.002);
      float f = frequency * float(i) * sqrt(1.0 + float(i) * float(i) * B);
      float v =  pow(0.75, float(i)) *  exp((-1.5 - sqrt(frequency)/20.0) * time);
      if (i == 8 || i == 16 || i == 24) v /= 5.0;
	  float transfer = 1.0 - exp(-f/100.0);
      v *= energy * transfer;
      energy = 2.0 - energy * transfer;
        
      ret += si(f * time) * v;
    }
    return ret * 7.0 / sqrt(frequency);
}
float guitar2(float time, int key) {
    float frequency = 27.4 * pow(2.001, float(key)/12.0);
     // Maybe express this in terms of frequency.
    // Model bottom curve.
    float B = pow(10.0, (float(key) + 1.0) / 24.0 - 5.15);

    return guitar3(time, frequency, B);
}

vec2 guitar(int key, float time) {
    return vec2(guitar2(time, key)); 
}

// clap
// ref: https://www.shadertoy.com/view/flcyRH

vec2 cis( float t ) {
    return vec2( cos( t ), sin( t ) );
}

// vec2 getDir( ivec2 p ) {
//     return cis( TAU * texelFetch( iChannel0, p & 255, 0 ).x );
// }
// 
// float perlin2d( vec2 p ) {
//     vec2 cell = floor( p );
//     vec2 cellCoord = p - cell;
//     ivec2 cellIndex = ivec2( cell );
// 
//     vec2 cellCoordS = smootherstep( cellCoord );
//     // vec2 cellCoordS = step( 0.5, cellCoord );
//     
//     return mix(
//         mix(
//             dot( getDir( cellIndex ), cellCoord ),
//             dot( getDir( cellIndex + ivec2( 1, 0 ) ), cellCoord - vec2( 1.0, 0.0 ) ),
//             cellCoordS.x
//         ),
//         mix(
//             dot( getDir( cellIndex + ivec2( 0, 1 ) ), cellCoord - vec2( 0.0, 1.0 ) ),
//             dot( getDir( cellIndex + ivec2( 1, 1 ) ), cellCoord - 1.0 ),
//             cellCoordS.x
//         ),
//         cellCoordS.y
//     );
// }

// float fbm2d( vec2 p ) {
//     return (
//         + perlin2d( 2.0 * p ) / 2.0
//         + perlin2d( 4.0 * p ) / 4.0
//         + perlin2d( 8.0 * p ) / 8.0
//         + perlin2d( 16.0 * p ) / 16.0
//     );
// }

float fbm2d(vec2 p, float s) {
    return (
        + perlinNoise(4. * s * p, 0.) / 2.
        + perlinNoise(8. * s * p, 0.) / 4.
        + perlinNoise(16. * s * p, 0.) / 8.
        + perlinNoise(32. * s * p, 0.) / 16.
    );
}

// clap
// ref: https://www.shadertoy.com/view/flcyRH
vec2 clap(float key, float t) {

    // clap envelope
    float env = mix(
      exp( -30.0 * t ), // long decay
      exp( -200.0 * mod( t, 0.01 ) ), // repeating transient
      exp( -100.0 * max( 0., t - 0.02 ) ) // mixing them
    );

    vec2 uv = 2.5 * cis( TAU * 79.0 * t ) + 50.0 * t; // noise uv

    return tanh( 10.0 * env * vec2(
      fbm2d( uv , 1.),
      fbm2d( uv + 0.2, 1. ) // slightly shifting the uv for the right channel to make it stereo
    ) );
}



// ------------------------------------------------------------------------------------
// SEQ_BEGIN
// ------------------------------------------------------------------------------------

// オリジナルのシーケンサー. vite経由だとなぜかminifyがエラーになる。手動cliだとうまくいく
// notes ... [note_number, len, note_number, len, ...]
// measureCount ... 小節数. 4拍で1小節とする
// TODO: little-endian, big-endian 考慮する必要がある？
// ref: https://github.com/equinor/glsl-float-to-rgba/blob/master/README.md
// ## args
// - rawBeat
// - time ... 現在の時間
// - beatTempo ... ビートのテンポ. 4拍が基本
// - totalBeatCount ... シーケンス全体のビート数
// - notes ... シーケンスのノート情報. [note_number, len, note_number, len, ...]
// - noteCount ... notesの要素数 / 2
// - toneFunc ... 音を生成する関数. note_number, time を引数にとる関数
// - masterVolume ... 音量の調整値
// #define SEQ(rawBeat, time, beatTempo, totalBeatCount, notes, noteCount, toneFunc, masterVolume) \
//     { \
//     float tempoScale = beatTempo / 4.; /* 4拍が基本 */ \
//     float fLocalBeatIndex = mod(rawBeat * tempoScale, float(totalBeatCount)); /* シーケンス内でのビート番号 */ \
//     int accRawBeatPrevLength = 0; \
//     int accRawBeatLength = 0; \
//     int targetNoteIndex = -1; \
//     for(int i = 0; i < noteCount; i++) { \
//         if(i == 0) { \
//             int rawNoteLength = notes[i * 2 + 1]; /* notes[1]と同義 */ \
//             if(0. < fLocalBeatIndex && fLocalBeatIndex < float(rawNoteLength)) { \
//                 targetNoteIndex = 0; \
//                 accRawBeatLength += rawNoteLength; \
//                 break; \
//             } \
//             accRawBeatLength += rawNoteLength; \
//         } else { \
//             int rawNoteLength = notes[(i - 1) * 2 + 1]; \
//             int nextRawNoteNumber = notes[i * 2]; \
//             int nextRawNoteLength = notes[i * 2 + 1]; \
//             if( \
//                 float(accRawBeatLength) < fLocalBeatIndex \
//                 && fLocalBeatIndex < (float(accRawBeatLength) + float(nextRawNoteLength)) \
//             ) { \
//                 targetNoteIndex = i; \
//                 accRawBeatPrevLength = accRawBeatLength; \
//                 accRawBeatLength += nextRawNoteLength; \
//                 break; \
//             } \
//             accRawBeatPrevLength = accRawBeatLength; \
//             accRawBeatLength += nextRawNoteLength; \
//         } \
//     } \
//     int currentNoteNumber = notes[targetNoteIndex * 2]; \
//     int currentNoteLength = notes[targetNoteIndex * 2 + 1]; \
//     int[4] noteNumbers = int[4]( \
//         (int(currentNoteNumber) & 255), \
//         ((int(currentNoteNumber) >> 8) & 255), \
//         ((int(currentNoteNumber) >> 16) & 255), \
//         ((int(currentNoteNumber) >> 24) & 255) \
//     ); \
//     /* TODO: -1 の場合は何かがおかしい. 誤差か何かで発生する */ \
//     if(targetNoteIndex == -1) { \
//         return vec2(0.); \
//     } \
//     float fLocalBeatIndexInNote = fLocalBeatIndex - float(accRawBeatPrevLength); \
//     float localTime = BEAT_TO_TIME(mod(fLocalBeatIndexInNote, float(currentNoteLength)) / tempoScale); \
//     /* ぶつ切りにならないようなfallback */ \
//     float fallbackAmp = 1. - smoothstep(.90, .99, fLocalBeatIndexInNote / float(currentNoteLength)); \
//     fallbackAmp = 1.; /* fallbackしない場合 */\
//     vec2 lr = vec2(0.); \
//     float acc = 0.; \
//     for(int i = 0; i < 4; i++) { \
//         float fNoteNumber = float(noteNumbers[i]); \
//         float isNoteOn = (fNoteNumber > 0. ? 1. : 0.); \
//         lr += vec2(toneFunc(fNoteNumber, localTime)) * isNoteOn * fallbackAmp; \
//         acc += isNoteOn; \
//     } \
//     float gainAcc = 1.5; /* 同時に音を鳴らす際の音量を上げる調整値. 引数で渡すようにしてもよい */ \
//     lr /= max(1., acc - gainAcc); \
//     res += lr * gain; \
//     } \

// 圧縮版が最新
// なぜかvite経由だとminifyがうまくいかないので手動cliでminifyを走らせたコードを貼り付ける
// #define SEQ(rawBeat,time,beatTempo,totalBeatCount,notes,noteCount,toneFunc)float tempoScale=beatTempo/4.;float fLocalBeatIndex=mod(rawBeat*tempoScale,float(totalBeatCount));int accRawBeatPrevLength=0;int accRawBeatLength=0;int targetNoteIndex=-1;for(int i=0;i<noteCount;i++){if(i==0){int rawNoteLength=notes[i*2+1];if(0.<fLocalBeatIndex&&fLocalBeatIndex<float(rawNoteLength)){targetNoteIndex=0;accRawBeatLength+=rawNoteLength;break;}accRawBeatLength+=rawNoteLength;}else{int rawNoteLength=notes[(i-1)*2+1];int nextRawNoteNumber=notes[i*2];int nextRawNoteLength=notes[i*2+1];if( float(accRawBeatLength)<fLocalBeatIndex&&fLocalBeatIndex<(float(accRawBeatLength)+float(nextRawNoteLength))){targetNoteIndex=i;accRawBeatPrevLength=accRawBeatLength;accRawBeatLength+=nextRawNoteLength;break;}accRawBeatPrevLength=accRawBeatLength;accRawBeatLength+=nextRawNoteLength;}}int currentNoteNumber=notes[targetNoteIndex*2];int currentNoteLength=notes[targetNoteIndex*2+1];int[4]noteNumbers=int[4]( (int(currentNoteNumber)&255),((int(currentNoteNumber)>>8)&255),((int(currentNoteNumber)>>16)&255),((int(currentNoteNumber)>>24)&255));if(targetNoteIndex==-1){return vec2(0.);}float fLocalBeatIndexInNote=fLocalBeatIndex-float(accRawBeatPrevLength);float localTime=BEAT_TO_TIME(mod(fLocalBeatIndexInNote,float(currentNoteLength))/tempoScale);float fallbackAmp=1.-smoothstep(.1,.2,fLocalBeatIndexInNote/float(currentNoteLength));fallbackAmp=1.;vec2 res=vec2(0.);float acc=0.;for(int i=0;i<4;i++){float fNoteNumber=float(noteNumbers[i]);float isNoteOn=(fNoteNumber>0.?1.:0.);res+=vec2(toneFunc(fNoteNumber,localTime))*isNoteOn*fallbackAmp;acc+=isNoteOn;}float gainAcc=1.5;res/=max(1.,acc-gainAcc);

// さらに圧縮
// #define SEQ(rb,time,bt,tbc,ns,nc,tf,va)float ts=bt/4.;float flbi=mod(rb*ts,float(tbc));int arbpl=0;int arbl=0;int tni=-1;for(int i=0;i<nc;i++){if(i==0){int rnl=ns[i*2+1];if(0.<flbi&&flbi<float(rnl)){tni=0;arbl+=rnl;break;}arbl+=rnl;}else{int rnl=ns[(i-1)*2+1];int nrnn=ns[i*2];int nrnl=ns[i*2+1];if( float(arbl)<flbi&&flbi<(float(arbl)+float(nrnl))){tni=i;arbpl=arbl;arbl+=nrnl;break;}arbpl=arbl;arbl+=nrnl;}}int cnn=ns[tni*2];int cnl=ns[tni*2+1];int[4]nns=int[4]( (int(cnn)&255),((int(cnn)>>8)&255),((int(cnn)>>16)&255),((int(cnn)>>24)&255));if(tni==-1){return vec2(0.);}float flbiin=flbi-float(arbpl);float lt=BEAT_TO_TIME(mod(flbiin,float(cnl))/ts);float fa=1.-smoothstep(.1,.2,lt);fa=1.;vec2 res=vec2(0.);float acc=0.;for(int i=0;i<4;i++){float fnn=float(nns[i]);float ino=(fnn>0.?1.:0.);res+=vec2(tf(fnn,lt))*ino*fa;acc+=ino;}float ga=1.5;res/=max(1.,acc-ga);
#define SEQ(rb,time,bt,tbc,ns,nc,tf,va){float ts=bt/4.;float flbi=mod(rb*ts,float(tbc));int arbpl=0;int arbl=0;int tni=-1;for(int i=0;i<nc;i++){if(i==0){int rnl=ns[i*2+1];if(0.<flbi&&flbi<float(rnl)){tni=0;arbl+=rnl;break;}arbl+=rnl;}else{int rnl=ns[(i-1)*2+1];int nrnn=ns[i*2];int nrnl=ns[i*2+1];if( float(arbl)<flbi&&flbi<(float(arbl)+float(nrnl))){tni=i;arbpl=arbl;arbl+=nrnl;break;}arbpl=arbl;arbl+=nrnl;}}int cnn=ns[tni*2];int cnl=ns[tni*2+1];int[4]nns=int[4]( (int(cnn)&255),((int(cnn)>>8)&255),((int(cnn)>>16)&255),((int(cnn)>>24)&255));if(tni==-1){return vec2(0.);}float flbiin=flbi-float(arbpl);float lt=BEAT_TO_TIME(mod(flbiin,float(cnl))/ts);float fa=1.-smoothstep(.1,.2,lt);fa=1.;vec2 lr=vec2(0.);float acc=0.;for(int i=0;i<4;i++){float fnn=float(nns[i]);float ino=(fnn>0.?1.:0.);lr+=vec2(tf(fnn,lt))*ino*fa;acc+=ino;}float ga=1.5;lr/=max(1.,acc-ga);res+=lr*va;}


// 圧縮後の変数メモ
// lt ... local time

// ------------------------------------------------------------------------------------
// SEQ_END
// ------------------------------------------------------------------------------------


// ------------------------------------------------------------------------------------
// Application
// ------------------------------------------------------------------------------------

// --- harmony

// Eb2_m7: Eb2,Gb2,Bb2,Db3
#define Eb2_m7(a) N4(39,42,46,49), a
// Eb2_m7_Eb3: Eb2,Gb2,Bb2,Eb3
#define Eb2_m7_Eb3(a) N4(39,42,46,51), a
// Fm2_7: F2,Ab2,B2,Eb3
#define Fm2_7(a) N4(41,44,47,51), a
// Ab2m7: Ab2,B2,Eb3,Gb3
#define Ab2_m7(a) N4(44,47,51,54), a

// Ab2m7: Ab2,B2,Eb3,Ab3
#define Ab2_m7_Ab3(a) N4(44,47,51,56), a
// Bb2_m: Bb2,Db3,F3
#define Bb2_m(a) N3(46,49,53), a
// Bb2_m7: Bb2,Db3,F3,Ab3
#define Bb2_m7(a) N4(46,49,53,56), a
// B2_m7: B2,Eb3,Gb3,Bb3
#define B2_m7(a) N4(47,51,54,58), a
// B3_maj7: B2,Eb3,Gb3,Bb3,Eb4
#define B3_maj7(a) N4(47,51,54,58), a
// Cb3_maj7: Cb3,Eb3,Gb3,Bb3
#define Cb3_maj7(a) N4(48,51,54,58), a
// Db3_7: Db3,F3,Ab3,B3
#define Db3_7(a) N4(49,53,56,59), a
// Eb3_m7: Eb3,Gb3,Bb3,Db4
#define Eb3_m7(a) N4(51,54,58,61), a
// Ab3_m7: Ab3,B3,Eb4,Gb4
#define Ab3_m7(a) N4(57,59,63,66), a

// sequence header
#define SEQ_H vec2 res=vec2(0.)

vec2 epianoHarmonySeq01(float rawBeat, float time) {
    SEQ_H;
    
    int[8] notes = int[8](
        // Ab2_m7(8), Fm2_7(8), Eb2_m7(8), Eb2_m7_Eb3(8)
        Ab2_m7(8), B2_m7(8), Db3_7(8), Fm2_7(8)
    );
    SEQ(rawBeat, time, T4, 32., notes, 4, epiano, 1.);

    return res;
}

vec2 bassSustainedSeq(float rawBeat, float time) {
    vec2 midBassLow = leadsub(Ab1F, time);
    vec2 midBassHigh = leadsub(Eb2F, time);
    vec2 subBass = leadsub(Ab1F, time);
   
    vec2 s = (midBassLow + midBassHigh + subBass) / 3.;
    s *= sustainedFX(.05, .5, .2, .2, 2., 7., 8., .4, mod(rawBeat, 8.)) * smoothstep(.1, 2., rawBeat);

    // float n = perlinNoise(vec2(rawBeat, 1.), 0.) * .05 + .9;
    // s *= lowPassFilter(n, low, s);

    return s;
}

vec2 midBassHarmonySeqLow(float rawBeat, float time) {
    // int[8] notes = int[8](
    //     Ab1(8), B1(8), Db2(8), F1(8)
    // );
    // SEQ(rawBeat, time, T4, 32., notes, 4, leadsub);
    // 
    // float env = smoothInEnvelope(lt, .01, .25, .2);

    // return res;
    
    SEQ_H;

    int[8] notes = int[8](
        Ab1(8), B1(8), Db2(8), F1(8)
    );
    SEQ(rawBeat, time, T4, 32., notes, 4, leadsub, 1.);
    
    float env = smoothInEnvelope(lt, .01, .25, .2);
    
    return res;
}

vec2 midBassHarmonySeqHigh(float rawBeat, float time) {
    SEQ_H;
    
    // int[8] notes = int[8](
    //     Eb3(8), B3(8), Bb4(8), F3(8)
    // );
    // SEQ(rawBeat, time, T4, 32., notes, 4, leadsub);
    // 
    // float env = smoothInEnvelope(lt, .01, .15, .2);

    // return res * env;
    
    int[8] notes = int[8](
        Eb2(8), Gb2(8), Ab2(8), B1(8)
    );
    SEQ(rawBeat, time, T4, 32., notes, 4, leadsub, 1.);
    
    float env = smoothInEnvelope(lt, .01, .25, .2);
    
    return res;
}

vec2 subbassHarmonySeq(float rawBeat, float time) {
    SEQ_H;
    
    // int[8] notes = int[8](
    //     Ab3(8), B3(8), Db4(8), F4(8)
    // );
    // SEQ(rawBeat, time, T4, 32., notes, 4, leadsub);
    // 
    // float env = smoothInEnvelope(lt, .01, .05, .2);

    // return res;
    
    int[8] notes = int[8](
        Eb2(8), Gb2(8), Ab2(8), B2(8)
    );
    SEQ(rawBeat, time, T4, 32., notes, 4, leadsub, 1.);
    
    float env = smoothInEnvelope(lt, .01, .25, .2);
    
    return res;
}

// vec2 sustainedRiffSeq(float rawBeat, float time) {
//     
//     // #3rd: B2,Eb3,F3,Ab2
//     int[16] notes = int[16](
//         O(3), B3(3), O(1), B3(3), O(1), B3(3), O(1), B3(1)
//     );
//     SEQ(rawBeat, time, T8, 16., notes, 8, epiano);
// 
//     return res;
// }

vec2 riffSeq01(float rawBeat, float time) {
    SEQ_H;
    
    // #3rd: B2,Eb3,F3,Ab2
    int[64] notes = int[64](
        O(3), B3(3), O(1), B3(3), O(1), B3(3), O(1), B3(1),
        O(3), F4(3), O(1), F4(3), O(1), Eb4(3), O(1), Eb4(1),
        O(3), B3(3), O(1), B3(3), O(1), B3(3), O(1), B3(1),
        O(3), B3(3), O(1), B3(3), O(1), Bb3(3), O(1), Bb3(1)
    );
    SEQ(rawBeat, time, T8, 64., notes, 32, leadsub2, 1.);
    // SEQ(rawBeat, time, T8, 64., notes, 32, arp);

    return res;
}

vec2 beatRiffSeq01(float rawBeat, float time) {
    SEQ_H;
    
    // #3rd: B2,Eb3,F3,Ab2
    int[128] notes = int[128](
        B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), B3(1), Db4(1), Db4(1), 
        Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), Eb4(1), 
        F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), F4(1), Eb4(1), Eb4(1), 
        Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1), Ab3(1)
    );
    SEQ(rawBeat, time, T16, 64., notes, 64, epiano, 1.);

    return res;
}

vec2 clapSeq01(float rawBeat, float time) {
    SEQ_H;
    
    int[8] notes = int[8](
        O(1), S(1), O(1), S(1)
    );
    SEQ(rawBeat, time, T4, 4., notes, 4, clap, 1.);

    return res;
}

vec2 snareFillSeq(float rawBeat, float time) {
    SEQ_H;
    
    int[32] notes = int[32](
        S(1), O(1), S(1), O(1),
        S(1), O(1), S(1), O(1),
        S(1), O(1), S(1), O(1),
        S(1), O(1), S(1), O(1)
    );
    
    SEQ(rawBeat, time, T8, 16., notes, 16, snareFill, 1.);

    return res;
}

vec2 hihat1Seq01(float rawBeat, float time) {
    SEQ_H;
    
    int[4] notes = int[4](
        O(1), S(1)
    );
    SEQ(rawBeat, time, T8, 2., notes, 2, hihat1, 1.);

    return res;
}

vec2 hihat2Seq01(float rawBeat, float time) {
    SEQ_H;
    
    int[4] notes = int[4](
        O(1), S(1)
    );
    SEQ(rawBeat, time, T8, 2., notes, 2, hihat2, 1.);

    return res;
}

vec2 drumSeq(float measure, float rawBeat, float time) {
    SEQ_H;
    
    float introClip = measureRange(measure, 0., 16.);
    float mainClip = 1. - introClip;
  
    int[12] kickNotes = int[12](
        O(2), S(1), S(1), O(10), S(1), S(1)
    );
    SEQ(rawBeat, time, T16, 16., kickNotes, 6, kickLow, .1);
    
    int[8] clapNotes = int[8](
        O(1), S(1), O(1), S(1)
    );
    SEQ(rawBeat, time, T4, 4., clapNotes, 4, clap, .15);
   
    int[32] snareNotes = int[32](
        S(1), O(1), S(1), O(1),
        S(1), O(1), S(1), O(1),
        S(1), O(1), S(1), O(1),
        S(1), O(1), S(1), O(1)
    );
    SEQ(rawBeat, time, T8, 16., snareNotes, 16, snareFill, .05 * mainClip);
    
    int[4] hihatNotes = int[4](
        O(1), S(1)
    );
    SEQ(rawBeat, time, T8, 2., hihatNotes, 2, hihat1, .1 * mainClip);
    
    return res;
}
 
vec2 bassSeq(float measure, float rawBeat, float time) {
    SEQ_H;

    float introClip = measureRange(measure, 0., 32.);
    float mainClip = measureRange(measure, 32., 88.);
 
    vec2 midBassLow = leadsub(Ab1F, time);
    vec2 midBassHigh = leadsub(Eb2F, time);
    vec2 subBass = leadsub(Ab1F, time);
    
    vec2 s = vec2(0.);
    
    // --- intro
    
    res +=
        ((midBassLow + midBassHigh + subBass) / 3.)
        * sustainedFX(.05, .5, .2, .2, 2., 7., 8., .4, mod(rawBeat, 8.)) * smoothstep(.1, 2., rawBeat)
        * introClip;
 
    // float n = perlinNoise(vec2(rawBeat, 1.), 0.) * .05 + .9;
    // s *= lowPassFilter(n, low, s);
    
    // --- main

    float tremolo = analogLFO(time, 3.2, 1, 0.03, 0.02) * 0.5 + 0.5; // 音量変調（0-1範囲）
 
    int[8] midBassLowHarmonyNotes = int[8](
        Ab1(8), B1(8), Db2(8), F1(8)
    );
    SEQ(rawBeat, time, T4, 32., midBassLowHarmonyNotes, 4, leadsub, .15 * tremolo * mainClip);
   
    int[8] midBassHighHarmonyNotes = int[8](
        Eb2(8), Gb2(8), Ab2(8), B1(8)
    );
    SEQ(rawBeat, time, T4, 32., midBassHighHarmonyNotes, 4, leadsub, .15 * tremolo * mainClip);
   
    int[8] subBassHarmonyNotes = int[8](
        Eb2(8), Gb2(8), Ab2(8), B2(8)
    );
    SEQ(rawBeat, time, T4, 32., subBassHarmonyNotes, 4, leadsub, .15 * mainClip);
    
    // float env = smoothInEnvelope(lt, .01, .25, .2);
    
    // s += 
    //    midBassHarmonySeqLow(tb, time) * .15 * tremolo +
    //    midBassHarmonySeqHigh(tb, time) * .15 * tremolo +
    //    subbassHarmonySeq(tb, time) * .15
    //    * mainClip;
    
    return res;
}

vec2 riffSeq(float measure, float rawBeat, float time) {
    SEQ_H;

    // float introClip, mainClip;

    // --- intro Riff; echo test
    for(int i = 0; i < 4; i++) {
        // #3rd: B2,Eb3,F3,Ab2
        float fi = float(i);
        float o = timeToBeat(fi * .08); // offset
        float a = 1. - exp(fi * -.15); // decay
        introClip = measureRange(measure, 8. + o, 24. + o);
        int[16] sustainedRiffNotes = int[16](
            O(3), CH(B3N,2), O(2), CH(B3N,2), O(2), CH(B3N,2), O(2), CH(B3N,1)
            // O(3), B3(2), O(2), B3(2), O(2), B3(2), O(2), B3(1)
        );
        SEQ(rawBeat + o, time, T8, 16., sustainedRiffNotes, 8, epiano, 1.5 * a * introClip);
    }
    
    return res;
   
    // --- intro Riff: no echo
    float introClip = measureRange(measure, 8., 24.);
    int[16] sustainedRiffNotes = int[16](
        O(3), CH(B3N,2), O(2), CH(B3N,2), O(2), CH(B3N,2), O(2), CH(B3N,1)
    );
    SEQ(rawBeat, time, T8, 16., sustainedRiffNotes, 8, epiano, 1.5 * introClip * 0.);

    // // --- 基本のRiff: echo test
    // for(int i = 0; i < 1; i++) {
    //     // #3rd: B2,Eb3,F3,Ab2
    //     float fi = float(i);
    //     float o = timeToBeat(fi * .08); // offset
    //     float a = 1. - exp(fi * -.15); // decay
    //     mainClip = measureRange(measure, 24. + o, 88. + o);
    //     int[64] riffNotes = int[64](
    //         O(3), CH(B3N,3), O(1), CH(B3N,3), O(1), CH(B3N,3), O(1), CH(B3N,1),
    //         O(3), CH(F4N,3), O(1), CH(F4N,3), O(1), CH(Eb4N,3), O(1), CH(Eb4N,1),
    //         O(3), CH(B3N,3), O(1), CH(B3N,3), O(1), CH(B3N,3), O(1), CH(B3N,1),
    //         O(3), CH(B3N,3), O(1), CH(B3N,3), O(1), CH(Bb3N,3), O(1), CH(Bb3N,1)
    //     );
    //     SEQ(rawBeat + o, time, T8, 64., riffNotes, 32, epiano, 1.5 * a * mainClip);
    // }
    
    float mainClip = measureRange(measure, 8., 88.);
    // --- 基本のRiff: no echo
    // #3rd: B2,Eb3,F3,Ab2
    int[72] riffNotes = int[72](
        O(3), B3(3), O(4), B3(3), O(6), B3(3), O(4), B3(3), O(3),
        O(3), F4(3), O(4), F4(3), O(6), Eb4(3), O(4), Eb4(3), O(3),
        O(3), Bb3(3), O(4), B3(3), O(6), B3(3), O(4), B3(3), O(3),
        O(3), B3(3), O(4), B3(3), O(6), Bb3(3), O(4), Bb3(3), O(3)
    );
    SEQ(rawBeat, time, T16, 128., riffNotes, 36, epiano, 1.5 * mainClip);
    
    
    // float n = perlinNoise(vec2(rawBeat, 1.), 0.) * 1000.;
    // res = lowPassFilter(res, 500. + n);

    return res;
}

vec2 kickSeq(float rawBeat, float time) {
    SEQ_H;
    
    int[4] notes = int[4](
        O(1), S(1)
    );
    SEQ(rawBeat, time, T8, 2., notes, 2, kick, 1.);

    return res;
}

vec2 epianoMelodySeq01(float rawBeat, float time) {
    SEQ_H;
    
    int[76] notes = int[76](
        O(6), Ab3(2), Eb4(3), Db4(3), B3(6), 
        O(2), Ab3(2), Eb4(3), Db4(3), B3(6),
        O(2), Ab3(2), Eb4(3), Db4(3), B3(2),
        Db4(4), Eb4(4), Db4(6), Db4(2),
        O(6), Ab3(2), Eb4(3), Db4(3), B3(6), 
        O(2), Ab3(2), Eb4(3), Db4(3), B3(6),
        O(2), Ab3(2), Eb4(3), Db4(3), B3(2),
        Ab3(4), Ab3(4), Gb3(6), Gb3(2)
    );
    SEQ(rawBeat, time, T16, 128., notes, 38, epiano, 1.);
    
    // int[40] notes = int[40](
    //     O(6), Ab3(2), Eb4(3), Db4(3), B3(6), 
    //     O(2), Ab3(2), Eb4(3), Db4(3), B3(6),
    //     O(2), Ab3(2), Eb4(3), Db4(3), B3(6),
    //     O(2), Ab3(2), Eb4(3), Db4(3), B3(2)
    // );
    // SEQ(rawBeat, time, T16, 64., notes, 20, leadsub);

    return res;
}

vec2 sustainedPadSeq01(float rawBeat, float time) {
    // Ab2m7: Ab2,B2,Eb3,Gb3
    float low = (cos(rawBeat * 1.) + 1.) * .15 + .75;
    float res = .8 - (cos(time * 8.)) * .1;

    vec2 s = (pad(Ab3F, time) + pad(B3F, time) + pad(Eb4F, time)) * .3;
    s *= sustainedFX(0., .7, .2, .2, 2., 12., 16., .4, mod(rawBeat, 16.));
    
    float n = perlinNoise(vec2(rawBeat, 1.), 0.) * .05 + .9;
    // s *= lowPassFilter(n, low, res);
    
    return s;
}


// 無限小のステップを PolyBLEP で補正してエイリアシング軽減
float polyBlep(float t, float dt){
    if (t < dt)                { t /= dt; return 2.0*t - t*t - 1.0; }
    else if (t > 1.0 - dt)     { t  = (t - 1.0) / dt; return t*t + 2.0*t + 1.0; }
    return 0.0;
}

// ------------------------------------------------------------
//   Core waveforms  (phase は 0.0–1.0 wrap,  dt は 位相増分)
// ------------------------------------------------------------

// float sineWave(float phase){
//     return sin(TAU * phase);
// }

float sawWave(float phase){                 // alias-heavy / デモ用
    return fract(phase) * 2.0 - 1.0;
}
float sawWaveBLEP(float phase, float dt){   // polyBLEP で帯域制限
    float t = fract(phase);
    float y = t * 2.0 - 1.0;
    y -= polyBlep(t, dt);
    return y;
}

float squareWave(float phase){              // 50% duty
    return sign(fract(phase) - 0.5);
}
float squareWaveBLEP(float phase, float dt){
    float t = fract(phase);
    float y = sign(t - 0.5);
    // フロントとバックの 2 箇所を補正
    y += polyBlep(t,      dt);
    y -= polyBlep(t - 0.5, dt);
    return y;
}

float triangleWave(float phase){            // 誤差 0 の正三角
    return abs(fract(phase + 0.25)*2.0 - 1.0)*2.0 - 1.0;
}

// 近似的ホワイトノイズ（値域 ±1）
float whiteNoise(float seed){
    // 1-LCG ハッシュ
    seed = fract(seed * 43758.5453123 + 0.12345);
    return seed * 2.0 - 1.0;
}

vec2 pseudoNoise(float time){
    return vec2((fract(sin(time * 1e3) * 1e6) - .5));
}

// ------------------------------------------------------------
//   noiseRiser()
//   t          : 曲頭からの経過秒
//   startTime  : ライザーが始まる秒
//   len        : ライザー長（秒）
//   seed       : 乱数シード（推奨: fragment/vertex id）
//   returns    : −1〜+1 のノイズ値（時間に応じてフェードイン→LPF）
// ------------------------------------------------------------
float noiseRiser(float t, float startTime, float len, float seed)
{
    float rel = clamp((t - startTime) / len, 0.0, 1.0);  // 0→1
    // if(rel <= 0.0) return 0.0;

    // ① ホワイトノイズを取得
    float n = whiteNoise(t);

    // ② Ben 流 “くの字” フィルタ：序盤ロー → 終盤ハイ
    //     簡易 LPF: 低域のみ取り出し → 時間が経つにつれ高域比率を増やす
    float low  = n * (1.0 - rel);  // 低域 = 序盤強
    float high = n * rel;          // 高域 = 終盤強
    float y = low + high;

    // ③ オートメーション・エンベロープ（tanh で自然なカーブ）
    float env = smoothstep(0.0, 0.25, rel) *        // Attack
                (1.0 - smoothstep(0.9, 1.0, rel)); // Quick Release
    y *= env;

    // ④ 軽いサチュレーションで “温かみ”
    y = tanh(y * 2.5);

    return y;
}

float attr(float ft) {
    return smoothstep(.01, .05, ft) * (1. - smoothstep(.95, .99, ft));
}

float breaker(float t) {
    return smoothstep(.01, .05, t) * (1. - smoothstep(.95, .99, t));
}

// // TODO: smoothin,smoothout
vec2 bowan1(float time) {
    vec2 freq = vec2(500., 560);
    float tempo = 1.;
    return (sin(time * freq) * sin(time * 2400.) + sin(time * freq * 2.4)) * exp(-fract(time/ tempo) * 5.) * .05;
}

vec2 bowan2(float time) {
    vec2 freq = vec2(300., 360);
    freq = vec2(noteToFreq(56.), noteToFreq(59.));
    float tempo = 1.;
    float t = fract(time / tempo);
    float s = attr(t);
    float att = exp(-t * 1.);
    return (sin(t * freq) * sin(t * 2400.) + sin(t * freq * 2.4)) * exp(-t * 5.);
    // return
    //     (
    //         sin(t * freq) * sin(t * 20.)
    //         + sin(t * freq * 1.4)
    //     ) * att * s;
}

vec2 boom(float time) {
    vec2 freq = vec2(500., 560);
    float tempo = .5;
    return (sin(time * freq) * sin(time * 100.) + sin(time * freq * tempo)) * .5;
}

float envelope(float x, float ik, float io, float ok, float oo) {
    float a = exp(x / ik) - io;
    float b = exp(x * -ok + oo) * (1. / ok);
    return min(a, b);
}

// TODO: spread

// ステレオ出力のためvec2
vec2 mainSound(float time) {
    

    float beat = timeToBeat(time);

    vec2 sound = vec2(0.);

    float measure = beatToMeasure(beat);

    float baseAttenuation = smoothstep(.0002, .0006, mod(measure, 1.));
    
    float tb = timeToBeat(time);

    // sound += epianoMelodyUra1(tb, time) * 1.;
    // sound += arpMelodySeq2(tb, time) * .05;
    // // float riser = noiseRiser(time, 0., 8., 1.) * .05;
    
    // アナログLFOで音楽的変調を追加
    // vibrato = analogLFO(時間, 周波数5.5Hz, 波形0=正弦波, ドリフト2%, 不安定性1%) * 振幅
    float vibrato = analogLFO(time, 5.5, 0, 0.02, 0.01) * .02; // 微細なピッチ変調
    
    // tremolo = analogLFO(時間, 周波数3.2Hz, 波形1=三角波, ドリフト3%, 不安定性2%) * 0.5 + 0.5
    // 引数説明: (time, freq, waveform, drift, instability)
    // - time: 現在時刻
    // - freq: LFO周波数（Hz）
    // - waveform: 波形タイプ（0=正弦波, 1=三角波, 2=のこぎり波, 3=矩形波）
    // - drift: 周波数ドリフト量（0.0-1.0、アナログの周波数不安定性）
    // - instability: 振幅不安定性（0.0-1.0、アナログVCAの特性）
    float tremolo = analogLFO(time, 3.2, 1, 0.03, 0.02) * 0.5 + 0.5; // 音量変調（0-1範囲）
    
    // vec2 kickSound = kickSeq(tb, time) * .03;
    
    // sound += vec2(0.); 
    // // sound += kickSound;
    // 
    // sound += sidechainCompress(
    //     epianoHarmonySeq01(tb, time),
    //     kickSound, .8, time
    // );
    //       
    // sound += sidechainCompress(
    //     midBassHarmonySeqLow(tb, time) * .15 * tremolo +
    //     midBassHarmonySeqHigh(tb, time) * .15 * tremolo,
    //     kickSound, .8, time
    // );
    // 
    // sound += 
    //     highPassFilter(
    //         sidechainCompress(
    //             subbassHarmonySeq(tb, time) * .15,
    //             kickSound, .8, time
    //         ) * sineWave(tb, 1.5, .5),
    //         2000.
    //     );
   
    // sound += 
    //     sidechainCompress(
    //         riffSeq01(tb, time) * .025 * sineWave(tb, 3., .35),
    //         kickSound, .8, time
    //     );
    //    
    // // TODO: wave effect 
    // sound += 
    //     highPassFilter(
    //         beatRiffSeq01(tb, time) * .35,
    //         2000.
    //     );
    //         
    // sound += clapSeq01(tb, time) * .1;
    // 
    // // TODO: sonar
    // 
    // sound += snareFillSeq(tb, time) * .05;
    // sound += hihat1Seq01(tb, time) * .15;
    // sound += hihat2Seq01(tb, time) * .1;
   
    // sound += sustainedPadSeq01(tb, time) * .025;
    // 
    // sound += epianoMelodySeq01(tb, time) * 1.;
   
    // // gain
    // sound *= 0.;
    
    // --- main
    
    vec2 kickSound = kickSeq(tb, time) * .02 * measureRange(measure, 16., 88.);
    
    // sound += sidechainCompress(
    //     epianoHarmonySeq01(tb, time),
    //     kickSound, .8, time
    // ) * 0.;
 
    // sound += snareFillSeq(tb, time) * .05;
    // // sound += hihat1Seq01(tb, time) * .15;
    // sound += hihat2Seq01(tb, time) * .1;
    // // sound += epianoMelodySeq01(tb, time) * 1.;
    
    sound += drumSeq(measure, tb, time);
    sound += riffSeq(measure, tb, time);
    // sound += bassSeq(measure, tb, time);
             
    return sound;
   
    // sound += 
    //     sidechainCompress(
    //         sustainedRiffSeq(tb, time) * 1.2 * sineWave(tb, 3., .35),
    //         kickSound, .8, time
    //     ) * measureRange(measure, 8., 88.);
    //     
    // if(isInMeasure(measure, 0., 8.)) {
    //     // sound += snareFillSeq(tb, time) * .05;
    //     // sound += bassSustainedSeq(tb, time) * .5;
    // } else if(isInMeasure(measure, 8., 16.)) {
    // } else if(isInMeasure(measure, 16., 24.)) {
    // } else if(isInMeasure(measure, 24., 32.)) {
    // } else if(isInMeasure(measure, 32., 40.)) {
    // } else if(isInMeasure(measure, 40., 48.)) {
    // } else if(isInMeasure(measure, 48., 56.)) {
    // } else if(isInMeasure(measure, 56., 64.)) {
    // } else if(isInMeasure(measure, 64., 72.)) {
    // } else if(isInMeasure(measure, 72., 80.)) {
    // } else if(isInMeasure(measure, 80., 88.)) {
    // }
    // 
    // return sound;

    // // // sound = vec2(saw(0., 100. * time + (.2 * sine(5., time))));
    // // // sound = attackbass(60., time);
    // // // sound = leadsub(60., time);
    // // // sound = leadsub2(60., time);
    // // 
    // // // sound += bowan2(measure) * .1;

    // // // アナログLFOでパラメータを変調
    // // float lfo1 = multiLFO(time, 0.8, 0.3) * 0.5 + 0.5;  // 0-1範囲のLFO
    // // float lfo2 = analogLFO(time, 1.2, 0, 0.08, 0.05) * 0.5 + 0.5;
    // // float lfo3 = analogLFO(time, 0.3, 1, 0.06, 0.03);   // -1～1範囲
    // // 
    // // // リバーブエフェクトを適用（LFOで変調）
    // // float roomSize = 0.3 + lfo1 * 0.4;  // 0.3-0.7で変動
    // // float damping = 0.4 + lfo2 * 0.3;   // 0.4-0.7で変動
    // // float wetLevel = 0.15 + lfo1 * 0.15; // 0.15-0.3で変動
    // // 
    // // sound = reverb(sound, time, roomSize, damping, wetLevel);

    // // // ざわめきエフェクトを適用（LFOで変調）
    // // float rustleIntensity = 0.2 + abs(lfo3) * 0.4; // 0.2-0.6で変動
    // // float rustleSpeed = 1.0 + lfo2 * 2.0;          // 1.0-3.0で変動
    // // 
    // // sound = rustleEffect(sound, time, rustleIntensity, rustleSpeed);
    // // 
    // // // 最終段でのアナログ感（全体的な温かみと不安定性）
    // // float analogWarmth = analogLFO(time, 0.1, 0, 0.01, 0.005) * 0.05 + 1.0; // 極ゆっくりな変調
    // // float masterTremolo = analogLFO(time, 2.8, 2, 0.04, 0.02) * 0.03 + 1.0; // マスタートレモロ
    // // 
    // // sound *= analogWarmth * masterTremolo;
    // // 
    // // float env = smoothInEnvelope(time, .05, .5, -1.);

    // // sound = bass(Ab2F, time) * env;

    // // return sound;
}

void main() {
    float time = uBlockOffset + float(gl_VertexID) / uSampleRate;
    
    // minify時にエラーを出させないためのハック
    // begin
    vec2 c = vec2(1.);
    c =
        1.
        * epiano(time, time)
        * bass(time, time)
        * vec2(1.);
    c.x = 1.;
    c.y = 1.;
    // end
    
    vec2 sound = vec2(0.);
   
    sound = mainSound(time) * c;
   
    vSound = sound;
}
