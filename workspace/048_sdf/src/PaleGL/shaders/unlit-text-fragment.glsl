#version 300 es

precision mediump float;

#pragma DEFINES

uniform vec4 uColor;
uniform int uShadingModelId;
uniform sampler2D uFontMap;
uniform vec4 uFontTiling;

#include ./partial/tone-mapping.glsl

#include ./partial/alpha-test-fragment-uniforms.glsl

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

#include ./partial/vertex-color-fragment-varyings.glsl

#include ./partial/gbuffer-functions.glsl

#include ./partial/alpha-test-functions.glsl

#include ./partial/gbuffer-layout.glsl

const float threshold = .5;
const float smoothRange = .01;
float sdf2alpha(float sdf) {
    float alpha = smoothstep(
        threshold - smoothRange,
        threshold + smoothRange,
        sdf
    );
    return alpha;
}

float median(vec3 msdf) {
    return max(
        min(msdf.r, msdf.g),
        min(
            max(msdf.r, msdf.g),
            msdf.b
        )
    );
}

void main() {
    vec4 resultColor = uColor;

    vec2 uv = vUv;
    uv = uv * uFontTiling.xy + uFontTiling.zw;

    vec3 worldNormal = normalize(vNormal);
  
    float sdf = median(texture(uFontMap, uv).rgb);

    float alpha = sdf2alpha(sdf);
    resultColor.a = alpha;

#ifdef USE_ALPHA_TEST
    checkAlphaTest(resultColor.a, uAlphaTestThreshold);
#endif

    resultColor.rgb = gamma(resultColor.rgb);
    
    outGBufferA = EncodeGBufferA(vec3(0.));
    outGBufferB = EncodeGBufferB(worldNormal, uShadingModelId);
    outGBufferC = EncodeGBufferC(0., 0.);
    outGBufferD = EncodeGBufferD(resultColor.rgb);
}
