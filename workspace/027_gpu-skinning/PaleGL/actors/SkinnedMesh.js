﻿import {Mesh} from "./Mesh.js";
import {ActorTypes, AttributeUsageType, BlendTypes, PrimitiveTypes, TextureTypes, UniformTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";
import {Geometry} from "../geometries/Geometry.js";
import {Material} from "../materials/Material.js";
import {generateDepthVertexShader} from "../shaders/generateVertexShader.js";
import {generateDepthFragmentShader} from "../shaders/generateFragmentShader";
import {Texture} from "../core/Texture.js";

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
    
    // TODO: generate vertex shader in constructor
    constructor({bones, gpu, ...options}) {
        super({
            ...options,
            actorType: ActorTypes.SkinnedMesh,
            autoGenerateDepthMaterial: false,
        });

        this.bones = bones;

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
        this.boneOffsetMatrices = this.getBoneOffsetMatrices();

        this.#gpuSkinning = !!this.mainMaterial.gpuSkinning;

        if(this.#gpuSkinning) {
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
        }

        this.materials.forEach(material => {
            material.uniforms.uJointMatrices = {
                type: UniformTypes.Matrix4Array,
                // TODO: 毎回これ入れるのめんどいので共通化したい
                value: new Array(this.boneCount).fill(0).map(i => Matrix4.identity()),
            };
            if(this.#gpuSkinning) {
                material.uniforms.uJointTexture = {
                    type: UniformTypes.Texture,
                    value: null
                };
            }
            material.isSkinning = true;
            material.gpuSkinning = this.#gpuSkinning;
            material.jointNum = this.boneCount;
        });

        // TODO: depthを強制的につくるようにして問題ない？
        // if(!options.depthMaterial) {
            this.depthMaterial = new Material({
                gpu,
                vertexShader: generateDepthVertexShader({
                    isSkinning: true,
                    gpuSkinning: this.#gpuSkinning,
                    jointNum: this.boneCount,
                }),
                fragmentShader: generateDepthFragmentShader({
                    // alphaTest: !!this.material.alphaTest
                    alphaTest: !!this.mainMaterial.alphaTest
                }),
                uniforms: {
                    uJointMatrices: {
                        type: UniformTypes.Matrix4Array,
                        value: new Array(this.boneCount).fill(0).map(i => Matrix4.identity()),
                        // value: null
                    },
                    ...(this.#gpuSkinning ?
                        {
                            uJointTexture: {
                                type: UniformTypes.Texture,
                                value: null
                            }
                        }
                    : {}),
                },
                alphaTest: this.mainMaterial.alphaTest
            });
        // }

        super.start(options);

        this.#createSkinDebugger({ gpu });
    }
    
    update(options) {
        super.update(options);
        
        this.bones.calcJointMatrix();
        
        // for debug
        // this.bones.traverse(b => {
        //    if(b.name === "thigh.L") {
        //        console.log(b.rotation.getAxes())
        //    }
        // })
        
        // NOTE: test update skinning by cpu
        const boneOffsetMatrices = this.boneOffsetMatrices;
        const boneJointMatrices = this.getBoneJointMatrices();

        const boneLinePositions = this.#boneOrderedIndex.map(bone => [...bone.jointMatrix.position.elements]);
       
        this.boneLines.geometry.updateAttribute("position", boneLinePositions.flat())
        this.bonePoints.geometry.updateAttribute("position", boneLinePositions.flat())
       
        const jointMatrices = boneOffsetMatrices.map((boneOffsetMatrix, i) => Matrix4.multiplyMatrices(boneJointMatrices[i], boneOffsetMatrix));

        this.materials.forEach(material => {
            material.uniforms.uJointMatrices.value = jointMatrices;
        });
        if(this.depthMaterial) {
            this.depthMaterial.uniforms.uJointMatrices.value = jointMatrices;
        }

        if(this.#gpuSkinning) {
            const colNum = 2;
            const rowNum = Math.ceil(this.boneCount / colNum);
            const fillNum = colNum * rowNum - this.boneCount;
            const jointData = new Float32Array([
                ...jointMatrices.map(m => [...m.elements]),
                ...(
                    new Array(fillNum)
                        .fill(0)
                        .map(() => [
                            0, 0, 0, 0,
                            0, 0, 0, 0,
                            0, 0, 0, 0,
                            0, 0, 0, 0
                        ])
                    )
            ].flat());
           
            const matrixColNum = 4;
            const dataPerPixel = 4;
            this.#jointTexture.update({
                width: colNum * matrixColNum,
                height: rowNum,
                data: jointData
            });
            
            // for debug
            // console.log(
            //     colNum * matrixColNum,
            //     rowNum,
            //     colNum * matrixColNum * rowNum * dataPerPixel,
            //     jointData.length
            // );

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