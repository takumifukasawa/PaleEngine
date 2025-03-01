﻿import { createMesh, Mesh, MeshArgs } from '@/PaleGL/actors/meshes/mesh.ts';
import { getMeshMainMaterial, startMeshBehaviourBase } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    AttributeNames,
    AttributeUsageType,
    BlendTypes,
    MeshTypes,
    PrimitiveTypes,
    TextureTypes,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createMaterial, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Rotator } from '@/PaleGL/math/Rotator.ts';
import { Bone, calcBoneOffsetMatrix, calcJointMatrix, traverseBone } from '@/PaleGL/core/bone.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { AnimationClip } from '@/PaleGL/core/animationClip.ts';
import { Actor, ActorUpdateArgs, addChildActor } from 'src/PaleGL/actors/actor.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Quaternion } from '@/PaleGL/math/Quaternion.ts';
import { GLTFAnimationChannelTargetPath } from '@/PaleGL/loaders/loadGLTF.ts';
import { createUniforms } from '@/PaleGL/core/uniforms.ts';
import { StartActorFunc, UpdateActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { updateGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
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

// export class SkinnedMesh extends Mesh {
//     bones: Bone;
//     boneCount: number = 0;
//
//     // positions = [];
//     // boneIndices = [];
//     // boneWeights = [];
//
//     boneOffsetMatrices: Matrix4[] = [];
//
//     boneIndicesForLines: number[] = [];
//     boneOrderedIndex: Bone[] = [];
//
//     jointTexture: Texture | null = null;
//
//     // gpuSkinning: boolean = false;
//     gpuSkinning: boolean | null = null;
//
//     animationClips: AnimationClip[] = [];
//
//     // TODO: editable
//     jointTextureColNum: number = 1;
//
//     debugBoneView: boolean;
//
//     boneLines: Mesh | null = null;
//     bonePoints: Mesh | null = null;
//
//     // TODO: generate vertex shader in constructor
//     constructor({ bones, debugBoneView, ...options }: SkinnedMeshArgs) {
//         super({
//             ...options,
//             actorType: ActorTypes.SkinnedMesh,
//             autoGenerateDepthMaterial: true,
//         });
//
//         this.bones = bones;
//         this.debugBoneView = !!debugBoneView;
//
//         // bone index order な配列を作っておく
//         traverseBone(this.bones, (bone) => {
//             this.boneCount++;
//             this.boneOrderedIndex[bone.getIndex()] = bone;
//         });
//
//         // for debug
//         // console.log(this.positions, this.boneIndices, this.boneWeights)
//     }
//
//     start(args: ActorStartArgs) {
//         const { gpu } = args;
//
//         calcBoneOffsetMatrix(this.bones);
//
//         // ボーンオフセット行列を計算
//         this.boneOffsetMatrices = this.getBoneOffsetMatrices();
//
//         this.gpuSkinning = !!this.mainMaterial.getGpuSkinning();
//
//         // ボーンごとの joint matrix をテクスチャに詰める
//         // 1ボーンあたり4pixel（4 channel x 4 pixel = 16） 必要
//         // 精度は16bitで十分だが jsのtypedarrayには16bitがないので32bitを使う
//         // bit容量は下記
//         // 32bit (bit per channel) * 16 (4 channel * 4 pixel) * N bones
//         this.jointTexture = new Texture({
//             gpu,
//             width: 1,
//             height: 1,
//             type: TextureTypes.RGBA32F,
//         });
//
//         this.materials.forEach((material) => {
//             material.setUniforms(createUniforms(material.getUniforms().data, this.generateSkinningUniforms()));
//             material.setIsSkinning(true);
//             material.setGpuSkinning(this.gpuSkinning);
//             material.setJointNum(this.boneCount);
//         });
//
//         this.mainMaterial.setDepthUniforms(
//             createUniforms(this.mainMaterial.getDepthUniforms().data, this.generateSkinningUniforms())
//         );
//
//         super.start(args);
//
//         if (this.debugBoneView) {
//             this.#createSkinDebugger({ gpu });
//         }
//
//         // アニメーションもテクスチャに焼きたいのでanimationClipsが必要
//         if (this.animationClips && this.gpuSkinning) {
//             const animationData: FrameData[][][] = [];
//
//             // TODO: refactor
//             this.animationClips.forEach((animationClip, i) => {
//                 const dataEachKeyframes = animationClip.getAllKeyframesValue();
//                 animationData[i] = [];
//                 dataEachKeyframes.forEach((dataKeyframes, frameIndex) => {
//                     animationData[i][frameIndex] = [];
//                     dataKeyframes.forEach((elem) => {
//                         // TODO: bone animation じゃない場合の対応
//                         const boneIndex = (elem.target as Bone).getIndex();
//                         if (!animationData[i][frameIndex][boneIndex]) {
//                             animationData[i][frameIndex][boneIndex] = {
//                                 // NOTE: { [elem.key]: elem.frameValue }
//                                 bone: elem.target as Bone,
//                             };
//                         }
//                         // NOTE: animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue;
//                         // TODO: 上手くまとめる方法ない？
//                         switch (elem.key) {
//                             case GLTFAnimationChannelTargetPath.translation:
//                                 animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue as Vector3;
//                                 break;
//                             case GLTFAnimationChannelTargetPath.rotation:
//                                 animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue as Quaternion;
//                                 break;
//                             case GLTFAnimationChannelTargetPath.scale:
//                                 animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue as Vector3;
//                                 break;
//                             default:
//                                 console.error('invalid target path');
//                         }
//                     });
//                 });
//             });
//
//             const jointMatricesAllFrames: Matrix4[][] = [];
//
//             // TODO: refactor
//             animationData.forEach((clips, clipIndex) => {
//                 jointMatricesAllFrames[clipIndex] = [];
//                 // clips.forEach((keyframeData, frameIndex) => {
//                 clips.forEach((keyframeData) => {
//                     // boneにkeyframeごとの計算を割り当て
//                     keyframeData.forEach((data) => {
//                         const { translation, rotation, scale, bone } = data;
//                         const targetBone = this.boneOrderedIndex[bone.getIndex()];
//                         if (translation) {
//                             targetBone.setPosition(translation);
//                         }
//                         if (rotation) {
//                             // TODO: quaternion-bug: 本当はこっちを使いたい
//                             // targetBone.rotation = Rotator.fromQuaternion(rotation);
//                             targetBone.setRotation(Rotator.fromMatrix4(rotation.toMatrix4()));
//                         }
//                         if (scale) {
//                             targetBone.setScale(scale);
//                         }
//                     });
//                     // boneごとのjointMatrixを再計算
//                     calcJointMatrix(this.bones);
//
//                     // どちらも bone index order ではない
//                     const boneOffsetMatrices = this.boneOffsetMatrices;
//                     const boneJointMatrices = this.getBoneJointMatricesWithBone();
//
//                     // offset行列を踏まえたjoint行列を計算
//                     const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) =>
//                         Matrix4.multiplyMatrices(boneJointMatrices[i].matrix, boneOffsetMatrix)
//                     );
//
//                     // jointMatricesAllFrames[clipIndex].push(jointMatrices);
//                     jointMatricesAllFrames[clipIndex].push(...jointMatrices);
//                 });
//             });
//
//             // data[clip_index][frame_index] = mat[bone_count]
//
//             // jointMatricesAllFrames = [...jointMatricesAllFrames].flat(2);
//             const jointMatricesAllFramesFlatten: Matrix4[] = [...jointMatricesAllFrames].flat(2);
//
//             const framesDuration = this.animationClips.reduce((acc, cur) => acc + cur.getFrameCount(), 0);
//
//             const colNum = this.jointTextureColNum;
//             const boneCount = this.boneCount * framesDuration;
//             const rowNum = Math.ceil(boneCount / colNum);
//             const fillNum = colNum * rowNum - boneCount;
//             const jointData = new Float32Array(
//                 [
//                     // ...jointMatricesAllFrames,
//                     ...jointMatricesAllFramesFlatten,
//                     ...new Array(fillNum).fill(0).map(() => Matrix4.identity),
//                 ]
//                     .map((m) => [...m.e])
//                     .flat()
//             );
//
//             const matrixColNum = 4;
//             // const dataPerPixel = 4;
//             this.jointTexture.update({
//                 width: colNum * matrixColNum,
//                 height: rowNum,
//                 data: jointData,
//             });
//
//             this.materials.forEach((material) =>
//                 setMaterialUniformValue(material, UniformNames.TotalFrameCount, framesDuration)
//             );
//             this.depthMaterials.forEach((depthMaterial) => {
//                 setMaterialUniformValue(depthMaterial, UniformNames.TotalFrameCount, framesDuration);
//             });
//
//             // for debug
//             console.log(`# bake skin animation to texture
// frames duration: ${framesDuration}
// col num: ${colNum},
// row num: ${rowNum},
// col pixels: ${colNum * matrixColNum},
// row pixels: ${rowNum},
// total pixels: ${colNum * matrixColNum * rowNum},
// all e: ${colNum * matrixColNum * rowNum * 4},
// matrix e: ${jointData.length}`);
//         }
//     }
//
//     update(options: ActorUpdateArgs) {
//         super.update(options);
//
//         const { time } = options;
//
//         calcJointMatrix(this.bones);
//
//         // if (this.debugBoneView) {
//         if (this.boneLines && this.bonePoints) {
//             // console.log("--------")
//             const boneLinePositions: number[][] = this.boneOrderedIndex.map((bone) => {
//                 // console.log(bone.jointMatrix.position.e)
//                 return [...bone.getJointMatrix().position.e];
//             });
//             // this.boneLines.geometry.updateAttribute(AttributeNames.Position, boneLinePositions.flat())
//             // this.bonePoints.geometry.updateAttribute(AttributeNames.Position, boneLinePositions.flat())
//             this.boneLines.geometry.updateAttribute(
//                 AttributeNames.Position,
//                 new Float32Array(boneLinePositions.flat())
//             );
//             this.bonePoints.geometry.updateAttribute(
//                 AttributeNames.Position,
//                 new Float32Array(boneLinePositions.flat())
//             );
//         }
//
//         if (this.gpuSkinning) {
//             this.materials.forEach((mat) => setMaterialUniformValue(mat, UniformNames.Time, time));
//             this.depthMaterials.forEach((depthMaterial) => {
//                 setMaterialUniformValue(depthMaterial, UniformNames.Time, time);
//             });
//
//             this.materials.forEach((mat) =>
//                 setMaterialUniformValue(mat, UniformNames.JointTexture, this.jointTexture)
//             );
//             this.depthMaterials.forEach((depthMaterial) => {
//                 setMaterialUniformValue(depthMaterial, UniformNames.JointTexture, this.jointTexture);
//             });
//         } else {
//             // NOTE: test update skinning by cpu
//             // needs
//             const boneOffsetMatrices = this.boneOffsetMatrices;
//             const boneJointMatrices = this.getBoneJointMatricesWithBone();
//
//             const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) =>
//                 Matrix4.multiplyMatrices(boneJointMatrices[i].matrix, boneOffsetMatrix)
//             );
//
//             const colNum = this.jointTextureColNum;
//             const rowNum = Math.ceil(this.boneCount / colNum);
//             const fillNum = colNum * rowNum - this.boneCount;
//             const jointData = new Float32Array(
//                 [...jointMatrices, ...new Array(fillNum).fill(0).map(() => Matrix4.identity)]
//                     .map((m) => [...m.e])
//                     .flat()
//             );
//
//             const matrixColNum = 4;
//             if (this.jointTexture) {
//                 this.jointTexture.update({
//                     width: colNum * matrixColNum,
//                     height: rowNum,
//                     data: jointData,
//                 });
//             }
//
//             this.materials.forEach((mat) =>
//                 setMaterialUniformValue(mat, UniformNames.JointTexture, this.jointTexture)
//             );
//             this.depthMaterials.forEach((depthMaterial) => {
//                 setMaterialUniformValue(depthMaterial, UniformNames.JointTexture, this.jointTexture);
//             });
//         }
//     }
//
//     generateSkinningUniforms() {
//         return [
//             // TODO: for cpu
//             // material.uniforms.uJointMatrices = {
//             //     type: UniformTypes.Matrix4Array,
//             //     value: new Array(this.boneCount).fill(0).map(i => Matrix4.identity),
//             // };
//             {
//                 name: UniformNames.JointTexture,
//                 type: UniformTypes.Texture,
//                 value: null,
//             },
//             {
//                 name: UniformNames.JointTextureColNum,
//                 type: UniformTypes.Int,
//                 value: this.jointTextureColNum,
//             },
//             ...(this.gpuSkinning
//                 ? [
//                       {
//                           name: UniformNames.BoneCount,
//                           type: UniformTypes.Int,
//                           value: this.boneCount,
//                       },
//                       {
//                           name: UniformNames.TotalFrameCount,
//                           type: UniformTypes.Int,
//                           value: 0,
//                       },
//                   ]
//                 : []),
//         ];
//     }
//
//     getBoneOffsetMatrices(): Matrix4[] {
//         const matrices: Matrix4[] = [];
//         traverseBone(this.bones, (bone) => {
//             const m = bone.getBoneOffsetMatrix().clone();
//             matrices.push(m);
//         });
//         return matrices;
//     }
//
//     getBoneJointMatrices(): Matrix4[] {
//         const matrices: Matrix4[] = [];
//         traverseBone(this.bones, (bone) => {
//             const m = bone.getJointMatrix().clone();
//             matrices.push(m);
//         });
//         return matrices;
//     }
//
//     getBoneJointMatricesWithBone(): { bone: Bone; matrix: Matrix4 }[] {
//         const data: { bone: Bone; matrix: Matrix4 }[] = [];
//         traverseBone(this.bones, (bone) => {
//             const matrix = bone.getJointMatrix().clone();
//             data.push({ bone, matrix });
//         });
//         return data;
//     }
//
//     #createSkinDebugger({ gpu }: { gpu: GPU }) {
//         const checkChildNum = (bone: Bone) => {
//             if (bone.hasChild()) {
//                 bone.getChildren().forEach((elem) => {
//                     const childBone = elem as Bone;
//                     this.boneIndicesForLines.push(bone.getIndex(), childBone.getIndex());
//                     checkChildNum(childBone);
//                 });
//             }
//         };
//         checkChildNum(this.bones);
//
//         this.boneLines = new Mesh({
//             // gpu,
//             geometry: createGeometry({
//                 gpu,
//                 attributes: [
//                     createAttribute({
//                         name: AttributeNames.Position,
//                         data: new Float32Array(new Array(this.boneOrderedIndex.length * 3).fill(0)),
//                         size: 3,
//                         usageType: AttributeUsageType.DynamicDraw,
//                     }),
//                 ],
//                 indices: this.boneIndicesForLines,
//                 drawCount: this.boneIndicesForLines.length,
//             }),
//             material: createMaterial({
//                 // gpu,
//                 vertexShader: `
//                 layout (location = 0) in vec3 ${AttributeNames.Position};
//
//                 uniform mat4 ${UniformNames.WorldMatrix};
//                 uniform mat4 ${UniformNames.ViewMatrix};
//                 uniform mat4 ${UniformNames.ProjectionMatrix};
//
//                 void main() {
//                     gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
//                 }
//                 `,
//                 fragmentShader: `
//                 out vec4 outColor;
//
//                 void main() {
//                     outColor = vec4(0, 1., 0, 1.);
//                 }
//                 `,
//                 primitiveType: PrimitiveTypes.Lines,
//                 blendType: BlendTypes.Transparent,
//                 depthWrite: false,
//                 depthTest: false,
//             }),
//         });
//
//         this.bonePoints = new Mesh({
//             // gpu,
//             geometry: createGeometry({
//                 gpu,
//                 attributes: [
//                     createAttribute({
//                         name: AttributeNames.Position.toString(),
//                         data: new Float32Array(new Array(this.boneOrderedIndex.length * 3).fill(0)),
//                         size: 3,
//                         usageType: AttributeUsageType.DynamicDraw,
//                     }),
//                 ],
//                 drawCount: this.boneOrderedIndex.length,
//             }),
//             material: createMaterial({
//                 // gpu,
//                 vertexShader: `
//                 layout (location = 0) in vec3 ${AttributeNames.Position};
//
//                 uniform mat4 ${UniformNames.WorldMatrix};
//                 uniform mat4 ${UniformNames.ViewMatrix};
//                 uniform mat4 ${UniformNames.ProjectionMatrix};
//
//                 void main() {
//                     gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
//                     gl_PointSize = 6.;
//                 }
//                 `,
//                 fragmentShader: `
//                 out vec4 outColor;
//
//                 void main() {
//                     outColor = vec4(1, 0., 0, 1.);
//                 }
//                 `,
//                 primitiveType: PrimitiveTypes.Points,
//                 blendType: BlendTypes.Transparent,
//                 depthWrite: false,
//                 depthTest: false,
//             }),
//         });
//
//         this.addChild(this.boneLines);
//         this.addChild(this.bonePoints);
//     }
//
//     setAnimationClips(animationClips: AnimationClip[]) {
//         this.animationClips = animationClips;
//     }
// }

export type SkinnedMesh = Mesh & {
    bones: Bone;
    boneCount: number;
    boneOffsetMatrices: Matrix4[];
    boneIndicesForLines: number[];
    boneOrderedIndex: Bone[];
    jointTexture: Texture | null;
    gpuSkinning: boolean | null;
    animationClips: AnimationClip[];
    jointTextureColNum: number;
    debugBoneView: boolean;
    boneLines: Mesh | null;
    bonePoints: Mesh | null;
};

export function createSkinnedMesh({ bones, debugBoneView, ...options }: SkinnedMeshArgs): SkinnedMesh {
    // positions = [];
    // boneIndices = [];
    // boneWeights = [];

    const boneOffsetMatrices: Matrix4[] = [];

    const boneIndicesForLines: number[] = [];

    const jointTexture: Texture | null = null;

    // gpuSkinning: boolean = false;
    const gpuSkinning: boolean | null = null;

    const animationClips: AnimationClip[] = [];

    // TODO: editable
    const jointTextureColNum: number = 1;

    const boneLines: Mesh | null = null;
    const bonePoints: Mesh | null = null;

    // TODO: generate vertex shader in constructor
    const mesh = createMesh({
        ...options,
        meshType: MeshTypes.Skinned,
        autoGenerateDepthMaterial: true,
    });

    const skinnedMeshBase = {
        ...mesh,
        bones,
        // boneCount,
        boneOffsetMatrices,
        boneIndicesForLines,
        // boneOrderedIndex,
        jointTexture,
        gpuSkinning,
        animationClips,
        jointTextureColNum,
        boneLines,
        bonePoints,
        debugBoneView: !!debugBoneView,
    };

    let boneCount: number = 0;
    const boneOrderedIndex: Bone[] = [];

    // bone index order な配列を作っておく
    traverseBone(skinnedMeshBase.bones, (bone) => {
        boneCount++;
        boneOrderedIndex[bone.getIndex()] = bone;
    });

    return {
        ...skinnedMeshBase,
        boneCount,
        boneOrderedIndex,
    };
}

export const startSkinnedMesh: StartActorFunc = (actor, args) => {
    const skinnedMesh = actor as SkinnedMesh;

    const { gpu } = args;

    calcBoneOffsetMatrix(skinnedMesh.bones);

    // ボーンオフセット行列を計算
    skinnedMesh.boneOffsetMatrices = getBoneOffsetMatrices(skinnedMesh);

    skinnedMesh.gpuSkinning = !!getMeshMainMaterial(skinnedMesh).gpuSkinning;

    // ボーンごとの joint matrix をテクスチャに詰める
    // 1ボーンあたり4pixel（4 channel x 4 pixel = 16） 必要
    // 精度は16bitで十分だが jsのtypedarrayには16bitがないので32bitを使う
    // bit容量は下記
    // 32bit (bit per channel) * 16 (4 channel * 4 pixel) * N bones
    skinnedMesh.jointTexture = new Texture({
        gpu,
        width: 1,
        height: 1,
        type: TextureTypes.RGBA32F,
    });

    skinnedMesh.materials.forEach((material) => {
        material.uniforms = createUniforms(material.uniforms.data, generateSkinningUniforms(skinnedMesh));
        material.isSkinning = true;
        material.gpuSkinning = !!skinnedMesh.gpuSkinning;
        material.jointNum = skinnedMesh.boneCount;
    });

    getMeshMainMaterial(skinnedMesh).depthUniforms = createUniforms(
        getMeshMainMaterial(skinnedMesh).depthUniforms.data,
        generateSkinningUniforms(skinnedMesh)
    );

    // いろいろ準備したあとにstart
    startMeshBehaviourBase(skinnedMesh, args);

    if (skinnedMesh.debugBoneView) {
        createSkinDebugger(skinnedMesh, { gpu });
    }

    // アニメーションもテクスチャに焼きたいのでanimationClipsが必要
    if (skinnedMesh.animationClips && skinnedMesh.gpuSkinning) {
        const animationData: FrameData[][][] = [];

        // TODO: refactor
        skinnedMesh.animationClips.forEach((animationClip, i) => {
            const dataEachKeyframes = animationClip.getAllKeyframesValue();
            animationData[i] = [];
            dataEachKeyframes.forEach((dataKeyframes, frameIndex) => {
                animationData[i][frameIndex] = [];
                dataKeyframes.forEach((elem) => {
                    // TODO: bone animation じゃない場合の対応
                    const boneIndex = (elem.target as Bone).getIndex();
                    if (!animationData[i][frameIndex][boneIndex]) {
                        animationData[i][frameIndex][boneIndex] = {
                            // NOTE: { [elem.key]: elem.frameValue }
                            bone: elem.target as Bone,
                        };
                    }
                    // NOTE: animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue;
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
                            console.error('invalid target path');
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
                    const targetBone = skinnedMesh.boneOrderedIndex[bone.getIndex()];
                    if (translation) {
                        targetBone.setPosition(translation);
                    }
                    if (rotation) {
                        // TODO: quaternion-bug: 本当はこっちを使いたい
                        // targetBone.rotation = Rotator.fromQuaternion(rotation);
                        targetBone.setRotation(Rotator.fromMatrix4(rotation.toMatrix4()));
                    }
                    if (scale) {
                        targetBone.setScale(scale);
                    }
                });
                // boneごとのjointMatrixを再計算
                calcJointMatrix(skinnedMesh.bones);

                // どちらも bone index order ではない
                const boneOffsetMatrices = skinnedMesh.boneOffsetMatrices;
                const boneJointMatrices = getBoneJointMatricesWithBone(skinnedMesh);

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

        const framesDuration = skinnedMesh.animationClips.reduce((acc, cur) => acc + cur.getFrameCount(), 0);

        const colNum = skinnedMesh.jointTextureColNum;
        const boneCount = skinnedMesh.boneCount * framesDuration;
        const rowNum = Math.ceil(boneCount / colNum);
        const fillNum = colNum * rowNum - boneCount;
        const jointData = new Float32Array(
            [
                // ...jointMatricesAllFrames,
                ...jointMatricesAllFramesFlatten,
                ...new Array(fillNum).fill(0).map(() => Matrix4.identity),
            ]
                .map((m) => [...m.e])
                .flat()
        );

        const matrixColNum = 4;
        // const dataPerPixel = 4;
        skinnedMesh.jointTexture.update({
            width: colNum * matrixColNum,
            height: rowNum,
            data: jointData,
        });

        skinnedMesh.materials.forEach((material) =>
            setMaterialUniformValue(material, UniformNames.TotalFrameCount, framesDuration)
        );
        skinnedMesh.depthMaterials.forEach((depthMaterial) => {
            setMaterialUniformValue(depthMaterial, UniformNames.TotalFrameCount, framesDuration);
        });

        // for debug
        console.log(`# bake skin animation to texture
frames duration: ${framesDuration}
col num: ${colNum},
row num: ${rowNum},
col pixels: ${colNum * matrixColNum},
row pixels: ${rowNum},
total pixels: ${colNum * matrixColNum * rowNum},
all e: ${colNum * matrixColNum * rowNum * 4},
matrix e: ${jointData.length}`);
    }
};

export const updateSkinnedMesh: UpdateActorFunc = (actor: Actor, options: ActorUpdateArgs) => {
    const skinnedMesh = actor as SkinnedMesh;

    const { time } = options;

    calcJointMatrix(skinnedMesh.bones);

    // if (this.debugBoneView) {
    if (skinnedMesh.boneLines && skinnedMesh.bonePoints) {
        // console.log("--------")
        const boneLinePositions: number[][] = skinnedMesh.boneOrderedIndex.map((bone) => {
            // console.log(bone.jointMatrix.position.e)
            return [...bone.getJointMatrix().position.e];
        });
        // this.boneLines.geometry.updateAttribute(AttributeNames.Position, boneLinePositions.flat())
        // this.bonePoints.geometry.updateAttribute(AttributeNames.Position, boneLinePositions.flat())
        updateGeometryAttribute(
            skinnedMesh.boneLines.geometry,
            AttributeNames.Position,
            new Float32Array(boneLinePositions.flat())
        );
        updateGeometryAttribute(
            skinnedMesh.bonePoints.geometry,
            AttributeNames.Position,
            new Float32Array(boneLinePositions.flat())
        );
    }

    if (skinnedMesh.gpuSkinning) {
        skinnedMesh.materials.forEach((mat) => setMaterialUniformValue(mat, UniformNames.Time, time));
        skinnedMesh.depthMaterials.forEach((depthMaterial) => {
            setMaterialUniformValue(depthMaterial, UniformNames.Time, time);
        });

        skinnedMesh.materials.forEach((mat) =>
            setMaterialUniformValue(mat, UniformNames.JointTexture, skinnedMesh.jointTexture)
        );
        skinnedMesh.depthMaterials.forEach((depthMaterial) => {
            setMaterialUniformValue(depthMaterial, UniformNames.JointTexture, skinnedMesh.jointTexture);
        });
    } else {
        // NOTE: test update skinning by cpu
        // needs
        const boneOffsetMatrices = skinnedMesh.boneOffsetMatrices;
        const boneJointMatrices = getBoneJointMatricesWithBone(skinnedMesh);

        const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) =>
            Matrix4.multiplyMatrices(boneJointMatrices[i].matrix, boneOffsetMatrix)
        );

        const colNum = skinnedMesh.jointTextureColNum;
        const rowNum = Math.ceil(skinnedMesh.boneCount / colNum);
        const fillNum = colNum * rowNum - skinnedMesh.boneCount;
        const jointData = new Float32Array(
            [...jointMatrices, ...new Array(fillNum).fill(0).map(() => Matrix4.identity)].map((m) => [...m.e]).flat()
        );

        const matrixColNum = 4;
        if (skinnedMesh.jointTexture) {
            skinnedMesh.jointTexture.update({
                width: colNum * matrixColNum,
                height: rowNum,
                data: jointData,
            });
        }

        skinnedMesh.materials.forEach((mat) =>
            setMaterialUniformValue(mat, UniformNames.JointTexture, skinnedMesh.jointTexture)
        );
        skinnedMesh.depthMaterials.forEach((depthMaterial) => {
            setMaterialUniformValue(depthMaterial, UniformNames.JointTexture, skinnedMesh.jointTexture);
        });
    }
};

const generateSkinningUniforms = (skinnedMesh: SkinnedMesh) => {
    return [
        // TODO: for cpu
        // material.uniforms.uJointMatrices = {
        //     type: UniformTypes.Matrix4Array,
        //     value: new Array(this.boneCount).fill(0).map(i => Matrix4.identity),
        // };
        {
            name: UniformNames.JointTexture,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.JointTextureColNum,
            type: UniformTypes.Int,
            value: skinnedMesh.jointTextureColNum,
        },
        ...(skinnedMesh.gpuSkinning
            ? [
                  {
                      name: UniformNames.BoneCount,
                      type: UniformTypes.Int,
                      value: skinnedMesh.boneCount,
                  },
                  {
                      name: UniformNames.TotalFrameCount,
                      type: UniformTypes.Int,
                      value: 0,
                  },
              ]
            : []),
    ];
};

const getBoneOffsetMatrices = (skinnedMesh: SkinnedMesh): Matrix4[] => {
    const matrices: Matrix4[] = [];
    traverseBone(skinnedMesh.bones, (bone) => {
        const m = bone.getBoneOffsetMatrix().clone();
        matrices.push(m);
    });
    return matrices;
};

export const getBoneJointMatrices = (skinnedMesh: SkinnedMesh): Matrix4[] => {
    const matrices: Matrix4[] = [];
    traverseBone(skinnedMesh.bones, (bone) => {
        const m = bone.getJointMatrix().clone();
        matrices.push(m);
    });
    return matrices;
};

const getBoneJointMatricesWithBone = (
    skinnedMesh: SkinnedMesh
): {
    bone: Bone;
    matrix: Matrix4;
}[] => {
    const data: { bone: Bone; matrix: Matrix4 }[] = [];
    traverseBone(skinnedMesh.bones, (bone) => {
        const matrix = bone.getJointMatrix().clone();
        data.push({ bone, matrix });
    });
    return data;
};

const createSkinDebugger = (skinnedMesh: SkinnedMesh, { gpu }: { gpu: GPU }) => {
    const checkChildNum = (bone: Bone) => {
        if (bone.hasChild()) {
            bone.getChildren().forEach((elem) => {
                const childBone = elem as Bone;
                skinnedMesh.boneIndicesForLines.push(bone.getIndex(), childBone.getIndex());
                checkChildNum(childBone);
            });
        }
    };
    checkChildNum(skinnedMesh.bones);

    skinnedMesh.boneLines = createMesh({
        // gpu,
        geometry: createGeometry({
            gpu,
            attributes: [
                createAttribute({
                    name: AttributeNames.Position,
                    data: new Float32Array(new Array(skinnedMesh.boneOrderedIndex.length * 3).fill(0)),
                    size: 3,
                    usageType: AttributeUsageType.DynamicDraw,
                }),
            ],
            indices: skinnedMesh.boneIndicesForLines,
            drawCount: skinnedMesh.boneIndicesForLines.length,
        }),
        material: createMaterial({
            // gpu,
            vertexShader: `
                layout (location = 0) in vec3 ${AttributeNames.Position};
                
                uniform mat4 ${UniformNames.WorldMatrix};
                uniform mat4 ${UniformNames.ViewMatrix};
                uniform mat4 ${UniformNames.ProjectionMatrix};
                
                void main() {
                    gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
                }
                `,
            fragmentShader: `
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

    skinnedMesh.bonePoints = createMesh({
        // gpu,
        geometry: createGeometry({
            gpu,
            attributes: [
                createAttribute({
                    name: AttributeNames.Position.toString(),
                    data: new Float32Array(new Array(skinnedMesh.boneOrderedIndex.length * 3).fill(0)),
                    size: 3,
                    usageType: AttributeUsageType.DynamicDraw,
                }),
            ],
            drawCount: skinnedMesh.boneOrderedIndex.length,
        }),
        material: createMaterial({
            // gpu,
            vertexShader: `
                layout (location = 0) in vec3 ${AttributeNames.Position};
                
                uniform mat4 ${UniformNames.WorldMatrix};
                uniform mat4 ${UniformNames.ViewMatrix};
                uniform mat4 ${UniformNames.ProjectionMatrix};
                
                void main() {
                    gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
                    gl_PointSize = 6.;
                }
                `,
            fragmentShader: `
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

    addChildActor(skinnedMesh, skinnedMesh.boneLines);
    addChildActor(skinnedMesh, skinnedMesh.bonePoints);
};

export const setAnimationClips = (skinnedMesh: SkinnedMesh, animationClips: AnimationClip[]) => {
    skinnedMesh.animationClips = animationClips;
};
