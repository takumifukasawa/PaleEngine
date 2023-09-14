﻿#version 300 es

//
// ref: https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
//
            
precision mediump float;

#include ./partial/depth-functions.glsl

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform float uFocusDistance;
uniform float uFocusRange;
uniform mat4 uInverseProjectionMatrix;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    float rawDepth = texture(uDepthTexture, vUv).r;
    float eyeDepth = perspectiveDepthToEyeDepth(rawDepth, uNearClip, uFarClip);
    
    // float coc = (depth - uFocusDistance) / uFocusRange;
    float coc = (eyeDepth - uFocusDistance) / uFocusRange;
    coc = clamp(coc, -1., 1.);
    
    // check negative coc
    // if(coc < 0.) {
    //     outColor = vec4(-coc, 0., 0., 1.);
    //     return;
    // }

    // for debug
    // outColor = sceneColor;
    
    outColor = vec4(vec3(coc), 1.);
}           
