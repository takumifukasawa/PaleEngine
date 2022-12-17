﻿import {Mesh} from "./Mesh.js";
import {ActorTypes, AttributeUsageType, BlendTypes, PrimitiveTypes, TextureTypes, UniformTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";
import {Geometry} from "../geometries/Geometry.js";
import {Material} from "../materials/Material.js";
import {generateDepthVertexShader} from "../shaders/generateVertexShader.js";
import {generateDepthFragmentShader} from "../shaders/generateFragmentShader";
import {Texture} from "../core/Texture.js";
import {Rotator} from "../math/Rotator.js";

export class SkinnedMesh extends Mesh {
    bones;
    boneCount = 0;
   
    // positions = [];
    // boneIndices = [];
    // boneWeights = [];
    
    boneOffsetMatrices;
    
    #boneIndicesForLines = [];
    #boneOrderedIndex = [];
    
    #jointTexture;
    
    #gpuSkinning;
    
    #animationClips;

    // TODO: editable
    #jointTextureColNum = 1;

    #jointMatricesAllFrames;
    
    debugBoneView;
    
    // TODO: generate vertex shader in constructor
    constructor({bones, debugBoneView, gpu, ...options}) {
        super({
            ...options,
            actorType: ActorTypes.SkinnedMesh,
            autoGenerateDepthMaterial: false,
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
   
    start(options) {
        const { gpu } = options;

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
            type: TextureTypes.RGBA32F
        });

        this.materials.forEach(material => {
            // material.uniforms.uJointMatrices = {
            //     type: UniformTypes.Matrix4Array,
            //     value: new Array(this.boneCount).fill(0).map(i => Matrix4.identity()),
            // };
            material.uniforms = {
                ...material.uniforms,
                
                uJointTexture: {
                    type: UniformTypes.Texture,
                    value: null
                },
                uJointTextureColNum: {
                    type: UniformTypes.Int,
                    value: this.#jointTextureColNum,
                },
                
                ...(this.#gpuSkinning ? {
                    uTime: {
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    uBoneCount: {
                        type: UniformTypes.Int,
                        value: this.boneCount
                    },
                    uTotalFrameCount: {
                        type: UniformTypes.Int,
                        value: 0,
                    }
                } : {})
            }
            material.isSkinning = true;
            material.gpuSkinning = this.#gpuSkinning;
            material.jointNum = this.boneCount;
        });

        // TODO: depthを強制的につくるようにして問題ない？
        // if(!options.depthMaterial) {
        console.log("hogehoge", this.mainMaterial.vertexShaderModifier)
            this.depthMaterial = new Material({
                gpu,
                vertexShader: generateDepthVertexShader({
                    attributeDescriptors: this.geometry.getAttributeDescriptors(),
                    isSkinning: true,
                    gpuSkinning: this.#gpuSkinning,
                    jointNum: this.boneCount,
                    vertexShaderModifier: this.mainMaterial.vertexShaderModifier,
                    // localPositionPostProcess: this.mainMaterial.vertexShaderModifier.localPositionPostProcess
                }),
                fragmentShader: generateDepthFragmentShader({
                    // alphaTest: !!this.material.alphaTest
                    alphaTest: !!this.mainMaterial.alphaTest
                }),
                uniforms: {
                    // uJointMatrices: {
                    //     type: UniformTypes.Matrix4Array,
                    //     value: new Array(this.boneCount).fill(0).map(i => Matrix4.identity()),
                    //     // value: null
                    // },
                    uJointTexture: {
                        type: UniformTypes.Texture,
                        value: null
                    },
                    uJointTextureColNum: {
                        type: UniformTypes.Int,
                        value: this.#jointTextureColNum,
                    },
                    ...(this.#gpuSkinning ? {
                        uTime: {
                            type: UniformTypes.Float,
                            value: 0,
                        },
                        uBoneCount: {
                            type: UniformTypes.Int,
                            value: this.boneCount
                        },
                        uTotalFrameCount: {
                            type: UniformTypes.Int,
                            value: 0,
                        }
                    } : {})
                },
                alphaTest: this.mainMaterial.alphaTest
            });
        // }

        super.start(options);

        if(this.debugBoneView) {
            this.#createSkinDebugger({ gpu });
        }

        // アニメーションもテクスチャに焼きたいのでanimationClipsが必要
        if(this.#animationClips && this.#gpuSkinning) {
            const animationData = [];
            
            // TODO: refactor
            this.#animationClips.forEach((animationClip, i) => {
                const dataEachKeyframes = animationClip.getAllKeyframesValue();
                animationData[i] = [];
                dataEachKeyframes.forEach((dataKeyframes, frameIndex) => {
                    animationData[i][frameIndex] = [];
                    dataKeyframes.forEach(elem => {
                        const boneIndex = elem.target.index;
                        if(!animationData[i][frameIndex][boneIndex]) {
                            animationData[i][frameIndex][boneIndex] = {
                                bone: elem.target
                            };
                        }
                        animationData[i][frameIndex][boneIndex][elem.key] = elem.frameValue;
                    });
                });
            });
            
            let jointMatricesAllFrames = [];
           
            // TODO: refactor
            animationData.forEach((clips, clipIndex) => {
                jointMatricesAllFrames[clipIndex] = [];
                clips.forEach((keyframeData, frameIndex) => {
                    // boneにkeyframeごとの計算を割り当て
                    keyframeData.forEach((data) => {
                        const { translation, rotation, scale, bone } = data;
                        // const targetBone = this.bones.findByIndex(bone.index);
                        const targetBone = this.#boneOrderedIndex[bone.index];
                        targetBone.position = translation;
                        targetBone.rotation = Rotator.fromQuaternion(rotation);
                        targetBone.scale = scale;
                    });
                    // boneごとのjointMatrixを再計算
                    this.bones.calcJointMatrix();
                    
                    // どちらも bone index order ではない
                    const boneOffsetMatrices = this.boneOffsetMatrices;
                    const boneJointMatrices = this.getBoneJointMatricesWithBone();

                    // offset行列を踏まえたjoint行列を計算
                    const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) => Matrix4.multiplyMatrices(boneJointMatrices[i].matrix, boneOffsetMatrix));

                    jointMatricesAllFrames[clipIndex].push(jointMatrices);
                });
            });

            // data[clip_index][frame_index] = mat[bone_count]
            this.#jointMatricesAllFrames = jointMatricesAllFrames;

            jointMatricesAllFrames = [...jointMatricesAllFrames].flat(2);
            
            const framesDuration = this.#animationClips.reduce((acc, cur) => acc + cur.frameCount, 0);
          
            const colNum = this.#jointTextureColNum;
            const boneCount = this.boneCount * framesDuration;
            const rowNum = Math.ceil(boneCount / colNum);
            const fillNum = colNum * rowNum - boneCount;
            const jointData = new Float32Array([
                    ...jointMatricesAllFrames,
                    ...(new Array(fillNum)).fill(0).map(() => Matrix4.identity())
                ]
                .map(m => [...m.elements])
                .flat()
            );
          
            const matrixColNum = 4;
            const dataPerPixel = 4;
            this.#jointTexture.update({
                width: colNum * matrixColNum,
                height: rowNum,
                data: jointData
            });
            
            this.materials.forEach(material => material.uniforms.uTotalFrameCount.value = framesDuration);
            this.depthMaterial.uniforms.uTotalFrameCount.value = framesDuration;
 
            // for debug
            console.log(`
# bake skin animation to texture
col num: ${colNum},
row num: ${rowNum},
col pixels: ${colNum * matrixColNum},
row pixels: ${rowNum},
total pixels: ${colNum * matrixColNum * rowNum},
all elements: ${colNum * matrixColNum * rowNum * 4},
matrix elements: ${jointData.length}`);
        }
    }

    update(options) {
        super.update(options);
        
        const { time } = options;
        
        this.bones.calcJointMatrix();
      
        if(this.debugBoneView) {
            const boneLinePositions = this.#boneOrderedIndex.map(bone => [...bone.jointMatrix.position.elements]);
            this.boneLines.geometry.updateAttribute("position", boneLinePositions.flat())
            this.bonePoints.geometry.updateAttribute("position", boneLinePositions.flat())
        }

        if(this.#gpuSkinning) {
            this.materials.forEach(mat => mat.uniforms.uTime.value = time);
            this.depthMaterial.uniforms.uTime.value = time;

            this.materials.forEach(mat => mat.uniforms.uJointTexture.value = this.#jointTexture);
            this.depthMaterial.uniforms.uJointTexture.value = this.#jointTexture;
        } else {
            // NOTE: test update skinning by cpu
            // needs
            const boneOffsetMatrices = this.boneOffsetMatrices;
            const boneJointMatrices = this.getBoneJointMatricesWithBone();

            const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) => Matrix4.multiplyMatrices(boneJointMatrices[i].matrix, boneOffsetMatrix));
            
            const colNum = this.#jointTextureColNum;
            const rowNum = Math.ceil(this.boneCount / colNum);
            const fillNum = colNum * rowNum - this.boneCount;
            const jointData = new Float32Array([
                    ...jointMatrices,
                    ...(new Array(fillNum)).fill(0).map(() => Matrix4.identity())
                ]
                .map(m => [...m.elements])
                .flat()
            );

            const matrixColNum = 4;
            this.#jointTexture.update({
                width: colNum * matrixColNum,
                height: rowNum,
                data: jointData
            });

            this.materials.forEach(mat => mat.uniforms.uJointTexture.value = this.#jointTexture);
            this.depthMaterial.uniforms.uJointTexture.value = this.#jointTexture;
        }
    }

    getBoneOffsetMatrices() {
        const matrices = [];
        this.bones.traverse((bone) => {
            const m = bone.boneOffsetMatrix.clone();
            matrices.push(m);
        });
        return matrices;
    }
    
    getBoneJointMatrices() {
        const matrices = [];
        this.bones.traverse((bone) => {
            const m = bone.jointMatrix.clone();
            matrices.push(m);
        });
        return matrices;        
    }
    
    getBoneJointMatricesWithBone() {
        const data = [];
        this.bones.traverse((bone) => {
            const matrix = bone.jointMatrix.clone();
            data.push({ bone, matrix });
        });
        return data;
    }

    #createSkinDebugger({ gpu }) {
        const checkChildNum = (bone) => {
            if(bone.hasChild) {
                bone.children.forEach(childBone => {
                    this.#boneIndicesForLines.push(bone.index, childBone.index);
                    checkChildNum(childBone);
                });
            }
        }
        checkChildNum(this.bones);
        
        this.boneLines = new Mesh({
            gpu,
            geometry: new Geometry({
                gpu,
                attributes: {
                    position: {
                        // data: new Array(this.#boneIndicesForLines.length * 3),
                        data: new Array(this.#boneOrderedIndex.length * 3),
                        size: 3,
                        usage: AttributeUsageType.DynamicDraw
                    }
                },
                indices: this.#boneIndicesForLines,
                drawCount: this.#boneIndicesForLines.length
            }),
            material: new Material({
                gpu,
                vertexShader: `#version 300 es
                
                layout (location = 0) in vec3 aPosition;
                
                uniform mat4 uWorldMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uProjectionMatrix;
                
                void main() {
                    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
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
                depthTest: false
            })
        });

        this.bonePoints = new Mesh({
            gpu,
            geometry: new Geometry({
                gpu,
                attributes: {
                    position: {
                        data: new Array(this.#boneOrderedIndex.length * 3),
                        size: 3,
                        usage: AttributeUsageType.DynamicDraw
                    }
                },
                drawCount: this.#boneOrderedIndex.length
            }),
            material: new Material({
                gpu,
                vertexShader: `#version 300 es
               
                layout (location = 0) in vec3 aPosition;
                
                uniform mat4 uWorldMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uProjectionMatrix;
                
                void main() {
                    // gl_Point = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
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
                depthTest: false
            })
        });
        
        this.addChild(this.boneLines);
        this.addChild(this.bonePoints)       
    }
    
    setAnimationClips(animationClips) {
        this.#animationClips = animationClips;
    }
}