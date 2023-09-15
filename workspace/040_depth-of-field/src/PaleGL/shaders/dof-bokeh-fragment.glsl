﻿#version 300 es

//
// ref: https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
//
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
// uniform sampler2D uCocTexture;
// uniform float uSrcTextureWidth;
// uniform float uSrcTextureHeight;
uniform vec2 uTexelSize;
uniform float uBokehRadius;

#define BOKEH_KERNEL_MEDIUM

#if defined(BOKEH_KERNEL_SMALL)

// ref: https://github.com/Unity-Technologies/PostProcessing/blob/v2/PostProcessing/Shaders/Builtins/DiskKernels.hlsl
const int kernelSampleCount = 16;
const vec2[kernelSampleCount] kernel = vec2[](
	vec2(0, 0),
	vec2(0.54545456, 0),
	vec2(0.16855472, 0.5187581),
	vec2(-0.44128203, 0.3206101),
	vec2(-0.44128197, -0.3206102),
	vec2(0.1685548, -0.5187581),
	vec2(1, 0),
	vec2(0.809017, 0.58778524),
	vec2(0.30901697, 0.95105654),
	vec2(-0.30901703, 0.9510565),
	vec2(-0.80901706, 0.5877852),
	vec2(-1, 0),
	vec2(-0.80901694, -0.58778536),
	vec2(-0.30901664, -0.9510566),
	vec2(0.30901712, -0.9510565),
	vec2(0.80901694, -0.5877853)
);

#elif defined (BOKEH_KERNEL_MEDIUM)

const int kernelSampleCount = 22;
const vec2[kernelSampleCount] kernel = vec2[](
	vec2(0, 0),
	vec2(0.53333336, 0),
	vec2(0.3325279, 0.4169768),
	vec2(-0.11867785, 0.5199616),
	vec2(-0.48051673, 0.2314047),
	vec2(-0.48051673, -0.23140468),
	vec2(-0.11867763, -0.51996166),
	vec2(0.33252785, -0.4169769),
	vec2(1, 0),
	vec2(0.90096885, 0.43388376),
	vec2(0.6234898, 0.7818315),
	vec2(0.22252098, 0.9749279),
	vec2(-0.22252095, 0.9749279),
	vec2(-0.62349, 0.7818314),
	vec2(-0.90096885, 0.43388382),
	vec2(-1, 0),
	vec2(-0.90096885, -0.43388376),
	vec2(-0.6234896, -0.7818316),
	vec2(-0.22252055, -0.974928),
	vec2(0.2225215, -0.9749278),
	vec2(0.6234897, -0.7818316),
	vec2(0.90096885, -0.43388376)
);
#endif

float weight(float coc, float radius) {
    // return coc >= radius ? 1. : 0.;
    return clamp((coc - radius + 2.) / 2., 0., 1.);
}

void main() {
    vec4 srcColor = texture(uSrcTexture, vUv);

    // vec3 color = vec3(0.);
    // float weight = 0.;
    
    vec2 texelSize = uTexelSize;
   
    // // 1. rectangle sample 
    // for(int u = -4; u <= 4; u++) {
    //     for(int v = -4; v <= 4; v++) {
    //         vec2 kernelTexelUv = vec2(u, v);
    //         vec2 offset = kernelTexelUv * texelSize * 2.;
    //         vec2 uv = vUv + offset;
    //         color += texture(uSrcTexture, uv).rgb;
    //     }
    // }
    // color /= 81.;
  
    // // 2. circular sample 
    // for(int u = -4; u <= 4; u++) {
    //     for(int v = -4; v <= 4; v++) {
    //         vec2 kernelTexelUv = vec2(u, v);
    //         if(length(kernelTexelUv) <= 4.) {
    //             kernelTexelUv *= texelSize * 4.;
    //             vec2 uv = vUv + kernelTexelUv;
    //             color += texture(uSrcTexture, uv).rgb;
    //             weight += 1.;
    //         }
    //     }
    // }
    // color *= 1. / weight;
 
    // // 3. kernel sample
    // for(int k = 0; k < kernelSampleCount; k++) {
    //     vec2 kernelTexelUv = kernel[k];
    //     if(length(kernelTexelUv) <= 4.) {
    //         kernelTexelUv *= texelSize * 8.;
    //         vec2 uv = vUv + kernelTexelUv;
    //         color += texture(uSrcTexture, uv).rgb;
    //         weight += 1.;
    //     }
    // }
    // color *= 1. / float(kernelSampleCount);

    vec3 bgColor = vec3(0.);
    vec3 fgColor = vec3(0.);
    float bgWeight = 0.;
    float fgWeight = 0.;
 
    float coc = texture(uSrcTexture, vUv).a;
    // coc = texture(uSrcTexture, vUv).r;
    // outColor = vec4(vec3(coc), 1.);
    // outColor = vec4(texture(uSrcTexture, vUv).a, 1., 1., 1.);
    // return;
  
    // 4. kernel sample
    for(int k = 0; k < kernelSampleCount; k++) {
        vec2 o = kernel[k] * uBokehRadius;
        float radius = length(o);
        o *= texelSize;
        vec4 s = texture(uSrcTexture, vUv + o);
        
        float bgw = weight(max(0., min(s.a, coc)), radius);
        bgColor += s.rgb * bgw;
        bgWeight += bgw;
        
        float fgw = weight(-s.a, radius);
        fgColor += s.rgb * fgw;
        fgWeight += fgw;
        
        // float sw = checkWeight(abs(s.a), radius);
        // color += s.rgb * sw;
        // weight += sw;
        // if(abs(s.a) >= radius) {
        //     color += s.rgb;
        //     weight += 1.;
        // }
    }
   
    bgColor *= vec3(1.) / (bgWeight + (bgWeight == 0. ? 1. : 0.)); 
    fgColor *= vec3(1.) / (fgWeight + (fgWeight == 0. ? 1. : 0.));
    float bgfg = min(1., fgWeight * 3.141592 / float(kernelSampleCount));
    
    vec3 color = mix(bgColor, fgColor, bgfg);
    
    outColor = vec4(color, bgfg);
    
    // for debug
    // outColor = srcColor;
    // outColor = vec4(vec3(coc), 1.);
    
    // if(coc < 0.) {
    //     outColor = vec4(1., 0., 0., 1.);
    // }
}           
