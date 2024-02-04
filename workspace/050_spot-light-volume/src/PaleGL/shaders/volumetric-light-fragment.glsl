﻿#version 300 es

precision highp float;

#pragma DEFINES

// TODO: spot light の最大数はどこかで定数管理したい
#define MAX_SPOT_LIGHT_COUNT 4

#include ./partial/common.glsl
// #include ./partial/lighting.glsl

// 
// TODO: このblock、lighting用の構造体とある程度共通化できそう？
struct SpotLight {
    vec3 position;
    vec3 direction; // spotlightの向き先
    // vec4 color;
    float intensity;
    float distance;
    float attenuation;
    float coneCos;
    float penumbraCos;
    mat4 lightViewProjectionMatrix;
    // float shadowBias;
};

// 光源からの光が届くかどうかを判定
bool testLightInRange(const in float lightDistance, const in float cutoffDistance) {
    return any(bvec2(cutoffDistance == 0., lightDistance < cutoffDistance));
}

// 光源からの減衰率計算
float punctualLightIntensityToIrradianceFactor(const in float lightDistance, const in float cutoffDistance, const in float attenuationComponent) {
    if (attenuationComponent > 0.) {
        return pow(saturate(-lightDistance / cutoffDistance + 1.), attenuationComponent);
    }

    return 1.;
}

// TODO: ここまで


in vec2 vUv;

out vec4 outColor;

uniform sampler2D uDepthTexture; // camera depth
uniform sampler2D uGBufferATexture;
uniform vec3 uViewPosition;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uTransposeInverseViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uInverseViewProjectionMatrix;
uniform mat4 uInverseViewMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform float uBlendRate;
uniform float uTime;

uniform SpotLight uSpotLight[MAX_SPOT_LIGHT_COUNT];
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];
uniform float uDensityMultiplier;
uniform float uRayStep;
uniform float uRayJitterSizeX;
uniform float uRayJitterSizeY;

#include ./partial/depth-functions.glsl

#include ./partial/gbuffer-functions.glsl

void main() {
    vec2 uv = vUv;

    float jitter = noise(uv + uTime) * 2. - 1.;

    vec2 jitterOffset = vec2(
        jitter * uRayJitterSizeX,
        jitter * uRayJitterSizeY
    );

    // outColor = vec4(vUv, 1., 1.);
    // outColor = texture(uGBufferATexture, vUv);
    GBufferA gBufferA = DecodeGBufferA(texture(uGBufferATexture, uv));
    // float rawDepth = texture(uSpotLightShadowMap[0], uv).r;
    float rawDepth = texture(uDepthTexture, uv).r;

    // geometry
    vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

    vec3 vpos = vec3(uv * 2. - 1., 1.);
    vec3 viewDir = (uInverseProjectionMatrix * vpos.xyzz * uFarClip).xyz;
    
    vec3 viewDirInWorld = (uInverseViewMatrix * vec4(viewDir, 0.)).xyz;
    // float viewDirInWorldLength = length(viewDirInWorld);
    
    vec3 rayOrigin = uViewPosition + vec3(jitterOffset, 0.);
    vec3 rayDir = normalize(viewDirInWorld);

    vec3 rayPos = vec3(0.);
    float distane = 0.;
    float rayStep = 0.;
    
    float transmittance = 0.; // fogの透過度
    
    for(int i = 0; i < 64; i++) {
        SpotLight spotLight = uSpotLight[0];
        sampler2D spotLightShadowMap = uSpotLightShadowMap[0];
        vec3 rayPos = rayOrigin + rayDir * rayStep;
        vec4 shadowPos = spotLight.lightViewProjectionMatrix * vec4(rayPos, 1.);
        vec3 shadowCoord = shadowPos.xyz / shadowPos.w;
        vec3 shadowUv = shadowCoord * .5 + .5;
        float shadowZ = shadowPos.z / shadowPos.w;
        float shadowDepth = texture(spotLightShadowMap, shadowUv.xy).r;
        float isShadowArea = 
            step(0., shadowUv.x) * (1. - step(1., shadowUv.x)) *
            step(0., shadowUv.y) * (1. - step(1., shadowUv.y)) *
            step(0., shadowUv.z) * (1. - step(1., shadowUv.z));

        vec3 rayToLight = spotLight.position - rayPos;
        vec3 PtoL = normalize(rayToLight);
        vec3 LtoP = -PtoL;
        float lightDistance = length(rayToLight);
        float angleCos = dot(normalize(LtoP), spotLight.direction);
        
        if(all(
            bvec3(
                angleCos > spotLight.coneCos,
                testLightInRange(lightDistance, spotLight.distance),
                shadowDepth > shadowZ // 深度がray.zよりも近い場合は光の影響を受けているとみなす
            )
        )) {
            float spotEffect = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);
            float attenuation = punctualLightIntensityToIrradianceFactor(lightDistance, spotLight.distance, spotLight.attenuation);
            transmittance += (1. / 64.) * attenuation * spotEffect; // cheap decay
            // transmittance += exp(-density); // TODO: 指数減衰使いたい
        }
      
        rayStep += uRayStep;
    }
    
    transmittance = saturate(transmittance);
   
    outColor = vec4(vec3(transmittance), 1.);
}
