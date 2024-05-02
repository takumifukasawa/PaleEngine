import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';
import { Skybox } from '@/PaleGL/actors/Skybox';
import { SkinnedMesh } from '@/PaleGL/actors/SkinnedMesh';
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { Scene } from '@/PaleGL/core/Scene';
import { Rotator } from '@/PaleGL/math/Rotator';
import { Texture } from '@/PaleGL/core/Texture';
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController';
import { Geometry } from '@/PaleGL/geometries/Geometry';
// import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { loadImg } from '@/PaleGL/loaders/loadImg';
import { Material } from '@/PaleGL/materials/Material';
import { Color } from '@/PaleGL/math/Color';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';
import { FXAAPass } from '@/PaleGL/postprocess/FXAAPass';
import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass';
import { TouchInputController } from '@/PaleGL/inputs/TouchInputController';
import { MouseInputController } from '@/PaleGL/inputs/MouseInputController';
import {
    UniformTypes,
    // TextureWrapTypes,
    // TextureFilterTypes,
    BlendTypes,
    RenderTargetTypes,
    AttributeNames,
    AttributeUsageType,
    UniformNames,
    FaceSide,
    TextureDepthPrecisionType,
    UniformBlockNames,
    ActorTypes,
} from '@/PaleGL/constants';

import { DebuggerGUI } from '@/DebuggerGUI';
import { Camera } from '@/PaleGL/actors/Camera';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Attribute } from '@/PaleGL/core/Attribute';
import { CubeMap } from '@/PaleGL/core/CubeMap.ts';
import { GBufferMaterial } from '@/PaleGL/materials/GBufferMaterial.ts';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { UnlitMaterial } from '@/PaleGL/materials/UnlitMaterial.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';

// assets
import smokeImgUrl from '../../../assets/images/particle-smoke.png?url';
// import floorDiffuseImgUrl from '../../../assets/images/rock_tile_floor_diff_1k.jpg?url';
// import floorNormalImgUrl from '../../../assets/images/rock_tile_floor_nor_gl_1k.jpg?url';
import CubeMapPositiveXImgUrl from '../../../assets/images/laufenurg_church/px.jpg?url';
import CubeMapNegativeXImgUrl from '../../../assets/images/laufenurg_church/nx.jpg?url';
import CubeMapPositiveYImgUrl from '../../../assets/images/laufenurg_church/py.jpg?url';
import CubeMapNegativeYImgUrl from '../../../assets/images/laufenurg_church/ny.jpg?url';
import CubeMapPositiveZImgUrl from '../../../assets/images/laufenurg_church/pz.jpg?url';
import CubeMapNegativeZImgUrl from '../../../assets/images/laufenurg_church/nz.jpg?url';
import { Ray } from '@/PaleGL/math/Ray.ts';
import { intersectRayWithPlane, Plane } from '@/PaleGL/math/Plane.ts';
// import gltfSphereModelUrl from '../../../assets/models/sphere-32x32.gltf?url';
// import gltfStreetLightModelUrl from '../../../assets/models/street-light.gltf?url';
// import gltfButterflyModelUrl from '../../../assets/models/butterfly-forward-thin.gltf?url';
// import gltfStreetFloorModelUrl from '../../../assets/models/street-floor.gltf?url';
// import gltfStreetFloorModelUrl from '../../../assets/models/street-floor-separete.gltf?url';

const createSpotLightDebugger = (spotLight: SpotLight, label: string) => {
    debuggerGUI.addBorderSpacer();

    const spotLightDebuggerGroup = debuggerGUI.addGroup(label, false);

    spotLightDebuggerGroup.addToggleDebugger({
        label: 'light enabled',
        initialValue: spotLight.enabled,
        onChange: (value) => (spotLight.enabled = value),
    });

    spotLightDebuggerGroup.addColorDebugger({
        label: 'color',
        initialValue: spotLight.color.getHexCoord(),
        onChange: (value) => {
            spotLight.color = Color.fromHex(value);
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.intensity,
        onChange: (value) => {
            spotLight.intensity = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'distance',
        minValue: 0,
        maxValue: 100,
        stepValue: 0.01,
        initialValue: spotLight.distance,
        onChange: (value) => {
            spotLight.distance = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'attenuation',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.attenuation,
        onChange: (value) => {
            spotLight.attenuation = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'coneCos',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: spotLight.coneCos,
        onChange: (value) => {
            spotLight.coneCos = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'penumbraCos',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: spotLight.penumbraCos,
        onChange: (value) => {
            spotLight.penumbraCos = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.x,
        onChange: (value) => {
            spotLight.transform.position.x = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.y,
        onChange: (value) => {
            spotLight.transform.position.y = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.z,
        onChange: (value) => {
            spotLight.transform.position.z = value;
        },
    });
};

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

const debuggerStates: {
    instanceNum: number;
    // orbitControlsEnabled: boolean;
} = {
    instanceNum: 0,
    // orbitControlsEnabled: true,
};

const searchParams = new URLSearchParams(location.search);
const instanceNumStr = searchParams.get('instance-num');
const initialInstanceNum = instanceNumStr ? Number.parseInt(instanceNumStr, 10) : 50;
console.log(`instance num: ${initialInstanceNum}`);

debuggerStates.instanceNum = initialInstanceNum;

let debuggerGUI: DebuggerGUI;
let width: number, height: number;
// let floorPlaneMesh: Mesh;
// let floorDiffuseMap: Texture;
// let floorNormalMap: Texture;
let streetFloorActor: Actor;
let streetLightActorLeft: Actor;
let streetLightActorRight: Actor;
let attractSphereMesh: Mesh;
let skinnedMesh: SkinnedMesh;
let cubeMap: CubeMap;
// let renderEnabled: boolean = true;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? new TouchInputController() : new MouseInputController();
inputController.start();

// const wrapperElement = document.getElementById("wrapper")!;
const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

// const canvasElement = document.getElementById("js-canvas")! as HTMLCanvasElement;
const canvasElement = document.createElement('canvas')!;
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false });

if (!gl) {
    throw 'invalid gl';
}

const gpu = new GPU({ gl });

const instanceNumView = document.createElement('p');
instanceNumView.textContent = `instance num: ${initialInstanceNum}`;
instanceNumView.style.cssText = `
position: absolute;
top: 0;
left: 0;
right: 0;
margin: auto;
padding: 0.2em 0.5em;
font-size: 9px;
color: white;
font-weight: bold;
text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
text-align: center;
`;
wrapperElement?.appendChild(instanceNumView);

const captureScene = new Scene();
// const compositeScene = new Scene();

// const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
const pixelRatio = Math.min(window.devicePixelRatio, 1);

const renderer = new Renderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = new Engine({ gpu, renderer });

// engine.setScenes([captureScene, compositeScene]);
engine.setScene(captureScene);

// const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 70);
const captureSceneCamera = new PerspectiveCamera(50, 1, 0.1, 50);
captureScene.add(captureSceneCamera);
// captureScene.mainCamera = captureSceneCamera;
// captureSceneCamera.mainCamera = true;

const orbitCameraController = new OrbitCameraController(captureSceneCamera);
orbitCameraController.distance = isSP ? 15 : 15;
orbitCameraController.attenuation = 0.01;
orbitCameraController.dampingFactor = 0.2;
orbitCameraController.azimuthSpeed = 100;
orbitCameraController.altitudeSpeed = 100;
orbitCameraController.deltaAzimuthPower = 2;
orbitCameraController.deltaAltitudePower = 2;
orbitCameraController.maxAltitude = 5;
orbitCameraController.minAltitude = -45;
orbitCameraController.maxAzimuth = 55;
orbitCameraController.minAzimuth = -55;
orbitCameraController.defaultAzimuth = 10;
orbitCameraController.defaultAltitude = -10;
orbitCameraController.lookAtTarget = new Vector3(0, 3, 0);
// orbitCameraController.enabled = true;

captureSceneCamera.subscribeOnStart(({ actor }) => {
    (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
});
captureSceneCamera.onFixedUpdate = () => {
    // 1: fixed position
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);

    // 2: orbit controls
    // if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
    if (inputController.isDown && orbitCameraController.enabled) {
        orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
    }
    orbitCameraController.fixedUpdate();
};

const directionalLight = new DirectionalLight({
    // intensity: 1.2,
    intensity: 0.1,
    // color: Color.fromRGB(255, 210, 200),
    color: Color.white,
});
// directionalLight.enabled = false; // NOTE: 一旦ガード

// shadows
// TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
if (directionalLight.shadowCamera) {
    directionalLight.shadowCamera.visibleFrustum = false;
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 15;
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -12, 12, -12, 12);
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -5, 5, -5, 5);
    (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -7, 7, -7, 7);
    directionalLight.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}

directionalLight.subscribeOnStart(({ actor }) => {
    actor.transform.setTranslation(new Vector3(-8, 8, -2));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    // const lightActor = actor as DirectionalLight;
    // lightActor.castShadow = true;
    // // lightActor.castShadow = false;
    // if (lightActor.shadowCamera) {
    //     lightActor.shadowCamera.near = 1;
    //     lightActor.shadowCamera.far = 30;
    //     (lightActor.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -10, 10, -10, 10);
    //     lightActor.shadowMap = new RenderTarget({gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth});
    // }
});
captureScene.add(directionalLight);

const spotLight1 = new SpotLight({
    intensity: 1.4,
    color: new Color(1, 1, 1),
    distance: 15,
    attenuation: 1.06,
    coneCos: 0.8,
    penumbraCos: 0.9,
});
// spotLight.enabled = false;

if (spotLight1.shadowCamera) {
    spotLight1.shadowCamera.visibleFrustum = false;
    spotLight1.castShadow = true;
    spotLight1.shadowCamera.near = 0.1;
    spotLight1.shadowCamera.far = spotLight1.distance;
    // spotLight.shadowCamera.far = 10;
    (spotLight1.shadowCamera as PerspectiveCamera).setPerspectiveSize(1); // TODO: いらないかも
    spotLight1.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}
spotLight1.subscribeOnStart(({ actor }) => {
    actor.transform.setTranslation(new Vector3(3.4, 8.1, 0));
    actor.transform.lookAt(new Vector3(2, 0, 0));
});

captureScene.add(spotLight1);

const spotLight2 = new SpotLight({
    intensity: 1.4,
    color: new Color(1, 1, 1),
    distance: 15,
    attenuation: 1.06,
    coneCos: 0.8,
    penumbraCos: 0.9,
});
// spotLight.enabled = false;

if (spotLight2.shadowCamera) {
    spotLight2.shadowCamera.visibleFrustum = false;
    spotLight2.castShadow = true;
    spotLight2.shadowCamera.near = 0.1;
    spotLight2.shadowCamera.far = spotLight2.distance;
    // spotLight.shadowCamera.far = 10;
    (spotLight2.shadowCamera as PerspectiveCamera).setPerspectiveSize(1); // TODO: いらないかも
    spotLight2.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}
spotLight2.subscribeOnStart(({ actor }) => {
    actor.transform.setTranslation(new Vector3(-3.4, 8.1, 0));
    actor.transform.lookAt(new Vector3(-2, 0, 0));
});

captureScene.add(spotLight2);

const cameraPostProcess = new PostProcess();
// const scenePostProcess = renderer.scenePostProcess;
// captureScene.scenePostProcess = scenePostProcess;

// const bloomPass = new BloomPass({
//     gpu,
//     threshold: 0.9,
//     bloomAmount: 0.8,
// });
// bloomPass.enabled = true;
// scenePostProcess.addPass(bloomPass);

// const ssaoPass = new SSAOPass({ gpu });
// ssaoPass.enabled = false;
// scenePostProcess.addPass(ssaoPass);

// const renderer.ssrPass = new SSRPass({ gpu });
// renderer.ssrPass.enabled = false;
// cameraPostProcess.addPass(renderer.ssrPass);

// const lightShaftPass = new LightShaftPass({ gpu });
// cameraPostProcess.addPass(lightShaftPass);
// lightShaftPass.blendRate = 0.7;
// lightShaftPass.rayStep = 0.35;
// lightShaftPass.attenuationBase = 64;
// lightShaftPass.attenuationPower = 4;
// lightShaftPass.enabled = true;

// const gaussianBlurPass = new GaussianBlurPass({ gpu });
// cameraPostProcess.addPass(gaussianBlurPass);
// gaussianBlurPass.enabled = true;

renderer.depthOfFieldPass.focusDistance = 18.5;
renderer.depthOfFieldPass.focusRange = 17;

const fxaaPass = new FXAAPass({ gpu });
cameraPostProcess.addPass(fxaaPass);

const bufferVisualizerPass = new BufferVisualizerPass({ gpu });
bufferVisualizerPass.enabled = false;
cameraPostProcess.addPass(bufferVisualizerPass);
// bufferVisualizerPass.beforeRender = () => {
//     bufferVisualizerPass.material.uniforms.setValue(
//         'uDirectionalLightShadowMap',
//         directionalLight.shadowMap!.read.depthTexture
//         // spotLight.shadowMap!.read.depthTexture
//     );
//     bufferVisualizerPass.material.uniforms.setValue('uSpotLightShadowMap', [
//         spotLight1.shadowMap!.read.depthTexture,
//         spotLight2.shadowMap!.read.depthTexture,
//         null,
//         null,
//     ]);
//     // console.log(bufferVisualizerPass.material.uniforms);
//     bufferVisualizerPass.material.uniforms.setValue(
//         'uAmbientOcclusionTexture',
//         renderer.ambientOcclusionPass.renderTarget.read.texture
//     );
//     bufferVisualizerPass.material.uniforms.setValue(
//         'uDeferredShadingTexture',
//         renderer.deferredShadingPass.renderTarget.read.texture
//     );
//     bufferVisualizerPass.material.uniforms.setValue(
//         'uLightShaftTexture',
//         renderer.lightShaftPass.renderTarget.read.texture
//     );
//     bufferVisualizerPass.material.uniforms.setValue(
//         'uVolumetricLightTexture',
//         renderer.volumetricLightPass.renderTarget.read.texture
//     );
//     bufferVisualizerPass.material.uniforms.setValue(
//         "uDepthOfFieldTexture",
//         renderer.depthOfFieldPass.renderTarget.read.texture
//     );
//     bufferVisualizerPass.material.uniforms.setValue('uFogTexture', renderer.fogPass.renderTarget.read.texture);
// };

cameraPostProcess.enabled = true;
// TODO: set post process いらないかも
captureSceneCamera.setPostProcess(cameraPostProcess);

/*
const debugTransformFeedback = () => {
    const transformFeedbackBuffer = new TransformFeedbackBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aArg1',
                data: new Float32Array([1, 2, 3, 4, 5, 6]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aArg2',
                data: new Float32Array([7, 8, 9, 10, 11, 12]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
        ],
        varyings: [
            {
                name: 'vArg1',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
            {
                name: 'vArg2',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        layout(location = 0) in vec3 aArg1;
        layout(location = 1) in vec3 aArg2;

        out vec3 vArg1;
        out vec3 vArg2;

        void main() {
            vArg1 = aArg1 * 2.;
            vArg2 = aArg2 * 3.;
        }
        `,
        fragmentShader: `#version 300 es

        precision highp float;

        void main() {
        }
        `,
        drawCount: 2,
    });
    gpu.updateTransformFeedback({
        shader: transformFeedbackBuffer.shader,
        uniforms: transformFeedbackBuffer.uniforms,
        vertexArrayObject: transformFeedbackBuffer.vertexArrayObject,
        transformFeedback: transformFeedbackBuffer.transformFeedback,
        drawCount: transformFeedbackBuffer.drawCount,
    });
    transformFeedbackBuffer.outputs.forEach(({ buffer }) => {
        const results = new Float32Array(6);
        gpu.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
        gpu.gl.bindBuffer(gl.ARRAY_BUFFER, null);
        console.log(results);
    });
};

const createTransformFeedbackDrivenMesh = () => {
    //
    // debugs
    //
    debugTransformFeedback();

    //
    // begin create mesh
    //

    const planeNum = 512;

    const initialPosition = new Float32Array(
        maton
            .range(planeNum)
            .map(() => {
                return [
                    // i,
                    // 0,
                    // 0,
                    Math.random() * 4 - 2,
                    Math.random() * 4 + 2,
                    Math.random() * 4 - 2,
                ];
            })
            .flat()
    );
    // const initialTransform = new Float32Array(
    //     maton
    //         .range(planeNum)
    //         .map(() => {
    //             // prettier-ignore
    //             return [
    //                 1, 0, 0, 0,
    //                 0, 1, 0, 0,
    //                 0, 0, 1, 0,
    //                 0, 0, 0, 1
    //                 // (Math.random() * 1 - .5) * .5,
    //                 // (Math.random() * 1 + .5) * .5,
    //                 // (Math.random() * 1 - .5) * .5,
    //             ];
    //         })
    //         .flat()
    // );
    const initialVelocity = new Float32Array(
        maton
            .range(planeNum)
            .map(() => {
                return [
                    0, 0, 0,
                    // (Math.random() * 1 - .5) * .5,
                    // (Math.random() * 1 + .5) * .5,
                    // (Math.random() * 1 - .5) * .5,
                ];
            })
            .flat()
    );
    const transformFeedbackDoubleBuffer = new TransformFeedbackDoubleBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aPosition',
                data: initialPosition,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aVelocity',
                data: initialVelocity,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            // new Attribute({
            //     name: 'aTransform',
            //     data: initialTransform,
            //     size: 16,
            //     usageType: AttributeUsageType.DynamicDraw,
            // }),
        ],
        varyings: [
            {
                name: 'vPosition',
                data: new Float32Array(initialPosition),
            },
            {
                name: 'vVelocity',
                data: new Float32Array(initialVelocity),
            },
            // {
            //     name: 'vTransform',
            //     data: new Float32Array(initialTransform),
            // },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        // TODO: ここ動的に構築してもいい
        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aVelocity;
        // layout(location = 2) in mat4 aTransform;

        out vec3 vPosition;
        // out mat4 vTransform;
        out vec3 vVelocity;

        uniform float uTime;
        uniform vec2 uNormalizedInputPosition;
        uniform vec3 uAttractTargetPosition;
        uniform float uAttractRate;

        // https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
        float noise(vec2 seed)
        {
            return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vPosition = aPosition + aVelocity;
            // vPosition = aPosition;
            // vTransform = aTransform;
            vec3 target = uAttractTargetPosition;
            vec2 seed = vec2(float(gl_VertexID), float(gl_VertexID));
            target += vec3(
                cos(noise(seed) * 2. + uTime * 6. + float(gl_VertexID) * 16.) * 2.,
                sin(noise(seed) * 4. + uTime * 3. + float(gl_VertexID) * 8.) * 2.,
                sin(noise(seed) * 6. + uTime * 4. + float(gl_VertexID) * 4.) * 2.
            );
            vec3 v = target - vPosition;
            vec3 dir = normalize(v);
            vVelocity = mix(
                aVelocity,
                dir * (.2 + uAttractRate * .2),
                .02 + sin(float(gl_VertexID)) * .01
                // .04 + uAttractRate * .0
            );
        }
        `,
        fragmentShader: `#version 300 es

        precision highp float;

        void main() {
        }
        `,
        uniforms: {
            [UniformNames.Time]: {
                type: UniformTypes.Float,
                value: 0,
            },
            uNormalizedInputPosition: {
                type: UniformTypes.Vector2,
                value: Vector2.zero,
            },
            uAttractTargetPosition: {
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            uAttractRate: {
                type: UniformTypes.Float,
                value: 0,
            },
        },
        drawCount: planeNum,
    });

    const boxGeometryData = createBoxGeometryData();

    const instancePosition = maton
        .range(planeNum, true)
        .map(() => {
            // return [i, 0, 0]
            return [0, 0, 0];
        })
        .flat();
    const instanceScale = maton
        .range(planeNum, true)
        .map(() => {
            return [
                // 1, 1, 1
                // 0.7, 0.7, 0.7,
                Math.random() * 0.4 + 0.2,
                Math.random() * 0.4 + 0.2,
                Math.random() * 0.4 + 0.2,
            ];
        })
        .flat();
    const instanceRotation = maton
        .range(planeNum, true)
        .map(() => {
            // return [i, 0, 0]
            return [0, 0, 0];
        })
        .flat();
    const instanceVelocity = maton
        .range(planeNum, true)
        .map(() => {
            // return [i, 0, 0]
            return [0, 0, 0];
        })
        .flat();
    // const accPositions = maton.range(3 * planeNum).map(() => {
    //     return 0;
    // });
    // const velocities = maton.range(3 * planeNum).map(() => {
    //     return 0;
    // });
    const instanceColor = maton
        .range(planeNum)
        .map(() => {
            const c = Color.fromRGB(
                Math.floor(Math.random() * 240 + 15),
                Math.floor(Math.random() * 10 + 245),
                Math.floor(Math.random() * 245 + 10)
            );
            return [...c.elements];
        })
        .flat();

    const geometry = new Geometry({
        gpu,
        attributes: [
            ...boxGeometryData.attributes,
            // new Attribute({
            //     name: AttributeNames.Position,
            //     data: planeGeometryRawData.positions,
            //     size: 3,
            // }),
            // new Attribute({
            //     name: AttributeNames.Normal,
            //     data: planeGeometryRawData.no,
            //     size: 3,
            // }),
            // new Attribute({
            //     name: AttributeNames.Uv,
            //     data: new Float32Array(uvs),
            //     size: 2,
            // }),
            // new Attribute({
            //     name: 'aAccPosition',
            //     data: new Float32Array(accPositions),
            //     size: 3,
            //     divisor: 1,
            // }),
            // new Attribute({
            //     name: 'aVelocity',
            //     data: new Float32Array(velocities),
            //     size: 3,
            //     divisor: 1,
            // }),
            new Attribute({
                name: AttributeNames.InstancePosition,
                data: new Float32Array(instancePosition),
                size: 3,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceScale,
                data: new Float32Array(instanceScale),
                size: 3,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceRotation,
                data: new Float32Array(instanceRotation),
                size: 3,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceVertexColor,
                data: new Float32Array(instanceColor),
                size: 4,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceVelocity,
                data: new Float32Array(instanceVelocity),
                size: 3,
                divisor: 1,
            }),
        ],
        indices: boxGeometryData.indices,
        drawCount: boxGeometryData.drawCount,
        instanceCount: planeNum,
    });
    const material = new GBufferMaterial({
        isInstancing: true,
        useVertexColor: true,
        vertexShaderModifier: {
            [VertexShaderModifierPragmas.INSTANCE_TRANSFORM_PRE_PROCESS]: `
                instanceRotation = getLookAtMat(aInstancePosition + aInstanceVelocity * 1000., aInstancePosition);
            `,
            // [VertexShaderModifierPragmas.APPEND_ATTRIBUTES]: 'layout(location = 3) in vec3 aVelocity;',
            // [VertexShaderModifierPragmas.APPEND_UNIFORMS]: `uniform float uTest;`,
            // [VertexShaderModifierPragmas.LOCAL_POSITION_POST_PROCESS]: `localPosition.xyz += aAccPosition;`,
            // [VertexShaderModifierPragmas.LOCAL_POSITION_POST_PROCESS]: `localPosition.xyz += aVelocity;`,
        },
    });
    const mesh = new Mesh({
        geometry,
        material,
        castShadow: true,
    });
    // mesh.transform.setScaling(new Vector3(1, 1, 1));
    let attractRate = 0;
    mesh.onUpdate = ({ time, deltaTime }) => {
        // mesh.material.uniforms.uTime.value = time;

        transformFeedbackDoubleBuffer.uniforms.uTime.value = time;
        transformFeedbackDoubleBuffer.uniforms.uNormalizedInputPosition.value = inputController.normalizedInputPosition;
        // transformFeedbackDoubleBuffer.uniforms.uAttractTargetPosition.value = new Vector3(0, 0, 0);
        transformFeedbackDoubleBuffer.uniforms.uAttractTargetPosition.value = attractSphereMesh.transform.position;

        attractRate += 2 * (inputController.isDown ? 1 : -1) * deltaTime;
        attractRate = saturate(attractRate);
        transformFeedbackDoubleBuffer.uniforms.uAttractRate.value = attractRate;
        gpu.updateTransformFeedback({
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();
        // };
        // mesh.onUpdate = () => {
        geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition')
        );
        geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity')
        );
        // geometry.vertexArrayObject.replaceBuffer(
        //     'aAccPosition',
        //     transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition')
        // );
        // geometry.vertexArrayObject.replaceBuffer(
        //     'aVelocity',
        //     transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity')
        // );
    };
   
    mesh.enabled = false;
    
    // mesh.transform.setTranslation(new Vector3(0, 2, 0));
    return mesh;
};
*/

const assetDir = '/demos/street-light/assets/';

const createStreetFloorActor = async () => {
    // const gltfActor = await loadGLTF({gpu, path: gltfStreetFloorModelUrl});
    const gltfActor = await loadGLTF({ gpu, dir: assetDir, path: 'street-floor-separete.gltf' });
    return gltfActor;
};

const createStreetLightActor = async () => {
    // const gltfActor = await loadGLTF({gpu, dir: assetDir,  path: "street-light.gltf"});
    const gltfActor = await loadGLTF({ gpu, dir: assetDir, path: 'street-light-full.gltf' });
    return gltfActor;

    // const mesh: Mesh = gltfActor.transform.children[0] as Mesh;
    // const mesh: Mesh = gltfActor;

    // const matA = new GBufferMaterial({
    //     diffuseColor: new Color(1, 1, 1, 1),
    //     metallic: 1,
    //     roughness: 1,
    // });
    // const matB = new GBufferMaterial({
    //     diffuseColor: new Color(1, 1, 1, 1),
    //     metallic: 1,
    //     roughness: 1,
    // });
    // const matC = new GBufferMaterial({
    //     diffuseColor: new Color(1, 1, 1, 1),
    //     metallic: 1,
    //     roughness: 1,
    // });
    // mesh.materials[0] = matA;
    // mesh.materials[1] = matB;
    // mesh.materials[2] = matC;

    // return mesh;
};

const createGLTFSphereMesh = async (material: Material) => {
    // const gltfActor = await loadGLTF({ gpu, path: gltfSphereModelUrl });
    const gltfActor = await loadGLTF({ gpu, dir: assetDir, path: 'sphere-32x32.gltf' });
    const mesh: Mesh = gltfActor.transform.children[0] as Mesh;
    mesh.castShadow = true;
    mesh.material = material;

    // mesh.material = new GBufferMaterial({
    //     // gpu,
    //     // diffuseMap: floorDiffuseMap,
    //     // normalMap: floorNormalMap,
    //     // envMap: cubeMap,
    //     // diffuseColor: new Color(0.5, 0.05, 0.05, 1),
    //     diffuseColor: new Color(1, 0.76, 0.336, 1),
    //     // diffuseColor: new Color(0, 0, 0, 1),
    //     // diffuseColor: new Color(1, 1, 1, 1),
    //     receiveShadow: true,
    //     metallic: 0,
    //     roughness: 0,
    //     // specularAmount: 0.4,
    //     // ambientAmount: 0.2,
    //     emissiveColor: new Color(1., 1., 1., 1.)
    // });
    return mesh;
};

const createInstanceUpdater = (instanceNum: number) => {
    //
    // begin create mesh
    //

    // const planeNum = 512;

    const initialPosition = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                const range = 10;
                return [
                    Math.random() * range - range * 0.5,
                    Math.random() * 4 + 2,
                    Math.random() * range - range * 0.5,
                ];
            })
            .flat()
    );

    const initialVelocity = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                return [0, 0, 0];
            })
            .flat()
    );

    const initialSeed = new Float32Array(
        maton
            .range(instanceNum, true)
            .map((i) => {
                return [
                    i,
                    i,
                    // i + Math.floor(Math.random() * 100000),
                    // // Math.floor(Math.random() * 10000),
                    // Math.floor(Math.random() * 100000)
                ];
            })
            .flat()
    );

    const transformFeedbackDoubleBuffer = new TransformFeedbackDoubleBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aPosition',
                data: initialPosition,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aVelocity',
                data: initialVelocity,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aSeed',
                data: initialSeed,
                size: 2,
                usageType: AttributeUsageType.StaticDraw,
            }),
        ],
        varyings: [
            {
                name: 'vPosition',
                data: new Float32Array(initialPosition),
            },
            {
                name: 'vVelocity',
                data: new Float32Array(initialVelocity),
            },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        // TODO: ここ動的に構築してもいい
        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aVelocity;
        layout(location = 2) in vec2 aSeed;

        out vec3 vPosition;
        // out mat4 vTransform;
        out vec3 vVelocity;


layout (std140) uniform ubCommon {
    float uTime;
};

        // uniform float uTime;
        uniform vec2 uNormalizedInputPosition;
        uniform vec3 uAttractTargetPosition;
        uniform float uAttractRate;

        // https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
        float noise(vec2 seed)
        {
            return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vPosition = aPosition + aVelocity;
            vec3 target = uAttractTargetPosition;
            vec2 seed = aSeed;
            float rand = noise(seed);
            target += vec3(
                cos(uTime + rand * 100. + seed.x) * (2. + rand * 1.),
                sin(uTime - rand * 400. + seed.x) * (1. + rand * 1.) + 1.,
                cos(uTime - rand * 300. + seed.x) * (2. + rand * 1.)
            );
            vec3 v = target - vPosition;
            vec3 dir = normalize(v);
            vVelocity = mix(
                aVelocity,
                dir * (.1 + uAttractRate * .1),
                .03 + sin(uTime * .2 + rand * 100.) * .02
            );
        }
        `,
        // fragmentShader: `#version 300 es

        // precision highp float;

        // void main() {
        // }
        // `,
        uniforms: [
            // {
            //     name: UniformNames.Time,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            {
                name: 'uNormalizedInputPosition',
                type: UniformTypes.Vector2,
                value: Vector2.zero,
            },
            {
                name: 'uAttractTargetPosition',
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: 'uAttractRate',
                type: UniformTypes.Float,
                value: 0,
            },
        ],
        uniformBlockNames: [UniformBlockNames.Common],
        drawCount: instanceNum,
    });

    // TODO: rendererかgpuでまとめたい
    transformFeedbackDoubleBuffer.uniformBlockNames.forEach((blockName) => {
        const targetGlobalUniformBufferObject = renderer.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            return;
        }
        const blockIndex = gpu.bindUniformBlockAndGetBlockIndex(
            targetGlobalUniformBufferObject.uniformBufferObject,
            transformFeedbackDoubleBuffer.shader,
            blockName
        );
        // console.log("hogehoge", blockName, blockIndex)
        // for debug
        // console.log(
        //     material.name,
        //     'addUniformBlock',
        //     material.uniformBlockNames,
        //     targetUniformBufferObject.blockName,
        //     blockIndex
        // );
        transformFeedbackDoubleBuffer.uniforms.addUniformBlock(
            blockIndex,
            targetGlobalUniformBufferObject.uniformBufferObject,
            []
        );
    });

    return transformFeedbackDoubleBuffer;
};

/**
 *
 */
const createGLTFSkinnedMesh = async (instanceNum: number) => {
    // const gltfActor = await loadGLTF({ gpu, dir: assetDir, path: 'butterfly-forward-thin.gltf' });
    const gltfActor = await loadGLTF({ gpu, dir: assetDir, path: 'butterfly-forward-thin-2.gltf' });

    // skinned mesh のはずなので cast
    const skinningMesh: SkinnedMesh = gltfActor.transform.children[0].transform.children[0] as SkinnedMesh;
    // console.log(gltfActor, skinningMesh);

    skinningMesh.name = 'butterfly';
    // ルートにanimatorをattachしてるので一旦ここでassign
    // TODO: set animation clips いらない気がする. animatorの設定さえあれば
    skinningMesh.animator = gltfActor.animator;
    skinningMesh.setAnimationClips(gltfActor.animator.animationClips);
    skinningMesh.subscribeOnStart(() => {
        // CPU skinning
        // gltfActor.animator.play('Fly', true);
        // gltfActor.animator.animationClips[0].speed = 0.2;
    });
    // skinningMesh.onUpdate = ({ deltaTime }) => {
    //     // skinningMesh.animator.update(deltaTime);
    //     // gltfActor.animator.update(deltaTime);
    // };

    const instanceInfo: {
        position: number[][];
        scale: number[][];
        rotation: number[][];
        velocity: number[][];
        color: number[][];
    } = {
        position: [],
        scale: [],
        rotation: [],
        velocity: [],
        color: [],
    };
    maton.range(instanceNum).forEach(() => {
        // const posRangeX = 20;
        // const posRangeZ = 20;
        // const px = (Math.random() * 2 - 1) * posRangeX;
        // const py = 0.5 + Math.random() * 2.;
        // const pz = (Math.random() * 2 - 1) * posRangeZ;
        // const p = [px, py, pz];
        // instanceInfo.position.push(p);
        instanceInfo.position.push([0, 0, 0]);

        const baseScale = 0.25;
        const randomScaleRange = 0.25;
        const s = Math.random() * randomScaleRange + baseScale;
        // instanceInfo.scale.push([s, s * 2, s]);
        instanceInfo.scale.push([s, s, s]);

        instanceInfo.rotation.push([0, 0, 0]);

        instanceInfo.velocity.push([0, 0, 0]);

        const c = Color.fromRGB(
            Math.floor(Math.random() * 180 + 20),
            Math.floor(Math.random() * 20 + 20),
            Math.floor(Math.random() * 180 + 20)
        );
        instanceInfo.color.push([...c.elements]);
    });
    const animationOffsetInfo = maton
        .range(instanceNum)
        .map(() => {
            return Math.random() * 30;
        })
        .flat();

    skinningMesh.castShadow = true;
    skinningMesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
            divisor: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
            divisor: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceRotation,
            data: new Float32Array(instanceInfo.rotation.flat()),
            size: 3,
            divisor: 1,
        })
    );
    // aInstanceAnimationOffsetは予約語
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(animationOffsetInfo),
            size: 1,
            divisor: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
            divisor: 1,
        })
    );

    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVelocity,
            data: new Float32Array(instanceInfo.velocity.flat()),
            size: 3,
            divisor: 1,
        })
    );

    // skinningMesh.material = new PhongMaterial({
    //     // gpu,
    //     specularAmount: 0.5,
    //     receiveShadow: true,
    //     isSkinning: true,
    //     gpuSkinning: true,
    //     isInstancing: true,
    //     useVertexColor: true,
    //     envMap: cubeMap,
    //     ambientAmount: 0.2,
    // });
    skinningMesh.material = new GBufferMaterial({
        // gpu,
        // specularAmount: 0.5,
        // diffuseColor: Color.white(),
        metallic: 0,
        roughness: 1,
        receiveShadow: true,
        isSkinning: true,
        gpuSkinning: true,
        isInstancing: true,
        useInstanceLookDirection: true,
        useVertexColor: true,
        faceSide: FaceSide.Double,
    });

    const transformFeedbackDoubleBuffer = createInstanceUpdater(instanceNum);

    let attractRate = 0;
    skinningMesh.onUpdate = ({ deltaTime }) => {
        // mesh.material.uniforms.uTime.value = time;

        // transformFeedbackDoubleBuffer.uniforms.setValue(UniformNames.Time, time);
        transformFeedbackDoubleBuffer.uniforms.setValue(
            'uNormalizedInputPosition',
            inputController.normalizedInputPosition
        );
        // transformFeedbackDoubleBuffer.uniforms.uAttractTargetPosition.value = new Vector3(0, 0, 0);
        transformFeedbackDoubleBuffer.uniforms.setValue('uAttractTargetPosition', attractSphereMesh.transform.position);

        attractRate += (inputController.isDown ? 1 : -1) * deltaTime * 2;
        attractRate = saturate(attractRate);
        transformFeedbackDoubleBuffer.uniforms.setValue('uAttractRate', attractRate);
        gpu.updateTransformFeedback({
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();
        // };
        // mesh.onUpdate = () => {
        skinnedMesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition')
        );
        skinnedMesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity')
        );
    };

    // skinningMesh.debugBoneView = true;
    // skinningMesh.enabled = false;

    return skinningMesh;
};

const main = async () => {
    const particleImg = await loadImg(smokeImgUrl);
    const particleMap = new Texture({
        gpu,
        img: particleImg,
    });

    // const floorDiffuseImg = await loadImg(floorDiffuseImgUrl);
    // floorDiffuseMap = new Texture({
    //     gpu,
    //     img: floorDiffuseImg,
    //     // mipmap: true,
    //     wrapS: TextureWrapTypes.Repeat,
    //     wrapT: TextureWrapTypes.Repeat,
    //     minFilter: TextureFilterTypes.Linear,
    //     magFilter: TextureFilterTypes.Linear,
    // });

    // const floorNormalImg = await loadImg(floorNormalImgUrl);
    // floorNormalMap = new Texture({
    //     gpu,
    //     img: floorNormalImg,
    //     // mipmap: true,
    //     wrapS: TextureWrapTypes.Repeat,
    //     wrapT: TextureWrapTypes.Repeat,
    //     minFilter: TextureFilterTypes.Linear,
    //     magFilter: TextureFilterTypes.Linear,
    // });

    cubeMap = await loadCubeMap(
        gpu,
        CubeMapPositiveXImgUrl,
        CubeMapNegativeXImgUrl,
        CubeMapPositiveYImgUrl,
        CubeMapNegativeYImgUrl,
        CubeMapPositiveZImgUrl,
        CubeMapNegativeZImgUrl
    );

    const skyboxMesh = new Skybox({
        gpu,
        cubeMap,
        diffuseIntensity: 0.2,
        specularIntensity: 0.2,
        // rotationOffset: 0.8,
        renderMesh: false,
    });
    // skyboxMesh.enabled = false;

    //
    // street floor
    //

    streetFloorActor = await createStreetFloorActor();
    captureScene.add(streetFloorActor);
    streetFloorActor.transform.children.forEach((child) => {
        if (child.type === ActorTypes.Mesh) {
            (child as Mesh).castShadow = true;
        }
    });
    console.log('streetFloorActor', streetFloorActor);

    //
    // street light
    //

    streetLightActorLeft = await createStreetLightActor();
    streetLightActorLeft.subscribeOnStart(() => {
        streetLightActorLeft.transform.position = new Vector3(6, 0, 0);
        streetLightActorLeft.transform.scale = Vector3.fill(1.8);
    });
    captureScene.add(streetLightActorLeft);

    streetLightActorRight = await createStreetLightActor();
    streetLightActorRight.subscribeOnStart(() => {
        streetLightActorRight.transform.rotation = new Rotator(0, 180, 0);
        streetLightActorRight.transform.position = new Vector3(-6, 0, 0);
        streetLightActorRight.transform.scale = Vector3.fill(1.8);
    });
    captureScene.add(streetLightActorRight);

    //
    // attract mesh
    //

    attractSphereMesh = await createGLTFSphereMesh(
        new UnlitMaterial({
            emissiveColor: new Color(3, 3, 3, 1),
            // receiveShadow: true,
        })
    );
    attractSphereMesh.subscribeOnStart(({ actor }) => {
        actor.transform.setScaling(Vector3.fill(0.5));
        // actor.transform.setTranslation(new Vector3(0, 3, 0));
    });
    attractSphereMesh.onFixedUpdate = () => {
        const w = 5;
        // const d = 2;
        const d = 5;
        const ix = inputController.normalizedInputPosition.x * 2 - 1;
        const iy = inputController.normalizedInputPosition.y * 2 - 1;
        const x = ix * w;
        const z = iy * d;
        const y = 3;
        attractSphereMesh.transform.setTranslation(new Vector3(x, y, z));

        // const cameraRay = new Ray(captureSceneCamera.transform.position, captureSceneCamera.cameraForward);
        // const floorPlane = new Plane(Vector3.zero, Vector3.up);
        // const intersect = intersectRayWithPlane(cameraRay, floorPlane);
        // if(intersect) {
        //     attractSphereMesh.transform.setTranslation(intersect);
        // }
    };

    //
    // instancing mesh
    //

    skinnedMesh = await createGLTFSkinnedMesh(initialInstanceNum);

    //
    // floor mesh
    //

    // const floorGeometry = new PlaneGeometry({
    //     gpu,
    //     calculateTangent: true,
    //     calculateBinormal: true,
    // });
    // floorPlaneMesh = new Mesh({
    //     geometry: floorGeometry,
    //     material: new GBufferMaterial({
    //         diffuseMap: floorDiffuseMap,
    //         normalMap: floorNormalMap,
    //         diffuseColor: new Color(1, 1, 1, 1),
    //         receiveShadow: true,
    //         metallic: 0,
    //         roughness: 0.5,
    //     }),
    //     castShadow: true,
    // });
    // floorPlaneMesh.subscribeOnStart(({ actor }) => {
    //     const meshActor = actor as Mesh;
    //     actor.transform.setScaling(Vector3.fill(20));
    //     actor.transform.setRotationX(-90);
    //     meshActor.material.uniforms.setValue('uDiffuseMapUvScale', new Vector2(6, 6));
    //     meshActor.material.uniforms.setValue('uNormalMapUvScale', new Vector2(6, 6));
    // });

    //
    // particle mesh
    //

    const particleNum = 48;
    const particleGeometry = new Geometry({
        gpu,
        attributes: [
            new Attribute({
                name: AttributeNames.Position.toString(),
                // dummy data
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const x = Math.random() * 6 - 4;
                            const y = Math.random() * 0.5;
                            const z = Math.random() * 5.4 - 1.4;
                            return [x, y, z, x, y, z, x, y, z, x, y, z];
                        })
                        .flat()
                ),
                size: 3,
            }),
            new Attribute({
                name: AttributeNames.Uv.toString(),
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
                        .flat()
                ),
                size: 2,
            }),
            new Attribute({
                name: AttributeNames.Color.toString(),
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const v = Math.random() * 150 + 50;
                            const a = Math.random() * 75 + 25;
                            const c = Color.fromRGB(v, v, v, a);
                            return [...c.elements, ...c.elements, ...c.elements, ...c.elements];
                        })
                        .flat()
                ),
                size: 4,
            }),
            new Attribute({
                name: 'aBillboardSize',
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const s = Math.random() * 6.25 + 1.75;
                            return [s, s, s, s];
                        })
                        .flat()
                ),
                size: 1,
            }),
            new Attribute({
                name: 'aBillboardRateOffset',
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const r = Math.random();
                            return [r, r, r, r];
                        })
                        .flat()
                ),
                size: 1,
            }),
        ],
        indices: maton
            .range(particleNum)
            .map((_, i) => {
                const offset = i * 4;
                const index = [0 + offset, 1 + offset, 2 + offset, 2 + offset, 1 + offset, 3 + offset];
                return index;
            })
            .flat(),
        drawCount: particleNum * 6,
    });
    const particleMaterial = new Material({
        // gpu,
        vertexShader: `#version 300 es

#pragma DEFINES

#pragma ATTRIBUTES

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

out vec4 vVertexColor;
out vec4 vViewPosition;
out vec4 vClipPosition;

out float vParticleId;

#pragma ENGINE_UNIFORMS
#pragma TRANSFORM_VERTEX_UNIFORMS

uniform vec2[4] uBillboardPositionConverters;

void main() {
    int particleId = int(mod(float(gl_VertexID), 4.));
    float fParticleId = float(particleId);
    vParticleId = fParticleId;

    float t = 3.;
    float rateOffset = mod(fParticleId, 4.) * .1;
    float r = mod((((uTime + rateOffset) / t) + aBillboardRateOffset), 1.);

    vec4 localPosition = vec4(aPosition, 1.);

    localPosition.x += mix(0., 4., r) * mix(.4, .8, aBillboardRateOffset);
    localPosition.z += mix(0., 2., r) * mix(-.4, -.8, aBillboardRateOffset);

    // assign common varyings 
    vUv = aUv; 
    vVertexColor = aColor;
    vVertexColor.a *= (smoothstep(0., .2, r) * (1. - smoothstep(.2, 1., r)));
    
    vec4 worldPosition = uWorldMatrix * localPosition;
  
    vWorldPosition = worldPosition.xyz;
    
    vec4 viewPosition = uViewMatrix * worldPosition;
    viewPosition.xy += uBillboardPositionConverters[particleId] * aBillboardSize;
    vViewPosition = viewPosition;
    
    vec4 clipPosition = uProjectionMatrix * viewPosition;
 
    gl_Position = clipPosition;
    
    vClipPosition = clipPosition;
}`,
        fragmentShader: `#version 300 es

#pragma DEFINES

precision highp float;

in float vParticleId;
in vec2 vUv;
in vec4 vVertexColor;
in vec4 vViewPosition;
in vec4 vClipPosition;

out vec4 outColor;
// layout (location = 0) out vec4 outBaseColor;
// layout (location = 1) out vec4 outNormalColor;

uniform sampler2D uParticleMap;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;

#pragma ENGINE_UNIFORMS
#pragma DEPTH_FUNCTIONS

void main() {
    vec4 texColor = texture(uParticleMap, vUv);
    vec3 baseColor = vVertexColor.xyz;
    float alpha = texColor.x * vVertexColor.a;
    
    vec4 fadeColor = texture(
        uParticleMap,
        vUv + vec2(mod(uTime * .06 + float(vParticleId) * .1, 1.), 0.)
    );
    alpha *= fadeColor.x * 2.;
    
    // calc soft fade
    
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(sceneDepth), 1.);

    float currentDepth = viewZToLinearDepth(vViewPosition.z, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(currentDepth), 1.);
    
    float diffDepth = abs(sceneDepth) - abs(currentDepth);
    float softFade = smoothstep(0., .02, diffDepth);
    // for debug
    // outColor = vec4(vec3(softFade), 1.);
    
    // result
    
    // outBaseColor = vec4(1., 0., 0., 1.);
    // outColor = vec4(1., 0., 0., 1.);

    float fadedAlpha = alpha * softFade;
    if(fadedAlpha < .01) {
        discard;
    }

    outColor = vec4(baseColor, fadedAlpha);
    // outBaseColor = vec4(baseColor, fadedAlpha);
    // outNormalColor = vec4(0., 0., 1., 1.); // dummy
}
        `,
        uniforms: [
            {
                name: 'uParticleMap',
                type: UniformTypes.Texture,
                value: particleMap,
            },
            {
                name: 'uBillboardPositionConverters',
                type: UniformTypes.Vector2Array,
                value: [new Vector2(-1, 1), new Vector2(-1, -1), new Vector2(1, 1), new Vector2(1, -1)],
            },
            // {
            //     name: UniformNames.Time,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.CameraNear,
                type: UniformTypes.Float,
                value: captureSceneCamera.near,
            },
            {
                name: UniformNames.CameraFar,
                type: UniformTypes.Float,
                value: captureSceneCamera.far,
            },
        ],
        // blendType: BlendTypes.Additive
        blendType: BlendTypes.Transparent,
        depthWrite: false,
        uniformBlockNames: [UniformBlockNames.Common],
    });
    const particleMesh = new Mesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });

    captureScene.add(attractSphereMesh);
    captureScene.add(skinnedMesh);
    // captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(particleMesh);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        inputController.setSize(width, height);
        engine.setSize(width, height);
    };

    engine.onBeforeStart = () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        renderer.fogPass.fogColor = Color.black;
        renderer.fogPass.fogDensity = 0.023;
        renderer.fogPass.fogDensityAttenuation = 0.065;
        renderer.fogPass.distanceFogStart = 18;
        renderer.fogPass.distanceFogPower = 0.29;

        renderer.depthOfFieldPass.focusDistance = 17.78;
        renderer.depthOfFieldPass.focusRange = 9.8;
        renderer.depthOfFieldPass.bokehRadius = 5.55;

        renderer.bloomPass.bloomAmount = 0.26;
        renderer.bloomPass.threshold = 1.534;
        renderer.bloomPass.tone = 0.46;

        orbitCameraController.start();
    };

    engine.onBeforeUpdate = () => {
        if (!debuggerGUI) initDebugger();
        inputController.update();
    };

    engine.onBeforeFixedUpdate = () => {
        // inputController.fixedUpdate();
    };

    engine.onRender = (time) => {
        renderer.render(captureScene, captureSceneCamera, { time });
    };

    const tick = (time: number) => {
        engine.run(time);
        requestAnimationFrame(tick);
    };

    engine.start();
    requestAnimationFrame(tick);
};

function initDebugger() {
    debuggerGUI = new DebuggerGUI();

    debuggerGUI.addSliderDebugger({
        label: 'instance num',
        minValue: 1,
        maxValue: 1024,
        initialValue: debuggerStates.instanceNum,
        stepValue: 1,
        onChange: (value) => {
            debuggerStates.instanceNum = value;
        },
    });

    debuggerGUI.addButtonDebugger({
        buttonLabel: 'reload',
        onClick: () => {
            const url = `${location.origin}${location.pathname}?instance-num=${debuggerStates.instanceNum}`;
            location.replace(url);
        },
    });

    // debuggerGUI.addToggleDebugger({
    //     label: 'render enabled',
    //     initialValue: renderEnabled,
    //     onChange: (value) => (renderEnabled = value),
    // });

    //
    // orbit controls
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'orbit controls enabled',
        // initialValue: debuggerStates.orbitControlsEnabled,
        // onChange: (value) => (debuggerStates.orbitControlsEnabled = value),
        initialValue: orbitCameraController.enabled,
        onChange: (value) => (orbitCameraController.enabled = value),
    });

    //
    // show buffers
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'show buffers',
        initialValue: bufferVisualizerPass.enabled,
        onChange: (value) => (bufferVisualizerPass.enabled = value),
    });

    //
    // directional light
    //

    debuggerGUI.addBorderSpacer();

    const directionalLightDebuggerGroup = debuggerGUI.addGroup('directional light', false);

    directionalLightDebuggerGroup.addToggleDebugger({
        label: 'light enabled',
        initialValue: directionalLight.enabled,
        onChange: (value) => (directionalLight.enabled = value),
    });

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: directionalLight.intensity,
        onChange: (value) => {
            directionalLight.intensity = value;
        },
    });

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.x,
        onChange: (value) => {
            directionalLight.transform.position.x = value;
        },
    });

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.y,
        onChange: (value) => {
            directionalLight.transform.position.y = value;
        },
    });

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.z,
        onChange: (value) => {
            directionalLight.transform.position.z = value;
        },
    });

    //
    // spot light
    //

    createSpotLightDebugger(spotLight1, 'spot light 1');
    createSpotLightDebugger(spotLight2, 'spot light 2');

    //
    // ssao
    // TODO: ssao pass の参照を renderer に変える
    //

    debuggerGUI.addBorderSpacer();

    const ssaoDebuggerGroup = debuggerGUI.addGroup('ssao', false);

    ssaoDebuggerGroup.addToggleDebugger({
        label: 'ssao pass enabled',
        initialValue: renderer.ambientOcclusionPass.enabled,
        onChange: (value) => (renderer.ambientOcclusionPass.enabled = value),
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion sample length',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionSampleLength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionSampleLength = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion bias',
        minValue: 0.0001,
        maxValue: 0.01,
        stepValue: 0.0001,
        initialValue: renderer.ambientOcclusionPass.occlusionBias,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionBias = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao min distance',
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMinDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMinDistance = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao max distance',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMaxDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMaxDistance = value;
        },
    });

    ssaoDebuggerGroup.addColorDebugger({
        label: 'ssao color',
        initialValue: renderer.ambientOcclusionPass.occlusionColor.getHexCoord(),
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionColor = Color.fromHex(value);
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion power',
        minValue: 0.5,
        maxValue: 4,
        stepValue: 0.01,
        initialValue: renderer.ambientOcclusionPass.occlusionPower,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionPower = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion strength',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionStrength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionStrength = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.blendRate,
        onChange: (value) => {
            renderer.ambientOcclusionPass.blendRate = value;
        },
    });

    //
    // light shaft
    //

    debuggerGUI.addBorderSpacer();

    const lightShaftDebuggerGroup = debuggerGUI.addGroup('light shaft', false);

    lightShaftDebuggerGroup.addToggleDebugger({
        label: 'light shaft pass enabled',
        initialValue: renderer.lightShaftPass.enabled,
        onChange: (value) => (renderer.lightShaftPass.enabled = value),
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.blendRate,
        onChange: (value) => {
            renderer.lightShaftPass.blendRate = value;
        },
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'pass scale',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.passScaleBase,
        onChange: (value) => {
            renderer.lightShaftPass.passScaleBase = value;
        },
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'ray step strength',
        minValue: 0.001,
        maxValue: 0.05,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.rayStepStrength,
        onChange: (value) => {
            renderer.lightShaftPass.rayStepStrength = value;
        },
    });

    //
    // light volume pass
    //

    debuggerGUI.addBorderSpacer();

    const volumetricLightDebuggerGroup = debuggerGUI.addGroup('volumetric light', false);

    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'ray step',
        initialValue: renderer.volumetricLightPass.rayStep,
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayStep = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'density multiplier',
        initialValue: renderer.volumetricLightPass.densityMultiplier,
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.densityMultiplier = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'jitter size x',
        initialValue: renderer.volumetricLightPass.rayJitterSizeX,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayJitterSizeX = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'jitter size y',
        initialValue: renderer.volumetricLightPass.rayJitterSizeY,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayJitterSizeY = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        initialValue: renderer.volumetricLightPass.blendRate,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.blendRate = value;
        },
    });

    //
    // fog
    //

    debuggerGUI.addBorderSpacer();

    const fogDebuggerGroup = debuggerGUI.addGroup('fog', false);

    // fogDebuggerGroup.addToggleDebugger({
    //     label: 'fog pass enabled',
    //     initialValue: renderer.lightShaftPass.enabled,
    //     onChange: (value) => (renderer.lightShaftPass.enabled = value),
    // });

    // fogDebuggerGroup.addSliderDebugger({
    //     label: 'strength',
    //     minValue: 0,
    //     maxValue: 0.2,
    //     stepValue: 0.0001,
    //     initialValue: renderer.fogPass.fogStrength,
    //     onChange: (value) => {
    //         renderer.fogPass.fogStrength = value;
    //     },
    // });

    fogDebuggerGroup.addColorDebugger({
        label: 'fog color',
        initialValue: renderer.fogPass.fogColor.getHexCoord(),
        onChange: (value) => {
            renderer.fogPass.fogColor = Color.fromHex(value);
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'density',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensity,
        onChange: (value) => {
            renderer.fogPass.fogDensity = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'attenuation',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensityAttenuation,
        onChange: (value) => {
            renderer.fogPass.fogDensityAttenuation = value;
        },
    });

    // fogDebuggerGroup.addSliderDebugger({
    //     label: 'fog end height',
    //     minValue: -5,
    //     maxValue: 5,
    //     stepValue: 0.0001,
    //     initialValue: renderer.fogPass.fogEndHeight,
    //     onChange: (value) => {
    //         renderer.fogPass.fogEndHeight = value;
    //     },
    // });

    fogDebuggerGroup.addSliderDebugger({
        label: 'distance fog start',
        minValue: 0,
        maxValue: captureSceneCamera.far,
        stepValue: 0.01,
        initialValue: renderer.fogPass.distanceFogStart,
        onChange: (value) => {
            renderer.fogPass.distanceFogStart = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'distance fog power',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.fogPass.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.distanceFogPower = value;
        },
    });

    //
    // depth of field
    //

    debuggerGUI.addBorderSpacer();

    const dofDebuggerGroup = debuggerGUI.addGroup('depth of field', false);

    dofDebuggerGroup.addToggleDebugger({
        label: 'DoF pass enabled',
        initialValue: renderer.depthOfFieldPass.enabled,
        onChange: (value) => (renderer.depthOfFieldPass.enabled = value),
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF focus distance',
        minValue: 0.1,
        maxValue: 100,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusDistance,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusDistance = value;
        },
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF focus range',
        minValue: 0.1,
        maxValue: 30,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusRange,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusRange = value;
        },
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF bokeh radius',
        minValue: 0.01,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.bokehRadius,
        onChange: (value) => {
            renderer.depthOfFieldPass.bokehRadius = value;
        },
    });

    //
    // bloom
    //

    debuggerGUI.addBorderSpacer();

    const bloomDebuggerGroup = debuggerGUI.addGroup('bloom', false);

    bloomDebuggerGroup.addToggleDebugger({
        label: 'Bloom pass enabled',
        initialValue: renderer.bloomPass.enabled,
        onChange: (value) => (renderer.bloomPass.enabled = value),
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom amount',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.bloomAmount,
        onChange: (value) => {
            renderer.bloomPass.bloomAmount = value;
        },
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom threshold',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.threshold,
        onChange: (value) => {
            renderer.bloomPass.threshold = value;
        },
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom tone',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.tone,
        onChange: (value) => {
            renderer.bloomPass.tone = value;
        },
    });

    //
    // ssr debuggers
    //

    debuggerGUI.addBorderSpacer();

    const ssrDebuggerGroup = debuggerGUI.addGroup('ssr', false);

    ssrDebuggerGroup.addToggleDebugger({
        label: 'ssr pass enabled',
        initialValue: renderer.ssrPass.enabled,
        onChange: (value) => (renderer.ssrPass.enabled = value),
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'depth bias',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayDepthBias,
        onChange: (value) => {
            renderer.ssrPass.rayDepthBias = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray nearest distance',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayNearestDistance,
        onChange: (value) => {
            renderer.ssrPass.rayNearestDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.rayMaxDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray thickness',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayThickness,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayThickness = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'jitter size x',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayJitterSizeX,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayJitterSizeX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'jitter size y',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayJitterSizeY,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayJitterSizeY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'roughness power',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.01,
        initialValue: renderer.ssrPass.reflectionRoughnessPower,
        onChange: (value) => {
            renderer.ssrPass.reflectionRoughnessPower = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'fade min distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionFadeMinDistance,
        onChange: (value) => {
            renderer.ssrPass.reflectionFadeMinDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'fade max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionFadeMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.reflectionFadeMaxDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor min x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor max x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor min y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor max y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'additional rate',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.01,
        initialValue: renderer.ssrPass.reflectionAdditionalRate,
        onChange: (value) => {
            renderer.ssrPass.reflectionAdditionalRate = value;
        },
    });

    // debuggerGUI.addSliderDebugger({
    //     label: 'ssr blend rate',
    //     minValue: 0,
    //     maxValue: 1,
    //     stepValue: 0.001,
    //     initialValue: renderer.ssrPass.blendRate,
    //     onChange: (value) => {
    //         renderer.ssrPass.blendRate = value;
    //     },
    // });

    //
    // fxaa
    //

    debuggerGUI.addBorderSpacer();

    const fxaaDebuggerGroup = debuggerGUI.addGroup('fxaa', false);

    fxaaDebuggerGroup.addToggleDebugger({
        label: 'fxaa pass enabled',
        initialValue: fxaaPass.enabled,
        onChange: (value) => (fxaaPass.enabled = value),
    });

    //
    // add debugger ui
    //

    wrapperElement.appendChild(debuggerGUI.domElement);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
