﻿import { Actor } from '@/PaleGL/actors/Actor';
import { ActorType, ActorTypes } from '@/PaleGL/constants';
import { Material } from '@/PaleGL/materials/Material';
import { defaultDepthFragmentShader } from '@/PaleGL/shaders/buildShader';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { GPU } from '@/PaleGL/core/GPU';

export type MeshArgs = {
    // required
    geometry: Geometry;
    // optional
    material?: Material;
    actorType?: ActorType;
    materials?: Material[];
    depthMaterial?: Material | null;
    // actorType?: ActorTypes,
    castShadow?: boolean;
    instanced?: boolean;
    autoGenerateDepthMaterial?: boolean;
};

export class Mesh extends Actor {
    geometry: Geometry;
    // material;
    materials: Material[] = [];
    depthMaterial: Material | null;
    castShadow: boolean;
    instanced: boolean;
    autoGenerateDepthMaterial: boolean;

    get material() {
        if (this.hasMaterials) {
            console.warn('[Mesh.material getter] materials length > 1. material is head of materials.');
        }
        // return this.materials[0];
        return this.mainMaterial;
    }

    set material(material) {
        this.materials = [material];
    }

    get mainMaterial() {
        return this.materials[0];
    }

    get hasMaterials() {
        return this.materials.length > 1;
    }

    constructor({
        geometry,
        material,
        materials = [],
        depthMaterial,
        actorType,
        castShadow = false,
        instanced = false,
        autoGenerateDepthMaterial = true,
    }: MeshArgs) {
        super(actorType || ActorTypes.Mesh);
        this.geometry = geometry;
        // this.material = material;
        // TODO: check material is array
        this.materials = material ? [material] : materials ? materials : [];
        this.depthMaterial = depthMaterial || null;
        this.castShadow = !!castShadow;
        this.instanced = !!instanced;
        this.autoGenerateDepthMaterial = !!autoGenerateDepthMaterial;
    }

    // TODO: args は { gpu } だけでいいかも
    start({ gpu }: { gpu: GPU }) {
        // const {gpu} = options;

        super.start({ gpu });

        this.geometry.start();

        // 未コンパイルであればコンパイルする
        this.materials.forEach((material) => {
            if (!material.isCompiledShader) {
                material.start({
                    gpu,
                    attributeDescriptors: this.geometry.getAttributeDescriptors(),
                });
            }
        });

        if (!this.depthMaterial && this.autoGenerateDepthMaterial) {
            this.depthMaterial = new Material({
                // gpu,
                vertexShader: this.mainMaterial.vertexShader,
                fragmentShader: this.mainMaterial.depthFragmentShader || defaultDepthFragmentShader(),
                uniforms: this.mainMaterial.depthUniforms,
                faceSide: this.mainMaterial.faceSide,
            });
        }

        if (this.depthMaterial && !this.depthMaterial.isCompiledShader) {
            this.depthMaterial.start({
                gpu,
                attributeDescriptors: this.geometry.getAttributeDescriptors(),
            });
        }

        // for debug
        // console.log("main raw vertex", this.mainMaterial.rawVertexShader)
        // console.log("main raw fragment", this.mainMaterial.rawFragmentShader)
        // console.log("depth raw vertex", this.depthMaterial.rawVertexShader)
    }

    beforeRender({ gpu }: { gpu: GPU }) {
        super.beforeRender({ gpu });
        // this.materials.forEach(material => material.updateUniforms({ gpu }));
        // this.depthMaterial.updateUniforms({ gpu });
    }
}
