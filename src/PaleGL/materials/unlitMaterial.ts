import { MaterialArgs, createMaterial, Material } from '@/PaleGL/materials/material.ts';
import {
    ShadingModelIds,
    DepthFuncTypes,
    UniformNames,
    UniformTypes,
    UniformBlockNames,
    VertexShaderModifiers,
} from '@/PaleGL/constants';
import { Color, createColorWhite } from '@/PaleGL/math/color.ts';
import { Texture } from '@/PaleGL/core/texture.ts';

import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import unlitFrag from '@/PaleGL/shaders/unlit-fragment.glsl';
import gBufferDepthFrag from '@/PaleGL/shaders/gbuffer-depth-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';

export type UnlitMaterialArgs = {
    diffuseMap?: Texture;
    diffuseMapTiling?: Vector4;
    diffuseColor?: Color;
    vertexShaderModifiers?: VertexShaderModifiers;
    uniforms?: UniformsData;
} & MaterialArgs;

export type UnlitMaterial = Material;

export function createUnlitMaterial({
    diffuseMap,
    diffuseMapTiling, // vec4
    diffuseColor,
    // TODO: 外部化
    vertexShaderModifiers = [],
    uniforms = [],
    ...options
}: UnlitMaterialArgs = {}) {
    const baseUniforms: UniformsData = [
        {
            name: UniformNames.DiffuseMap,
            type: UniformTypes.Texture,
            value: diffuseMap || null,
        },
        {
            name: UniformNames.DiffuseMapTiling,
            type: UniformTypes.Vector4,
            value: diffuseMapTiling || createVector4(1, 1, 0, 0),
        },
        {
            name: UniformNames.DiffuseColor,
            type: UniformTypes.Color,
            value: diffuseColor || createColorWhite(),
        },
        {
            name: UniformNames.ShadingModelId,
            type: UniformTypes.Int,
            value: ShadingModelIds.Unlit,
        },
    ];

    const mergedUniforms: UniformsData = [...baseUniforms, ...(uniforms ? uniforms : [])];

    const depthUniforms: UniformsData = [
        {
            name: UniformNames.DiffuseMap,
            type: UniformTypes.Texture,
            value: diffuseMap || null,
        },
        {
            name: UniformNames.DiffuseMapTiling,
            type: UniformTypes.Vector4,
            value: diffuseMapTiling || createVector4(1, 1, 0, 0),
        },
        {
            name: UniformNames.DiffuseColor,
            type: UniformTypes.Color,
            value: diffuseColor || createColorWhite(),
        },
    ];

    const material = createMaterial({
        ...options,
        name: 'UnlitMaterial',
        vertexShaderModifiers,
        vertexShader: gBufferVert,
        fragmentShader: unlitFrag,
        depthFragmentShader: gBufferDepthFrag,
        uniforms: mergedUniforms,
        depthUniforms,
        useNormalMap: false,
        depthTest: true,
        depthWrite: false, // TODO: これはGBufferの場合. unlitはtransparentの場合も対処すべき??
        depthFuncType: DepthFuncTypes.Equal, // NOTE: これはGBufferの場合
        uniformBlockNames: [UniformBlockNames.Transformations, UniformBlockNames.Camera],
    });

    return {
        ...material,
    };
}
