vec2 dfScene(vec3 pos) {
    vec3 p = opRepeat(pos, 4.);
    float d = dfSphere(p, .25);
    // float distance = dfRoundBox(p, .25, .01);
    return vec2(d, 0.);
}
