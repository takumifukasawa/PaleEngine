import smokeImgUrl from '../images/particle-smoke.png?url';
import leaveDiffuseImgUrl from '../images/brown_mud_leaves_01_diff_1k.jpg?url';
import leaveNormalImgUrl from '../images/brown_mud_leaves_01_nor_gl_1k.jpg?url';
import CubeMapPositiveXImgUrl from '../images/px.jpg?url';
import CubeMapNegativeXImgUrl from '../images/nx.jpg?url';
import CubeMapPositiveYImgUrl from '../images/py.jpg?url';
import CubeMapNegativeYImgUrl from '../images/ny.jpg?url';
import CubeMapPositiveZImgUrl from '../images/pz.jpg?url';
import CubeMapNegativeZImgUrl from '../images/nz.jpg?url';
import gltfLSphereModelUrl from '../models/sphere-32x32.gltf?url';
import gltfLGlassModelUrl from '../models/glass-wind-poly.gltf?url';

// actors
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';
import { Skybox } from '@/PaleGL/actors/Skybox';
import { SkinnedMesh } from '@/PaleGL/actors/SkinnedMesh';

// core
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
// import {GBufferRenderTargets} from '@/PaleGL/core/GBufferRenderTargets';
import { Scene } from '@/PaleGL/core/Scene';
import { Texture } from '@/PaleGL/core/Texture';
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController';

// geometries
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { createPlaneGeometryData, PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';

// loaders
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { loadImg } from '@/PaleGL/loaders/loadImg';

// materials
import { Material } from '@/PaleGL/materials/Material';
// import { PhongMaterial } from '@/PaleGL/materials/PhongMaterial';

// math
import { Color } from '@/PaleGL/math/Color';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

// postprocess
// import {FragmentPass} from '@/PaleGL/postprocess/FragmentPass';
// import {PostProcess} from '@/PaleGL/postprocess/PostProcess';
import { FXAAPass } from '@/PaleGL/postprocess/FXAAPass';
// import { BloomPass } from '@/PaleGL/postprocess/BloomPass';
// import { SSAOPass } from '@/PaleGL/postprocess/SSAOPass';
// import { SSRPass } from '@/PaleGL/postprocess/SSRPass';
// import { LightShaftPass } from "@/PaleGL/postprocess/LightShaftPass";
import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass';

// inputs
import { TouchInputController } from '@/PaleGL/inputs/TouchInputController';
import { MouseInputController } from '@/PaleGL/inputs/MouseInputController';

// others
import {
    UniformTypes,
    TextureWrapTypes,
    TextureFilterTypes,
    BlendTypes,
    CubeMapAxis,
    RenderTargetTypes,
    AttributeNames,
    AttributeUsageType,
    VertexShaderModifierPragmas,
} from '@/PaleGL/constants';

import { DebuggerGUI } from '@/DebuggerGUI';
import { Camera } from '@/PaleGL/actors/Camera';
// import {Light} from "@/PaleGL/actors/Light";
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Attribute } from '@/PaleGL/core/Attribute';
// import {Matrix4} from '@/PaleGL/math/Matrix4.ts';
import { CubeMap } from '@/PaleGL/core/CubeMap.ts';
import { GBufferMaterial } from '@/PaleGL/materials/GBufferMaterial.ts';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import { TransformFeedbackBuffer } from '@/PaleGL/core/TransformFeedbackBuffer.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
// import {Shader} from "@/PaleGL/core/Shader.ts";
// import * as buffer from 'buffer';
// import {Light} from "@/PaleGL/actors/Light.ts";
// import {Actor} from "@/PaleGL/actors/Actor.ts";

// import testVert from '@/PaleGL/shaders/test-shader-vert.glsl';
// import testFrag from '@/PaleGL/shaders/test-shader-frag.glsl';
// import phongVert from '@/PaleGL/shaders/phong-vertex.glsl';

// console.log('----- vert -----');
// console.log(testVert);
// console.log('----- frag -----');
// console.log(testFrag);
// console.log('----- phong vert -----');
// console.log(phongVert);
// console.log('----------------');

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
    orbitControlsEnabled: boolean;
} = {
    instanceNum: 0,
    orbitControlsEnabled: true,
};

const searchParams = new URLSearchParams(location.search);
const instanceNumStr = searchParams.get('instance-num');
const instanceNum = instanceNumStr ? Number.parseInt(instanceNumStr, 10) : 500;
console.log(`instance num: ${instanceNum}`);

debuggerStates.instanceNum = instanceNum;

let debuggerGUI: DebuggerGUI;
let width: number, height: number;
let floorPlaneMesh: Mesh;
let floorDiffuseMap: Texture;
let floorNormalMap: Texture;
let sphereMesh: Mesh;
let skinnedMesh: SkinnedMesh;
let cubeMap: CubeMap;

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
instanceNumView.textContent = `instance num: ${instanceNum}`;
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

const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
// const pixelRatio = Math.min(window.devicePixelRatio, 1);
// const pixelRatio = ;

const renderer = new Renderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = new Engine({ gpu, renderer });

// engine.setScenes([captureScene, compositeScene]);
engine.setScene(captureScene);

// const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 70);
const captureSceneCamera = new PerspectiveCamera(70, 1, 0.1, 50);
captureScene.add(captureSceneCamera);
// captureScene.mainCamera = captureSceneCamera;
captureSceneCamera.mainCamera = true;

const orbitCameraController = new OrbitCameraController(captureSceneCamera);

captureSceneCamera.onStart = ({ actor }) => {
    (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
};
captureSceneCamera.onFixedUpdate = () => {
    // 1: fixed position
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);

    // 2: orbit controls
    if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
        orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
    }
    orbitCameraController.fixedUpdate();
};

const directionalLight = new DirectionalLight({
    intensity: 1.2,
    // color: Color.fromRGB(255, 210, 200),
    color: Color.white,
});
// shadows
// TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
if (directionalLight.shadowCamera) {
    directionalLight.shadowCamera.visibleFrustum = true;
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 30;
    (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -10, 10, -10, 10);
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -5, 5, -5, 5);
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -7, 7, -7, 7);
    directionalLight.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
    });
}

directionalLight.onStart = ({ actor }) => {
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
};
captureScene.add(directionalLight);

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

const fxaaPass = new FXAAPass({ gpu });
cameraPostProcess.addPass(fxaaPass);

const bufferVisualizerPass = new BufferVisualizerPass({ gpu });
bufferVisualizerPass.enabled = false;
cameraPostProcess.addPass(bufferVisualizerPass);
bufferVisualizerPass.beforeRender = () => {
    bufferVisualizerPass.material.updateUniform(
        'uDirectionalLightShadowMap',
        directionalLight.shadowMap!.read.depthTexture
    );
    bufferVisualizerPass.material.updateUniform(
        'uAmbientOcclusionTexture',
        renderer.ambientOcclusionPass.renderTarget.read.texture
    );
    bufferVisualizerPass.material.updateUniform(
        'uDeferredShadingTexture',
        renderer.deferredShadingPass.renderTarget.read.texture
    );
    bufferVisualizerPass.material.updateUniform(
        'uLightShaftTexture',
        renderer.lightShaftPass.renderTarget.read.texture
    );
    bufferVisualizerPass.material.updateUniform('uFogTexture', renderer.fogPass.renderTarget.read.texture);
};

cameraPostProcess.enabled = true;
// TODO: set post process いらないかも
captureSceneCamera.setPostProcess(cameraPostProcess);

/**
 *
 */
const createTransformFeedbackDrivenMesh = () => {
    const transformFeedbackBuffer = new TransformFeedbackBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aPosition',
                data: new Float32Array([1, 2, 3, 4, 5, 6]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aVelocity',
                data: new Float32Array([7, 8, 9, 10, 11, 12]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
        ],
        varyings: [
            {
                name: 'vPosition',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
            {
                name: 'vVelocity',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aVelocity;

        out vec3 vPosition;
        out vec3 vVelocity;

        void main() {
            vPosition = aPosition * 2.;
            vVelocity = aVelocity * 3.;
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

    const transformFeedbackDoubleBuffer = new TransformFeedbackDoubleBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aPosition',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aVelocity',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
        ],
        varyings: [
            {
                name: 'vPosition',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
            {
                name: 'vVelocity',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aVelocity;

        out vec3 vPosition;
        out vec3 vVelocity;

        void main() {
            vPosition = aPosition * 2.;
            vVelocity = aVelocity * 3.;
        }
        `,
        fragmentShader: `#version 300 es

        precision highp float;

        void main() {
        }
        `,
        drawCount: 2,
    });
    console.log('===============================');
    const logBuffer = (buffer: WebGLBuffer, len: number) => {
        const results = new Float32Array(len);
        gpu.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
        gpu.gl.bindBuffer(gl.ARRAY_BUFFER, null);
        console.log(results);
    };
    logBuffer(transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition'), 6);
    logBuffer(transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity'), 6);

    gpu.updateTransformFeedback({
        shader: transformFeedbackDoubleBuffer.shader,
        vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
        transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
        drawCount: transformFeedbackDoubleBuffer.drawCount,
    });
    transformFeedbackDoubleBuffer.swap();

    logBuffer(transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition'), 6);
    logBuffer(transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity'), 6);

    gpu.updateTransformFeedback({
        shader: transformFeedbackDoubleBuffer.shader,
        vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
        transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
        drawCount: transformFeedbackDoubleBuffer.drawCount,
    });
    transformFeedbackDoubleBuffer.swap();

    logBuffer(transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition'), 6);
    logBuffer(transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity'), 6);

    const planeGeometryData = createPlaneGeometryData();
    const geometry = new Geometry({
        gpu,
        attributes: [
            ...planeGeometryData.attributes,
            new Attribute({
                name: 'aVelocity',
                data: new Float32Array(
                    new Array(4).fill(0).map(() => {
                        return 0;
                    })
                ),
                size: 3,
            }),
        ],
        indices: planeGeometryData.indices,
        drawCount: planeGeometryData.drawCount,
    });
    // const material = new Material({
    //     vertexShader: `#version 300 es`
    // });
    const material = new GBufferMaterial({
        vertexShaderModifier: {
            // [VertexShaderModifierPragmas.APPEND_ATTRIBUTES]: 'layout(location = 3) in vec3 aVelocity;',
            [VertexShaderModifierPragmas.APPEND_UNIFORMS]: `uniform float uTest;`,
        },
    });
    const mesh = new Mesh({
        geometry,
        material,
    });
    console.log(geometry)
    mesh.transform.setScaling(new Vector3(3, 3, 3));
    mesh.onUpdate = () => {
        // mesh.geometry.vertexArrayObject.upda
    };
    // mesh.transform.setTranslation(new Vector3(0, 2, 0));
    return mesh;
};

/**
 *
 */
const createGLTFSphereMesh = async () => {
    const gltfActor = await loadGLTF({ gpu, path: gltfLSphereModelUrl });
    const mesh: Mesh = gltfActor.transform.children[0] as Mesh;
    mesh.castShadow = true;
    mesh.material = new GBufferMaterial({
        // gpu,
        // diffuseMap: floorDiffuseMap,
        // normalMap: floorNormalMap,
        // envMap: cubeMap,
        // diffuseColor: new Color(0.5, 0.05, 0.05, 1),
        diffuseColor: new Color(1, 0.76, 0.336, 1),
        // diffuseColor: new Color(0, 0, 0, 1),
        // diffuseColor: new Color(1, 1, 1, 1),
        receiveShadow: true,
        metallic: 1,
        roughness: 0,
        // specularAmount: 0.4,
        // ambientAmount: 0.2,
    });
    return mesh;
};

/**
 *
 */
const createGLTFSkinnedMesh = async () => {
    const gltfActor = await loadGLTF({ gpu, path: gltfLGlassModelUrl });

    // skinned mesh おｎはずなので cast
    const skinningMesh: SkinnedMesh = gltfActor.transform.children[0].transform.children[0] as SkinnedMesh;
    // console.log(gltfActor, skinningMesh);

    // ルートにanimatorをattachしてるので一旦ここでassign
    skinningMesh.setAnimationClips(gltfActor.animator.animationClips);

    const instanceInfo: {
        position: number[][];
        scale: number[][];
        color: number[][];
    } = {
        position: [],
        scale: [],
        color: [],
    };
    // new Array(instanceNum).fill(0).forEach((_, i) => {
    new Array(instanceNum).fill(0).forEach(() => {
        const posRangeX = 7.4;
        const posRangeZ = 7.4;
        const px = (Math.random() * 2 - 1) * posRangeX;
        const pz = (Math.random() * 2 - 1) * posRangeZ;
        const p = [px, 0, pz];
        instanceInfo.position.push(p);

        const baseScale = 0.04;
        const randomScaleRange = 0.08;
        const s = Math.random() * randomScaleRange + baseScale;
        instanceInfo.scale.push([s, s * 2, s]);

        const c = Color.fromRGB(
            Math.floor(Math.random() * 240 + 15),
            Math.floor(Math.random() * 10 + 245),
            Math.floor(Math.random() * 245 + 10)
        );
        instanceInfo.color.push([...c.elements]);
    });
    const animationOffsetInfo = instanceInfo.position.map(([x, , z]) => {
        const animationOffsetAdjust = Math.random() * 0.6 - 0.3 + 2;
        return (-x + z) * animationOffsetAdjust;
    });

    skinningMesh.castShadow = true;
    skinningMesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
        })
    );
    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
        })
    );
    // aInstanceAnimationOffsetは予約語
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(animationOffsetInfo),
            size: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
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
        roughness: 0.6,
        receiveShadow: true,
        isSkinning: true,
        gpuSkinning: true,
        isInstancing: true,
        useVertexColor: true,
    });

    return skinningMesh;
};

const main = async () => {
    const particleImg = await loadImg(smokeImgUrl);
    const particleMap = new Texture({
        gpu,
        img: particleImg,
    });

    const floorDiffuseImg = await loadImg(leaveDiffuseImgUrl);
    floorDiffuseMap = new Texture({
        gpu,
        img: floorDiffuseImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const floorNormalImg = await loadImg(leaveNormalImgUrl);
    floorNormalMap = new Texture({
        gpu,
        img: floorNormalImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const images = {
        [CubeMapAxis.PositiveX]: CubeMapPositiveXImgUrl,
        [CubeMapAxis.NegativeX]: CubeMapNegativeXImgUrl,
        [CubeMapAxis.PositiveY]: CubeMapPositiveYImgUrl,
        [CubeMapAxis.NegativeY]: CubeMapNegativeYImgUrl,
        [CubeMapAxis.PositiveZ]: CubeMapPositiveZImgUrl,
        [CubeMapAxis.NegativeZ]: CubeMapNegativeZImgUrl,
    };

    cubeMap = await loadCubeMap({ gpu, images });

    const skyboxMesh = new Skybox({
        gpu,
        cubeMap,
        diffuseIntensity: 0.2,
        specularIntensity: 0.2,
        // rotationOffset: 0.8,
    });

    captureScene.add(createTransformFeedbackDrivenMesh());

    sphereMesh = await createGLTFSphereMesh();
    sphereMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(3));
        actor.transform.setTranslation(new Vector3(0, 3, 0));
    };
    // TODO: デバッグで非表示にしてる
    sphereMesh.enabled = false;

    skinnedMesh = await createGLTFSkinnedMesh();

    const floorGeometry = new PlaneGeometry({
        gpu,
        calculateTangent: true,
        calculateBinormal: true,
    });
    floorPlaneMesh = new Mesh({
        geometry: floorGeometry,
        // material: new PhongMaterial({
        //     // gpu,
        //     // diffuseMap: floorDiffuseMap,
        //     // normalMap: floorNormalMap,
        //     envMap: cubeMap,
        //     diffuseColor: new Color(0, 0, 0, 1),
        //     receiveShadow: true,
        //     specularAmount: 0.4,
        //     ambientAmount: 0.2,
        // }),
        material: new GBufferMaterial({
            // gpu,
            diffuseMap: floorDiffuseMap,
            normalMap: floorNormalMap,
            // envMap: cubeMap,
            // diffuseColor: new Color(0.05, 0.05, 0.05, 1),
            // diffuseColor: new Color(0, 0, 0, 1),
            diffuseColor: new Color(1, 1, 1, 1),
            receiveShadow: true,
            // specularAmount: 0.4,
            metallic: 0,
            roughness: 0.5,
            // ambientAmount: 0.2,
        }),
        castShadow: false,
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        const meshActor = actor as Mesh;
        actor.transform.setScaling(Vector3.fill(10));
        actor.transform.setRotationX(-90);
        // actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        // actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
        meshActor.material.updateUniform('uDiffuseMapUvScale', new Vector2(3, 3));
        meshActor.material.updateUniform('uNormalMapUvScale', new Vector2(3, 3));
    };

    const particleNum = 50;
    const particleGeometry = new Geometry({
        gpu,
        attributes: [
            new Attribute({
                name: AttributeNames.Position.toString(),
                // dummy data
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const x = Math.random() * 18 - 10;
                            const y = Math.random() * 0.5;
                            // const y = 3.;
                            const z = Math.random() * 18 - 8;
                            return [x, y, z, x, y, z, x, y, z, x, y, z];
                        })
                        .flat()
                ),
                size: 3,
            }),
            new Attribute({
                name: AttributeNames.Uv.toString(),
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
                        .flat()
                ),
                size: 2,
            }),
            new Attribute({
                name: AttributeNames.Color.toString(),
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const c = Color.fromRGB(
                                Math.random() * 50 + 200,
                                Math.random() * 50 + 190,
                                Math.random() * 50 + 180,
                                Math.random() * 150 + 50
                            );
                            return [...c.elements, ...c.elements, ...c.elements, ...c.elements];
                        })
                        .flat()
                ),
                size: 4,
            }),
            new Attribute({
                name: 'aBillboardSize',
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const s = Math.random() * 3.5 + 0.5;
                            return [s, s, s, s];
                        })
                        .flat()
                ),
                size: 1,
            }),
            new Attribute({
                name: 'aBillboardRateOffset',
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const r = Math.random();
                            return [r, r, r, r];
                        })
                        .flat()
                ),
                size: 1,
            }),
        ],
        indices: new Array(particleNum)
            .fill(0)
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

#pragma TRANSFORM_VERTEX_UNIFORMS
#pragma ENGINE_UNIFORMS

uniform vec2[4] uBillboardPositionConverters;

void main() {
    int particleId = int(mod(float(gl_VertexID), 4.));
    float t = 3.;
    float r = mod((uTime / t) + aBillboardRateOffset, 1.);

    vec4 localPosition = vec4(aPosition, 1.);

    localPosition.x += mix(0., 4., r) * mix(.4, .8, aBillboardRateOffset);
    localPosition.z += mix(0., 4., r) * mix(-.4, -.8, aBillboardRateOffset);

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

#pragma DEPTH_FUNCTIONS

void main() {
    // int particleId = int(mod(float(gl_VertexID), 4.));

    vec4 texColor = texture(uParticleMap, vUv);
    vec3 baseColor = vVertexColor.xyz;
    float alpha = texColor.x * vVertexColor.a;
    
    // calc soft fade
    
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(sceneDepth), 1.);

    float currentDepth = viewZToLinearDepth(vViewPosition.z, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(currentDepth), 1.);
    
    float diffDepth = abs(sceneDepth) - abs(currentDepth);
    float softFade = smoothstep(0., .01, diffDepth);
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
        uniforms: {
            uParticleMap: {
                type: UniformTypes.Texture,
                value: particleMap,
            },
            uBillboardPositionConverters: {
                type: UniformTypes.Vector2Array,
                value: [new Vector2(-1, 1), new Vector2(-1, -1), new Vector2(1, 1), new Vector2(1, -1)],
            },
            uTime: {
                type: UniformTypes.Float,
                value: 0,
            },
            uDepthTexture: {
                type: UniformTypes.Texture,
                value: null,
            },
            uNearClip: {
                type: UniformTypes.Float,
                value: captureSceneCamera.near,
            },
            uFarClip: {
                type: UniformTypes.Float,
                value: captureSceneCamera.far,
            },
        },
        // blendType: BlendTypes.Additive
        blendType: BlendTypes.Transparent,
        depthWrite: false,
    });
    const particleMesh = new Mesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });
    particleMesh.onFixedUpdate = ({ fixedTime }) => {
        particleMaterial.updateUniform('uTime', fixedTime);
    };

    captureScene.add(sphereMesh);
    captureScene.add(skinnedMesh);
    captureScene.add(floorPlaneMesh);
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

        orbitCameraController.distance = isSP ? 20 : 15;
        orbitCameraController.attenuation = 0.01;
        orbitCameraController.dampingFactor = 0.2;
        orbitCameraController.azimuthSpeed = 100;
        orbitCameraController.altitudeSpeed = 100;
        orbitCameraController.deltaAzimuthPower = 2;
        orbitCameraController.deltaAltitudePower = 2;
        orbitCameraController.lookAtTarget = new Vector3(0, -1, 0);
        orbitCameraController.start(20, -30);
    };

    // engine.onAfterStart = () => {
    //     window.setTimeout(() => {
    //         onWindowResize()
    //     },1000)
    // }

    engine.onBeforeUpdate = () => {
        if (!debuggerGUI) initDebugger();
    };

    engine.onBeforeFixedUpdate = () => {
        inputController.fixedUpdate();
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
        maxValue: 40000,
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

    //
    // orbit controls
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'orbit controls enabled',
        initialValue: debuggerStates.orbitControlsEnabled,
        onChange: (value) => (debuggerStates.orbitControlsEnabled = value),
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

    const lightShaftDebuggerGroup = debuggerGUI.addGroup('light shaft');

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
    // light shaft
    //

    debuggerGUI.addBorderSpacer();

    const fogDebuggerGroup = debuggerGUI.addGroup('fog');

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
        maxValue: 20,
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
        maxValue: 1,
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
