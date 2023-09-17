﻿import { Mesh, MeshArgs } from '@/PaleGL/actors/Mesh';
import {
    ActorTypes,
    AttributeNames,
    AttributeUsageType,
    BlendTypes,
    PrimitiveTypes,
    TextureTypes,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { Material } from '@/PaleGL/materials/Material';
import { Texture } from '@/PaleGL/core/Texture';
import { Rotator } from '@/PaleGL/math/Rotator';
import { Bone } from '@/PaleGL/core/Bone';
import { Attribute } from '@/PaleGL/core/Attribute';
import { AnimationClip } from '@/PaleGL/core/AnimationClip';
import { ActorUpdateArgs } from './Actor';
import { GPU } from '@/PaleGL/core/GPU';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Quaternion } from '@/PaleGL/math/Quaternion';
import { GLTFAnimationChannelTargetPath } from '@/PaleGL/loaders/loadGLTF';
// import {AnimationKeyframeValue} from "@/PaleGL/core/AnimationKeyframes";

export type SkinnedMeshArgs = { bones: Bone; debugBoneView?: boolean } & MeshArgs;

// type FrameValue = {
//     [key in GLTFAnimationChannelTargetPath]?: AnimationKeyframeValue
// }

type FrameData = {
    // translation?: Vector3,
    // rotation?: Quaternion,
    // scale?: Vector3,
    bone: Bone;
    [GLTFAnimationChannelTargetPath.translation]?: Vector3;
    [GLTFAnimationChannelTargetPath.rotation]?: Quaternion;
    [GLTFAnimationChannelTargetPath.scale]?: Vector3;
    // [key in GLTFAnimationChannelTargetPath]?: AnimationKeyframeValue
};
// } & FrameValue

// type AnimationData =number[][]{ [key: string]: FrameValue};

export class SkinnedMesh extends Mesh {
    bones: Bone;
    boneCount: number = 0;

    // positions = [];
    // boneIndices = [];
    // boneWeights = [];

    boneOffsetMatrices: Matrix4[] = [];

    #boneIndicesForLines: number[] = [];
    #boneOrderedIndex: Bone[] = [];

    #jointTexture: Texture | null = null;

    // #gpuSkinning: boolean = false;
    #gpuSkinning: boolean | null = null;

    #animationClips: AnimationClip[] = [];

    // TODO: editable
    #jointTextureColNum: number = 1;

    debugBoneView: boolean;

    boneLines: Mesh | null = null;
    bonePoints: Mesh | null = null;

    // TODO: generate vertex shader in constructor
    constructor({ bones, debugBoneView, ...options }: SkinnedMeshArgs) {
        super({
            ...options,
            actorType: ActorTypes.SkinnedMesh,
            autoGenerateDepthMaterial: true,
        });

        this.bones = bones;
        this.debugBoneView = !!debugBoneView;

        // bone index order な配列を作っておく
        this.bones.traverse((bone) => {
            this.boneCount++;
            this.#boneOrderedIndex[bone.index] = bone;
        });

        // for debug
        // console.log(this.positions, this.boneIndices, this.boneWeights)
    }

    start({ gpu }: { gpu: GPU }) {
        this.bones.calcBoneOffsetMatrix();

        // ボーンオフセット行列を計算
        this.boneOffsetMatrices = this.getBoneOffsetMatrices();

        this.#gpuSkinning = !!this.mainMaterial.gpuSkinning;

        // ボーンごとの joint matrix をテクスチャに詰める
        // 1ボーンあたり4pixel（4 channel x 4 pixel = 16） 必要
        // 精度は16bitで十分だが jsのtypedarrayには16bitがないので32bitを使う
        // bit容量は下記
        // 32bit (bit per channel) * 16 (4 channel * 4 pixel) * N bones
        this.#jointTexture = new Texture({
            gpu,
            width: 1,
            height: 1,
            type: TextureTypes.RGBA32F,
        });

        this.materials.forEach((material) => {
            material.uniforms = {
                ...material.uniforms,
                ...this.generateSkinningUniforms(),
            };
            material.isSkinning = true;
            material.gpuSkinning = this.#gpuSkinning;
            material.jointNum = this.boneCount;
        });

        this.mainMaterial.depthUniforms = {
            ...this.mainMaterial.depthUniforms,
            ...this.generateSkinningUniforms(),
        };

        super.start({ gpu });

        if (this.debugBoneView) {
            this.#createSkinDebugger({ gpu });
        }

        // アニメーションもテクスチャに焼きたいのでanimationClipsが必要
        if (this.#animationClips && this.#gpuSkinning) {
            const animationData: FrameData[][][] = [];

            // TODO: refactor
            this.#animationClips.forEach((animationClip, i) => {
                const dataEachKeyframes = animationClip.getAllKeyframesValue();
                animationData[i] = [];
                dataEachKeyframes.forEach((dataKeyframes, frameIndex) => {
                    animationData[i][frameIndex] = [];
                    dataKeyframes.forEach((elem) => {
                        // TODO: bone animation じゃない場合の対応
                        const boneIndex = (elem.target as Bone).index;
                        if (!animationData[i][frameIndex][boneIndex]) {
                            animationData[i][frameIndex][boneIndex] = {
                                bone: elem.target as Bone,
                                // [elem.key]: elem.frameValue
                            };
                        }
                        // animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue;
                        // TODO: 上手くまとめる方法ない？
                        switch (elem.key) {
                            case GLTFAnimationChannelTargetPath.translation:
                                animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue as Vector3;
                                break;
                            case GLTFAnimationChannelTargetPath.rotation:
                                animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue as Quaternion;
                                break;
                            case GLTFAnimationChannelTargetPath.scale:
                                animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue as Vector3;
                                break;
                            default:
                                throw 'invalid target path';
                        }
                    });
                });
            });

            const jointMatricesAllFrames: Matrix4[][] = [];

            // TODO: refactor
            animationData.forEach((clips, clipIndex) => {
                jointMatricesAllFrames[clipIndex] = [];
                // clips.forEach((keyframeData, frameIndex) => {
                clips.forEach((keyframeData) => {
                    // boneにkeyframeごとの計算を割り当て
                    keyframeData.forEach((data) => {
                        const { translation, rotation, scale, bone } = data;
                        const targetBone = this.#boneOrderedIndex[bone.index];
                        if (translation) {
                            targetBone.position = translation;
                        }
                        if (rotation) {
                            targetBone.rotation = Rotator.fromQuaternion(rotation);
                        }
                        if (scale) {
                            targetBone.scale = scale;
                        }
                    });
                    // boneごとのjointMatrixを再計算
                    this.bones.calcJointMatrix();

                    // どちらも bone index order ではない
                    const boneOffsetMatrices = this.boneOffsetMatrices;
                    const boneJointMatrices = this.getBoneJointMatricesWithBone();

                    // offset行列を踏まえたjoint行列を計算
                    const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) =>
                        Matrix4.multiplyMatrices(boneJointMatrices[i].matrix, boneOffsetMatrix)
                    );

                    // jointMatricesAllFrames[clipIndex].push(jointMatrices);
                    jointMatricesAllFrames[clipIndex].push(...jointMatrices);
                });
            });

            // data[clip_index][frame_index] = mat[bone_count]

            // jointMatricesAllFrames = [...jointMatricesAllFrames].flat(2);
            const jointMatricesAllFramesFlatten: Matrix4[] = [...jointMatricesAllFrames].flat(2);

            const framesDuration = this.#animationClips.reduce((acc, cur) => acc + cur.frameCount, 0);

            const colNum = this.#jointTextureColNum;
            const boneCount = this.boneCount * framesDuration;
            const rowNum = Math.ceil(boneCount / colNum);
            const fillNum = colNum * rowNum - boneCount;
            const jointData = new Float32Array(
                [
                    // ...jointMatricesAllFrames,
                    ...jointMatricesAllFramesFlatten,
                    ...new Array(fillNum).fill(0).map(() => Matrix4.identity),
                ]
                    .map((m) => [...m.elements])
                    .flat()
            );

            const matrixColNum = 4;
            // const dataPerPixel = 4;
            this.#jointTexture.update({
                width: colNum * matrixColNum,
                height: rowNum,
                data: jointData,
            });

            this.materials.forEach((material) => (material.uniforms.uTotalFrameCount.value = framesDuration));
            if (this.depthMaterial) {
                this.depthMaterial.uniforms.uTotalFrameCount.value = framesDuration;
            }

            // for debug
            console.log(`# bake skin animation to texture
frames duration: ${framesDuration}
col num: ${colNum},
row num: ${rowNum},
col pixels: ${colNum * matrixColNum},
row pixels: ${rowNum},
total pixels: ${colNum * matrixColNum * rowNum},
all elements: ${colNum * matrixColNum * rowNum * 4},
matrix elements: ${jointData.length}`);
        }
    }

    update(options: ActorUpdateArgs) {
        super.update(options);

        const { time } = options;

        this.bones.calcJointMatrix();

        // if (this.debugBoneView) {
        if (this.boneLines && this.bonePoints) {
            const boneLinePositions: number[][] = this.#boneOrderedIndex.map((bone) => [
                ...bone.jointMatrix.position.elements,
            ]);
            // this.boneLines.geometry.updateAttribute(AttributeNames.Position, boneLinePositions.flat())
            // this.bonePoints.geometry.updateAttribute(AttributeNames.Position, boneLinePositions.flat())
            this.boneLines.geometry.updateAttribute(
                AttributeNames.Position,
                new Float32Array(boneLinePositions.flat())
            );
            this.bonePoints.geometry.updateAttribute(
                AttributeNames.Position,
                new Float32Array(boneLinePositions.flat())
            );
        }

        if (this.#gpuSkinning) {
            this.materials.forEach((mat) => (mat.uniforms.uTime.value = time));
            if (this.depthMaterial) {
                this.depthMaterial.uniforms.uTime.value = time;
            }

            this.materials.forEach((mat) => (mat.uniforms.uJointTexture.value = this.#jointTexture));
            if (this.depthMaterial) {
                this.depthMaterial.uniforms.uJointTexture.value = this.#jointTexture;
            }
        } else {
            // NOTE: test update skinning by cpu
            // needs
            const boneOffsetMatrices = this.boneOffsetMatrices;
            const boneJointMatrices = this.getBoneJointMatricesWithBone();

            const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) =>
                Matrix4.multiplyMatrices(boneJointMatrices[i].matrix, boneOffsetMatrix)
            );

            const colNum = this.#jointTextureColNum;
            const rowNum = Math.ceil(this.boneCount / colNum);
            const fillNum = colNum * rowNum - this.boneCount;
            const jointData = new Float32Array(
                [...jointMatrices, ...new Array(fillNum).fill(0).map(() => Matrix4.identity)]
                    .map((m) => [...m.elements])
                    .flat()
            );

            const matrixColNum = 4;
            if (this.#jointTexture) {
                this.#jointTexture.update({
                    width: colNum * matrixColNum,
                    height: rowNum,
                    data: jointData,
                });
            }

            this.materials.forEach((mat) => (mat.uniforms.uJointTexture.value = this.#jointTexture));
            if (this.depthMaterial) {
                this.depthMaterial.uniforms.uJointTexture.value = this.#jointTexture;
            }
        }
    }

    generateSkinningUniforms() {
        return {
            // TODO: for cpu
            // material.uniforms.uJointMatrices = {
            //     type: UniformTypes.Matrix4Array,
            //     value: new Array(this.boneCount).fill(0).map(i => Matrix4.identity),
            // };
            uJointTexture: {
                type: UniformTypes.Texture,
                value: null,
            },
            uJointTextureColNum: {
                type: UniformTypes.Int,
                value: this.#jointTextureColNum,
            },
            ...(this.#gpuSkinning
                ? {
                      uBoneCount: {
                          type: UniformTypes.Int,
                          value: this.boneCount,
                      },
                      uTotalFrameCount: {
                          type: UniformTypes.Int,
                          value: 0,
                      },
                  }
                : {}),
        };
    }

    getBoneOffsetMatrices(): Matrix4[] {
        const matrices: Matrix4[] = [];
        this.bones.traverse((bone) => {
            const m = bone.boneOffsetMatrix.clone();
            matrices.push(m);
        });
        return matrices;
    }

    getBoneJointMatrices(): Matrix4[] {
        const matrices: Matrix4[] = [];
        this.bones.traverse((bone) => {
            const m = bone.jointMatrix.clone();
            matrices.push(m);
        });
        return matrices;
    }

    getBoneJointMatricesWithBone(): { bone: Bone; matrix: Matrix4 }[] {
        const data: { bone: Bone; matrix: Matrix4 }[] = [];
        this.bones.traverse((bone) => {
            const matrix = bone.jointMatrix.clone();
            data.push({ bone, matrix });
        });
        return data;
    }

    #createSkinDebugger({ gpu }: { gpu: GPU }) {
        const checkChildNum = (bone: Bone) => {
            if (bone.hasChild) {
                bone.children.forEach((elem) => {
                    const childBone = elem as Bone;
                    this.#boneIndicesForLines.push(bone.index, childBone.index);
                    checkChildNum(childBone);
                });
            }
        };
        checkChildNum(this.bones);

        this.boneLines = new Mesh({
            // gpu,
            geometry: new Geometry({
                gpu,
                attributes: [
                    new Attribute({
                        name: AttributeNames.Position,
                        data: new Float32Array(new Array(this.#boneOrderedIndex.length * 3).fill(0)),
                        size: 3,
                        usageType: AttributeUsageType.DynamicDraw,
                    }),
                ],
                indices: this.#boneIndicesForLines,
                drawCount: this.#boneIndicesForLines.length,
            }),
            material: new Material({
                // gpu,
                vertexShader: `#version 300 es
                
                layout (location = 0) in vec3 ${AttributeNames.Position};
                
                uniform mat4 ${UniformNames.WorldMatrix};
                uniform mat4 ${UniformNames.ViewMatrix};
                uniform mat4 ${UniformNames.ProjectionMatrix};
                
                void main() {
                    gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
                }
                `,
                fragmentShader: `#version 300 es
                
                precision mediump float;
                
                out vec4 outColor;
                
                void main() {
                    outColor = vec4(0, 1., 0, 1.);
                }
                `,
                primitiveType: PrimitiveTypes.Lines,
                blendType: BlendTypes.Transparent,
                depthWrite: false,
                depthTest: false,
            }),
        });

        this.bonePoints = new Mesh({
            // gpu,
            geometry: new Geometry({
                gpu,
                attributes: [
                    new Attribute({
                        name: AttributeNames.Position.toString(),
                        data: new Float32Array(new Array(this.#boneOrderedIndex.length * 3).fill(0)),
                        size: 3,
                        usageType: AttributeUsageType.DynamicDraw,
                    }),
                ],
                drawCount: this.#boneOrderedIndex.length,
            }),
            material: new Material({
                // gpu,
                vertexShader: `#version 300 es
               
                layout (location = 0) in vec3 ${AttributeNames.Position};
                
                uniform mat4 ${UniformNames.WorldMatrix};
                uniform mat4 ${UniformNames.ViewMatrix};
                uniform mat4 ${UniformNames.ProjectionMatrix};
                
                void main() {
                    gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
                    gl_PointSize = 6.;
                }
                `,
                fragmentShader: `#version 300 es
                
                precision mediump float;
                
                out vec4 outColor;
                
                void main() {
                    outColor = vec4(1, 0., 0, 1.);
                }
                `,
                primitiveType: PrimitiveTypes.Points,
                blendType: BlendTypes.Transparent,
                depthWrite: false,
                depthTest: false,
            }),
        });

        this.addChild(this.boneLines);
        this.addChild(this.bonePoints);
    }

    setAnimationClips(animationClips: AnimationClip[]) {
        this.#animationClips = animationClips;
    }
}
