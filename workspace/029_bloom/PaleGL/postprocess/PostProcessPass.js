﻿import {PlaneGeometry} from "../geometries/PlaneGeometry.js";
import {Material} from "../materials/Material.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {Mesh} from "../actors/Mesh.js";
import {AttributeNames, PrimitiveTypes, UniformNames, UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";


export class PostProcessPass extends AbstractPostProcessPass {
    geometry;
    material;
    renderTarget;
    mesh;
    width;
    height;
    
    constructor({ gpu, vertexShader, fragmentShader, uniforms, name }) {
        super({ name });

        const baseVertexShader = `#version 300 es

layout (location = 0) in vec3 ${AttributeNames.Position};
layout (location = 1) in vec2 ${AttributeNames.Uv};

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}
`;
        vertexShader = vertexShader || baseVertexShader;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({ gpu });
        this.material = new Material({
            gpu,
            vertexShader,
            fragmentShader,
            uniforms: {
                ...uniforms, 
                [UniformNames.SceneTexture]: {
                    type: UniformTypes.Texture,
                    value: null
                }
            },
            primitiveType: PrimitiveTypes.Triangles
        });
        this.mesh = new Mesh({
            geometry: this.geometry,
            material: this.material
        }); 
        
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
    }
  
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.renderTarget.setSize(width, height);
    }

    setRenderTarget(renderer, camera, isLastPass) {
        if(isLastPass) {
            renderer.setRenderTarget(camera.renderTarget);
        } else {
            renderer.setRenderTarget(this.renderTarget);
        }
    }

    render({ gpu, camera, renderer, prevRenderTarget, isLastPass }) {
        this.setRenderTarget(renderer, camera, isLastPass);

        renderer.clear(
            camera.clearColor.x,
            camera.clearColor.y,
            camera.clearColor.z,
            camera.clearColor.w
        );

        this.mesh.updateTransform();
        this.material.uniforms[UniformNames.SceneTexture].value = prevRenderTarget.texture;
        if(!this.material.isCompiledShader) {
            this.material.start({ gpu })
        }

        renderer.renderMesh(this.geometry, this.material);
    }
}