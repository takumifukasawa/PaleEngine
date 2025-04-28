import { setOnBeforeStartEngine } from '@/PaleGL/core/engine';
import { findActorByName } from '@/PaleGL/core/scene.ts';
import { createColor, createColorBlack } from '@/PaleGL/math/color.ts';
import { createBufferVisualizerPass } from '@/PaleGL/postprocess/bufferVisualizerPass.ts';
import { initDebugger } from '@/PaleGL/utilities/initDebugger.ts';
import sceneJsonUrl from './data/scene.json?raw';
import { addPostProcessPass, createPostProcess, setPostProcessEnabled } from '@/PaleGL/postprocess/postProcess.ts';
import { setCameraPostProcess } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { setOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { DirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { createRenderTarget } from '@/PaleGL/core/renderTarget.ts';
import {
    FragmentShaderModifierPragmas,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    UniformBlockNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createArrowHelper } from '@/PaleGL/actors/meshes/arrowHelper.ts';
import { addActorComponents, addChildActor } from '@/PaleGL/actors/actor.ts';
import soundVertexShader from './shaders/sound-vertex.glsl';
import {
    createStartupLayer,
    hideStartupLayerWrapper,
    setStartupLayerLoadingPercentile,
} from '@/Player/createStartupLayer.ts';
import { wait } from '@/PaleGL/utilities/wait.ts';
import { createPlayer, loadPlayer, resizePlayer, runPlayer, startPlayer } from '@/Player/player.ts';
import { createGPU } from '@/PaleGL/core/gpu.ts';
import { createGLSLSoundWrapper, loadSound } from '@/PaleGL/utilities/createGLSLSoundWrapper.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import { createUnlitMaterial } from '@/PaleGL/materials/unlitMaterial.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { setMeshMaterial } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createTimelineMaterialPropertyBinderController } from '@/PaleGL/components/timelinePropertyBindreController.ts';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { SharedTexturesTypes } from '@/PaleGL/core/createSharedTextures.ts';

//--------------------

const stylesText = `
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
} 

#wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  background-color: black;
}
`;
const styleElement = document.createElement('style');
styleElement.innerText = stylesText;
document.head.appendChild(styleElement);

let width: number, height: number;

const SOUND_DURATION = 5; // [sec]

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

const canvasElement = document.createElement('canvas');
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true })!;
const gpu = createGPU(gl);
const pixelRatio = Math.min(window.devicePixelRatio, 1.5);

const glslSoundWrapper = createGLSLSoundWrapper(gpu, soundVertexShader, SOUND_DURATION);

const hotSceneJsonUrl = `assets/data/scene-hot-reload.json`;
const player = createPlayer(gpu, canvasElement, pixelRatio, sceneJsonUrl, hotSceneJsonUrl, {
    // timelineDuration: SOUND_DURATION,
    // glslSoundWrapper, // 今回は一旦使わない
    loop: true,
});

// TODO: player.engine側に移譲したい
const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;
    resizePlayer(player, width, height);
};

const load = async () => {
    const tick = (time: number) => {
        runPlayer(player, time);
        requestAnimationFrame(tick);
    };

    const onStartPlayer = () => {
        startPlayer(player);
        requestAnimationFrame(tick);
    };

    const startupLayer = createStartupLayer(() => {
        onStartPlayer();
    });
    wrapperElement.appendChild(startupLayer.rootElement);

    loadSound(glslSoundWrapper);

    await loadPlayer(
        player,
        async () => {
            // NOTE: 本当はここで一回挟みたい
            // onWindowResize();
            setStartupLayerLoadingPercentile(startupLayer, 50);
            await wait(100);

            init();
        },
        async () => {
            await wait(100);
            // keep startup layer
            // setStartupLayerLoadingPercentile(startupLayer, 100);
            // hideStartupLayerLoading(startupLayer);
            // showStartupLayerMenu(startupLayer);
            // immediately start
            hideStartupLayerWrapper(startupLayer);
            onStartPlayer();
        }
    );
};

const init = () => {
    const cameraPostProcess = createPostProcess();

    const bufferVisualizerPass = createBufferVisualizerPass({ gpu: player.gpu });
    bufferVisualizerPass.enabled = false;
    addPostProcessPass(cameraPostProcess, bufferVisualizerPass);

    setPostProcessEnabled(cameraPostProcess, true);
    setCameraPostProcess(player.camera!, cameraPostProcess);

    const cubeMesh = findActorByName(player.scene.children, 'Cube') as Mesh;
    setMeshMaterial(
        cubeMesh,
        createGBufferMaterial({
            metallic: 0,
            roughness: 0,
            emissiveColor: createColor(1.5, 1.5, 1.5),
        })
    );

    const backgroundPlane = findActorByName(player.scene.children, 'Background')! as Mesh;
    setMeshMaterial(
        backgroundPlane,
        createUnlitMaterial({
            name: 'backgroundPlane',
            baseColor: createColor(1, 1, 0, 1),
            fragmentShaderModifiers: [
                {
                    pragma: FragmentShaderModifierPragmas.APPEND_UNIFORMS,
                    value: `
uniform vec4 uPrimaryColor;
uniform sampler2D uRandomNoiseMap;
uniform sampler2D uPerlinNoiseMap;
                    `,
                },
                {
                    pragma: FragmentShaderModifierPragmas.AFTER_OUT,
                    value: `
// float t = uTimelineTime;
float t = uTime;
uv = vWorldPosition.xy * .55;
// grid offset
float gridCount = 10. + sin(uv.x * .8 + t * .3) * 3.;
float localX = fract(uv.x * gridCount);
// wave pattern
float perlinSrc = texture(uPerlinNoiseMap, uv * vec2(.15, .15) + vec2(t * .1, t * .05)).x;
vec2 offset = vec2(localX + t * .8, t * .4) * vec2(.1, .04);
float perlin = texture(uPerlinNoiseMap, uv * vec2(.15 + perlinSrc * .1, .15 + perlinSrc * .1) + offset).x;
// dot pattern
vec2 cellUv = fract(uv * 50.);
float circle = 1. - smoothstep(.2, .5, length(cellUv - .5));
// rand dither 
float randomX = texture(uRandomNoiseMap, vWorldPosition.xy * .1 + vec2(t, -t)).x;
float randomY = texture(uRandomNoiseMap, vWorldPosition.xy * .1 + vec2(t, t)).x;
float random = texture(uRandomNoiseMap, vWorldPosition.xy * .2 + vec2(randomX, randomY)).x;
float dither = .5 + random * .5 * (1. - perlin);
// composite
float pattern = circle * perlin * 3. + circle * .05;
vec3 color = vec3(pattern) * uPrimaryColor.xyz;
color *= dither;
outGBufferD = vec4(color, 1.);
`,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Timeline],
            uniforms: [
                {
                    name: 'uPrimaryColor',
                    type: UniformTypes.Color,
                    value: createColor(1, 1, 0, 1),
                },
                {
                    name: 'uPerlinNoiseMap',
                    type: UniformTypes.Texture,
                    value: player.engine.sharedTextures.get(SharedTexturesTypes.PERLIN_NOISE)!.texture,
                },
                {
                    name: 'uRandomNoiseMap',
                    type: UniformTypes.Texture,
                    value: player.engine.sharedTextures.get(SharedTexturesTypes.RANDOM_NOISE)!.texture,
                },
            ],
        })
    );
    addActorComponents(backgroundPlane, [createTimelineMaterialPropertyBinderController('uPrimaryColor', 'pc')]);

    const directionalLight = findActorByName(player.scene.children, 'DirectionalLight') as DirectionalLight;
    // shadows
    // TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
    if (directionalLight.shadowCamera) {
        directionalLight.shadowCamera.visibleFrustum = false;
        directionalLight.castShadow = false;
        directionalLight.shadowCamera.near = 1;
        directionalLight.shadowCamera.far = 15;
        setOrthoSize(directionalLight.shadowCamera as OrthographicCamera, null, null, -7, 7, -7, 7);
        directionalLight.shadowMap = createRenderTarget({
            gpu: player.gpu,
            width: 1024,
            height: 1024,
            type: RenderTargetTypes.Depth,
            depthPrecision: TextureDepthPrecisionType.High,
        });

        const helper = createArrowHelper({ gpu });
        addChildActor(directionalLight, helper);
    }

    setOnBeforeStartEngine(player.engine, () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        player.renderer.ambientOcclusionPass.enabled = false;

        player.renderer.lightShaftPass.enabled = false;

        player.renderer.screenSpaceShadowPass.enabled = false;

        player.renderer.ssrPass.enabled = false;

        // player.renderer.depthOfFieldPass.enabled = false;
        player.renderer.depthOfFieldPass.focusDistance = 18.5;
        player.renderer.depthOfFieldPass.focusRange = 17;

        player.renderer.fogPass.fogColor = createColorBlack();
        player.renderer.fogPass.fogDensity = 0.001;
        player.renderer.fogPass.fogDensityAttenuation = 0.001;
        player.renderer.fogPass.distanceFogStart = 1000;
        player.renderer.fogPass.distanceFogEnd = 1000;
        player.renderer.fogPass.distanceFogPower = 0.29;
        player.renderer.fogPass.sssFogRate = 0;

        player.renderer.depthOfFieldPass.focusDistance = 17.78;
        player.renderer.depthOfFieldPass.focusRange = 9.8;
        player.renderer.depthOfFieldPass.bokehRadius = 5.55;

        player.renderer.bloomPass.bloomAmount = 0.26;
        player.renderer.bloomPass.threshold = 1.534;
        player.renderer.bloomPass.tone = 0.46;

        player.renderer.streakPass.threshold = 0.9;
        player.renderer.streakPass.verticalScale = 1.12;
        player.renderer.streakPass.horizontalScale = 1.9;
        player.renderer.streakPass.intensity = 0.03;

        player.renderer.glitchPass.enabled = false;

        player.renderer.vignettePass.vignetteRadiusTo = 5;
    });

    if (isDevelopment()) {
        initDebugger(wrapperElement, {
            renderer: player.renderer,
            cameraPostProcess,
        });
    }
};

const main = async () => {
    await load();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
