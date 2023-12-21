#version 300 es

precision mediump float;

#pragma DEFINES

#include ./partial/raymarch-distance-functions.glsl
#include ./partial/alpha-test-functions.glsl

uniform vec4 uColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;
uniform vec3 uViewPosition;

#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif

in vec2 vUv;
in vec3 vWorldPosition;

#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif

out vec4 outColor;

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    vec4 diffuseColor = vec4(0.);

#ifdef USE_VERTEX_COLOR
    diffuseColor = vVertexColor * uColor * diffuseMapColor;
#else
    diffuseColor = uColor * diffuseMapColor;
#endif   



    //
    // NOTE: raymarch block
    //

    vec3 rayOrigin = vWorldPosition;
    vec3 rayDirection = normalize(vWorldPosition - uViewPosition);
    float distance = 0.;
    float accLen = 0.;
    vec3 currentRayPosition = rayOrigin;
    float minDistance = .001;
    for(int i = 0; i < 64; i++) {
        currentRayPosition = rayOrigin + rayDirection * accLen;
        distance = sphere(currentRayPosition - vec3(0., 1., 0.), 1.);
        accLen += distance;
        if(distance < minDistance) {
            break;
        }
    }
    if(distance >= minDistance) {
        discard;
    }

    //
    // NOTE: end raymarch block
    //
    
    
    float alpha = diffuseColor.a; // TODO: base color を渡して alpha をかける

#include ./partial/alpha-test-calc.glsl

    outColor = vec4(1., 1., 1., 1.);
}
