#pragma DEFINES

#include <common>
#include <lighting>
#include <ub>
#include <depth>
#include <gbuffer>
#include <geometry_h>
#include <skybox_h>

// -----------------------------------------------------------
// lighting functions
// -----------------------------------------------------------

//
// ref: https://zenn.dev/mebiusbox/books/619c81d2fbeafd/viewer/7c1069
//

struct IncidentLight {
    vec3 color;
    vec3 direction; // 光源への方向
    bool visible;
    float intensity;
};

struct ReflectedLight {
    vec3 directBase;
    vec3 directSpecular;
    vec3 indirectBase;
    vec3 indirectSpecular;
};

struct Material {
    vec3 baseColor;
    vec3 specularColor;
    float roughness;
    float metallic;
};

// -------------------------------------------------------------------------------
// lights
// -------------------------------------------------------------------------------

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

//
// directional light
//

void getDirectionalLightIrradiance(const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight) {
    directLight.color = directionalLight.color.xyz;
    directLight.direction = -directionalLight.direction; // 光源への方向にするので反転
    directLight.visible = true;
    directLight.intensity = directionalLight.intensity;
}

//
// spot light
//

void getSpotLightIrradiance(const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight directLight) {
    // vec3 L = spotLight.position - geometry.position;
    vec3 surfaceToLight = spotLight.position - geometry.position;
    vec3 PtoL = normalize(surfaceToLight);
    vec3 LtoP = -PtoL;
    directLight.direction = PtoL;
    directLight.intensity = spotLight.intensity;

    float lightDistance = length(surfaceToLight);
    // float angleCos = dot(directLight.direction, spotLight.direction);
    float angleCos = dot(LtoP, spotLight.direction);

    // directLight.color = vec3(lightDistance / 10.);
    // directLight.color = vec3(angleCos);
    // return;

    // TODO: 1から引かないようにしたい
    float coneCos = spotLight.coneCos;
    float penumbraCos = spotLight.penumbraCos;

    if (all(
    bvec2(
    angleCos > coneCos,
    testLightInRange(lightDistance, spotLight.distance)
    )
    )) {
        float spotEffect = smoothstep(coneCos, penumbraCos, angleCos);
        directLight.color = spotLight.color.xyz;
        directLight.color *= spotEffect * punctualLightIntensityToIrradianceFactor(lightDistance, spotLight.distance, spotLight.attenuation);
        directLight.visible = true;
    } else {
        directLight.color = vec3(0.);
        directLight.visible = false;
    }
}

//
// point light
//

void getPointLightIrradiance(const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight directLight) {
    vec3 surfaceToLight = pointLight.position - geometry.position;
    float lightDistance = length(surfaceToLight);
    vec3 L = normalize(surfaceToLight);

    directLight.direction = L;
    directLight.intensity = pointLight.intensity;

    if (testLightInRange(lightDistance, pointLight.distance)) {
        directLight.color = pointLight.color.xyz;
        directLight.color *= punctualLightIntensityToIrradianceFactor(lightDistance, pointLight.distance, pointLight.attenuation);
        directLight.visible = true;
    } else {
        directLight.color = vec3(0.);
        directLight.visible = false;
    }

    // directLight.color = vec3(testLightInRange(lightDistance, pointLight.distance) ? 1. : 0.);

    // for debug
    // directLight.color = vec3(1.);
    // directLight.visible = true;
    // directLight.color = vec3(lightDistance);
    // directLight.color = pointLight.position;
}

// -------------------------------------------------------------------------------
// brdfs
// -------------------------------------------------------------------------------

// normalized lambert

vec3 BaseBRDF(vec3 baseColor) {
    return baseColor / PI;
}

// TODO: schlickの公式まとめる

vec3 F_Shhlick(vec3 specularColor, vec3 H, vec3 V) {
    return (specularColor + (1. - specularColor) * pow(1. - saturate(dot(V, H)), 5.));
}

// ref: http://d.hatena.ne.jp/hanecci/20130525/p3
vec3 schlick(vec3 f0, float product) {
    return f0 + (1. - f0) * pow((1. - product), 5.);
}

float D_GGX(float a, float dotNH) {
    float a2 = a * a;
    float dotNH2 = dotNH * dotNH;
    float d = dotNH2 * (a2 - 1.) + 1.;
    return a2 / max((PI * d * d), EPSILON);
}

float G_Smith_Schlick_GGX(float a, float dotNV, float dotNL) {
    float k = a * a * .5 + EPSILON;
    float gl = dotNL / (dotNL * (1. - k) + k);
    float gv = dotNV / (dotNV * (1. - k) + k);
    return gl * gv;
}

// cook-torrance

// vec3 SpecularBRDF(const in IncidentLight directLight, const in GeometricContext geometry, vec3 specularColor, float roughnessFactor) {
vec3 SpecularBRDF(const vec3 lightDirection, const in GeometricContext geometry, vec3 specularColor, float roughnessFactor) {
    vec3 N = normalize(geometry.normal);
    vec3 V = normalize(geometry.viewDir);
    vec3 L = normalize(lightDirection);

    float dotNL = saturate(dot(N, L));
    float dotNV = saturate(dot(N, V));
    vec3 H = normalize(L + V);
    float dotNH = saturate(dot(N, H));
    float dotVH = saturate(dot(V, H));
    float dotLV = saturate(dot(L, V));

    float a = roughnessFactor * roughnessFactor;

    float D = D_GGX(a, dotNH);
    float G = G_Smith_Schlick_GGX(a, dotNV, dotNL);
    vec3 F = F_Shhlick(specularColor, V, H);

    return (F * (G * D)) / (4. * dotNL * dotNV + EPSILON);
}

// -------------------------------------------------------------------------------
// render equations
// -------------------------------------------------------------------------------

void RE_Direct(
    const in IncidentLight directLight,
    const in GeometricContext geometry,
    const in Material material,
    inout ReflectedLight reflectedLight,
    const in float shadow
) {
    // directionは光源への方向
    float dotNL = saturate(dot(geometry.normal, directLight.direction));
    vec3 irradiance = dotNL * directLight.color;

    // punctual light
    irradiance *= PI;
    irradiance *= directLight.intensity;
    irradiance *= (1. - shadow);

    // base
    reflectedLight.directBase +=
        irradiance *
        clamp(
            BaseBRDF(material.baseColor),
            -10.,
            10.
        ); // overflow fallback
    // specular
    // reflectedLight.directSpecular += irradiance * SpecularBRDF(directLight, geometry, material.specularColor, material.roughness);
    reflectedLight.directSpecular +=
        irradiance *
        clamp(
            SpecularBRDF(
                directLight.direction,
                geometry,
                material.specularColor,
                material.roughness
            ),
        -10.,
        10.
    ); // overflow fallback
}

// base: https://qiita.com/kaneta1992/items/df1ae53e352f6813e0cd
void RE_DirectSkyboxFakeIBL(
    samplerCube cubeMap,
    const in IncidentSkyboxLight skyboxLight,
    const in GeometricContext geometry,
    const in Material material,
    inout ReflectedLight reflectedLight
) {
    //
    // base
    //

    vec3 envDiffuseColor = textureLod(
        cubeMap,
        skyboxLight.diffuseDirection,
        skyboxLight.maxLodLevel
    ).xyz;

    // 拡散: metalness,roughnessを考慮しない
    reflectedLight.directBase +=
        material.baseColor
        * envDiffuseColor
        * skyboxLight.diffuseIntensity;

    //
    // specular
    //

    // 鏡面反射: roughnes を考慮
    // TODO: metallicも考慮すべき？
    float specularLod = log2(material.roughness * pow(2., skyboxLight.maxLodLevel));
    vec3 envSpecularColor = textureLod(
        cubeMap,
        skyboxLight.specularDirection,
        specularLod
    ).xyz;

    // vec3 f0 = mix(vec3(.04), material.baseColor, material.metallic);

    vec3 fresnel = schlick(material.specularColor, max(0., dot(geometry.viewDir, geometry.normal)));

    //
    // result
    //

    reflectedLight.directSpecular += mix(
        envSpecularColor * skyboxLight.specularIntensity * material.specularColor,
        envSpecularColor * skyboxLight.specularIntensity,
        fresnel
    );

    // for debug
    // reflectedLight.directSpecular.xyz = envSpecularColor;
    // reflectedLight.directSpecular.xyz = vec3(fresnel);
}


// -----------------------------------------------------------

// ref:
// https://matcha-choco010.net/2020/04/10/opengl-deferred-spot-light-shadow/
// https://www.opengl-tutorial.org/jp/intermediate-tutorials/tutorial-16-shadow-mapping/


const vec2 poissonDisk[4] = vec2[](
    vec2(-0.94201624, -0.39906216),
    vec2(0.94558609, -0.76890725),
    vec2(-0.094184101, -0.92938870),
    vec2(0.34495938, 0.29387760)
);


float calcDirectionalLightShadowAttenuation(
    vec3 worldPosition,
    vec3 worldNormal,
    vec3 lightDirection, // 光源自体の向き
    mat4 shadowMapProjectionMatrix,
    sampler2D shadowMap,
    float shadowBias,
    vec4 shadowColor,
    float shadowBlendRate
) {
    float NoL = max(dot(worldNormal, -lightDirection), 0.);
    float bias = .005 * tan(acos(NoL));
    bias = clamp(bias, .1, .5); // 大きくすればするほどアクネは少なくなるが、影の領域が少なくなる
    
    vec4 lightPos = shadowMapProjectionMatrix * vec4(worldPosition, 1.);
    vec2 uv = lightPos.xy;
    float depthFromWorldPos = lightPos.z;

    float shadowAreaSmooth = .25;
    float shadowAreaRect =
        // // 1: step
        // step(0., uv.x) * (1. - step(1., uv.x)) *
        // step(0., uv.y) * (1. - step(1., uv.y)) *
        // step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));
        // 2: smoothstep
        smoothstep(0., shadowAreaSmooth, uv.x) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.x)) *
        smoothstep(0., shadowAreaSmooth, uv.y) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.y)) *
        step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));

    float visibility = 1.;
    float readDepth = 0.;
    vec2 offset = vec2(0.);

    // for(int i = 0; i < 4; i++) {
    #pragma UNROLL_START 4
        offset = poissonDisk[UNROLL_N] / 800.;
        readDepth = textureLod(shadowMap, uv + offset, 0.).r;
        // visibility -= step(readDepth, depthFromWorldPos - bias) * .25;
        if(readDepth < lightPos.z - bias) {
            visibility -= .25;
        }
    #pragma UNROLL_END
    // }


    // for debug
    // vec3 color = mix(
    //     vec3(0., 0., 1.),
    //     vec3(1., 0., 0.),
    //     (1. - visibility) * shadowAreaRect
    // );
    // return vec4(color, 1.);
    // return mix(surfaceColor, shadowColor, isShadow * shadowAreaRect * shadowBlendRate);

    float shadow = (1. - visibility) * shadowAreaRect * shadowBlendRate;
    return clamp(shadow, 0., 1.);
}

float calcSpotLightShadowAttenuation(
    vec3 worldPosition,
    vec3 worldNormal,
    vec3 lightDirection, // 光源自体の向き
    mat4 lightViewProjectionTextureMatrix,
    sampler2D shadowMap,
    float shadowBias,
    vec4 shadowColor,
    float shadowBlendRate
) {
    float rNoL = dot(worldNormal, -lightDirection);
    float NoL = max(rNoL, 0.);
    float bias = .005 * tan(acos(NoL));
    bias = clamp(bias, .01, .02); // 大きくすればするほどアクネは少なくなるが、影の領域が少なくなる

    vec4 lightPos = lightViewProjectionTextureMatrix * vec4(worldPosition, 1.);
    vec2 uv = lightPos.xy / lightPos.w;
    float depthFromWorldPos = lightPos.z / lightPos.w;
    
    float shadowAreaSmooth = .25;
    float shadowAreaRect =
        // // 1: step
        // step(0., uv.x) * (1. - step(1., uv.x)) *
        // step(0., uv.y) * (1. - step(1., uv.y)) *
        // step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));
        // 2: smoothstep
        smoothstep(0., shadowAreaSmooth, uv.x) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.x)) *
        smoothstep(0., shadowAreaSmooth, uv.y) * (1. - smoothstep(1. - shadowAreaSmooth, 1., uv.y)) *
        step(0., depthFromWorldPos) * (1. - step(1., depthFromWorldPos));

    float visibility = 1.;
    vec2 offset = vec2(0.);
    float readDepth = 0.;

    // PCF
    // vec3 uvc = vec3(uv, depthFromWorldPos + .00001);
    // float readDepth = textureProj(shadowMap, uvc).r;
    // for(int i = 0; i < 4; i++) {
    #pragma UNROLL_START 4
        offset = poissonDisk[UNROLL_N] / 100.;
        readDepth = textureLod(shadowMap, uv + offset, 0.).r;
        visibility -= step(readDepth, depthFromWorldPos - bias) * .25;
        // if(readDepth < depthFromWorldPos - bias) {
        //     visibility -= .25;
        // }
    #pragma UNROLL_END
    // }

    // for debug
    // vec3 color = mix(
    //     vec3(0., 0., 1.),
    //     vec3(1., 0., 0.),
    //     // shadowAreaRect
    //     (1. - visibility) * shadowAreaRect
    //     // (1. - visibility) * shadowAreaRect
    // );
    // // return vec4(color, 1.);
    // return shadowAreaRect;

    // // return vec4(vec3(uv.xy, 1.) * shadowAreaRect, 1.);
    // // return vec4(vec3(shadow * shadowAreaRect), 1.);
    // return vec4(vec3(readDepth * shadowAreaRect), 1.);
    
    float faceSmooth = smoothstep(0., 0.001, rNoL);
    
    float shadow = (1. - visibility) * shadowAreaRect * shadowBlendRate * faceSmooth;
    return clamp(shadow, 0., 1.);
}

// -----------------------------------------------------------
// receive shadow
// -----------------------------------------------------------

// #ifdef USE_RECEIVE_SHADOW
uniform float uShadowBias;
// #endif

// -----------------------------------------------------------

in vec2 vUv;

uniform sampler2D uDirectionalLightShadowMap;
uniform sampler2D uSpotLightShadowMap[MAX_SPOT_LIGHT_COUNT];

uniform sampler2D uGBufferATexture;
uniform sampler2D uGBufferBTexture;
uniform sampler2D uGBufferCTexture;
uniform sampler2D uGBufferDTexture;
uniform sampler2D uScreenSpaceShadowTexture;
uniform sampler2D uAmbientOcclusionTexture;

// uniform float uTime;

// uniform mat4 uInverseViewProjectionMatrix;
       
// TODO: loop
// uniform Skybox uSkybox;

layout (location = 0) out vec4 outColor;

void main() {
    vec4 resultColor = vec4(0, 0, 0, 1);

    vec2 uv = vUv;

    GBufferA gBufferA = DecodeGBufferA(uGBufferATexture, uv);
    GBufferB gBufferB = DecodeGBufferB(uGBufferBTexture, uv);
    GBufferC gBufferC = DecodeGBufferC(uGBufferCTexture, uv);
    GBufferD gBufferD = DecodeGBufferD(uGBufferDTexture, uv);

    // TODO: use encode func
    // surface
    vec3 baseColor = gBufferA.baseColor;
    float metallic = gBufferC.metallic;
    float roughness = gBufferC.roughness;
    vec3 emissiveColor = gBufferD.emissiveColor;
    float shadingModelId = gBufferB.shadingModelId;
    vec3 worldNormal = gBufferB.normal;

    // depth
    float rawDepth = texture(uDepthTexture, uv).r;
    float depth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);

    // geometry
    vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

    // depth guard
    if (step(rawDepth, 1. - .00001) < .5) {
        outColor = vec4(baseColor, 1.); 
        // outColor = vec4(1., 0., 0., 1.); // TODO: 本当はこっちを使いたい: skyboxを後合成にしたい
        // 疑似HDRする場合
        // outColor = encodePseudoHDR(baseColor);
        return;
    }

    // unlit guard
    // unlit shading model id = 2
    if (1.5 < shadingModelId && shadingModelId < 2.5) {
        resultColor = vec4(emissiveColor, 1.);
        // TODO: unlitの場合って receive shadow なくてもいいよね？
        // #ifdef USE_RECEIVE_SHADOW
        //         vec4 shadowMapProjectionUv = uShadowMapProjectionMatrix * vec4(worldPosition, 1.);
        //         if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
        //             resultColor = applyShadow(resultColor, uShadowMap, shadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
        //         }
        // #endif
        outColor = resultColor;
        return;
    }

    // for debug
    // outColor = vec4(baseColor, 1.);
    // outColor = vec4(baseColor, 1.);
    // outColor = vec4(vec3(metallic), 1.);
    // return;
    // outColor = vec4(vec3(step(1.5, shadingModelId)), 1.);
    // return;

    float aoRate = texture(uAmbientOcclusionTexture, uv).r;
    float sssRate = texture(uScreenSpaceShadowTexture, uv).x;

    // for debug
    // outColor = vec4(worldPosition, 1.);
    // outColor = vec4(vec3(depth), 1.);
    // outColor = vec4(mod(uTime, 1.), 1., 1., 1.);
    // outColor = vec4(uViewPosition, 1.);
    // outColor = vec4(vec3(aoRate), 1.);
    // return;

    Surface surface;
    surface.worldPosition = worldPosition;
    surface.worldNormal = worldNormal;
    surface.baseColor = vec4(baseColor, 1.);

    // TODO: bufferから引っ張ってくる
    surface.specularAmount = .5;

    // phong
    // directional light
    // resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);

    // pbr
    GeometricContext geometry;
    geometry.position = surface.worldPosition;
    geometry.normal = surface.worldNormal;
    geometry.viewDir = normalize(uViewPosition - surface.worldPosition);
    Material material;
    vec3 albedo = baseColor;
    material.baseColor = albedo;
    material.baseColor = mix(albedo, vec3(0.), metallic);// 金属は拡散反射しない
    material.specularColor = mix(vec3(.04), albedo, metallic);// 非金属でも4%は鏡面反射をさせる（多くの不導体に対応）
    material.roughness = roughness;
    material.metallic = metallic;
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.), vec3(0.), vec3(0.), vec3(0.));
    // TODO: なくていい？
    float opacity = 1.;

    IncidentLight directLight;
    float shadow = 0.;

    // TODO: 影を落としたいmaterialとそうじゃないmaterialで出し分けたい
    // TODO: shadow map の枚数
    // #ifdef USE_RECEIVE_SHADOW

    //
    // directional light
    //

    DirectionalLight directionalLight;
    directionalLight.direction = uDirectionalLight.direction;
    directionalLight.color = uDirectionalLight.color;
    directionalLight.intensity = uDirectionalLight.intensity;
    getDirectionalLightIrradiance(directionalLight, geometry, directLight);
    shadow = calcDirectionalLightShadowAttenuation(
        worldPosition,
        surface.worldNormal,
        uDirectionalLight.direction,
        uDirectionalLight.shadowMapProjectionMatrix,
        uDirectionalLightShadowMap,
        uShadowBias,
        vec4(vec3(.02), 1.), // TODO: pass color
        .5 // TODO: pass parameter
    );
    RE_Direct(directLight, geometry, material, reflectedLight, shadow);
    
    //
    // spot light
    //
    SpotLight spotLight;
    // TODO: shadow blend rate は light か何かに持たせたい
    // for(int i = 0; i < MAX_SPOT_LIGHT_COUNT; i++) {
    #pragma UNROLL_START MAX_SPOT_LIGHT_COUNT
        getSpotLightIrradiance(uSpotLight[UNROLL_N], geometry, directLight);
        shadow = calcSpotLightShadowAttenuation(
            worldPosition,
            surface.worldNormal,
            uSpotLight[UNROLL_N].direction,
            uSpotLight[UNROLL_N].shadowMapProjectionMatrix,
            uSpotLightShadowMap[UNROLL_N], // constantな必要がある
            uShadowBias,
            vec4(vec3(.02), 1.), // TODO: pass color
            .65 // TODO: pass parameter
        );
        RE_Direct(directLight, geometry, material, reflectedLight, shadow);
    #pragma UNROLL_END
    // }
 
    //
    // point light
    //

    PointLight pointLight;

    // for(int i = 0; i < MAX_POINT_LIGHT_COUNT; i++) {
    #pragma UNROLL_START MAX_POINT_LIGHT_COUNT
       getPointLightIrradiance(uPointLight[UNROLL_N], geometry, directLight);
       RE_Direct(directLight, geometry, material, reflectedLight, sssRate * .25); // TODO: pass parameter
    #pragma UNROLL_END
    // }

    //
    // ambient light
    //

#ifdef USE_ENV_MAP
    SkyboxLight skyboxLight;
    skyboxLight.diffuseIntensity = uSkybox.diffuseIntensity;
    skyboxLight.specularIntensity = uSkybox.specularIntensity;
    skyboxLight.rotationOffset = uSkybox.rotationOffset;
    skyboxLight.maxLodLevel = uSkybox.maxLodLevel;
    IncidentSkyboxLight directSkyboxLight;
    directSkyboxLight.diffuseDirection = vec3(0.); // minifierでdirectSkyboxLightを消さないtrick
    getSkyboxLightIrradiance(skyboxLight, geometry, directSkyboxLight);
    RE_DirectSkyboxFakeIBL(uSkybox.cubeMap, directSkyboxLight, geometry, material, reflectedLight);
#endif

    //
    // calc render equations
    //

    vec3 outgoingLight =
        reflectedLight.directBase
        + reflectedLight.directSpecular
        + reflectedLight.indirectBase
        + reflectedLight.indirectSpecular
        ;
    resultColor = vec4(outgoingLight, opacity);

    // 遮蔽はそのまま色にかけてしまう
    resultColor.xyz *= aoRate;

    // 自己発光も足す。1より溢れている場合はbloomで光が滲む感じになる
    resultColor.xyz += emissiveColor;
    
    outColor = resultColor;
   
    // TODO: 足したくないが何かがおかしい
    // outColor = resultColor + sssRate;

    // for debug
    // // surface
    // vec3 baseColor = gBufferA.baseColor;
    // float metallic = gBufferC.metallic;
    // float roughness = gBufferC.roughness;
    // vec3 emissiveColor = gBufferD.emissiveColor;
    // float shadingModelId = gBufferB.shadingModelId;
    // vec3 worldNormal = gBufferB.normal * 2. - 1.;
    // float rawDepth = texture(uDepthTexture, uv).r;
    // float depth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);
    // vec4 sssRate = texture(uScreenSpaceShadowTexture, uv);
    // outColor = sssRate;
}
