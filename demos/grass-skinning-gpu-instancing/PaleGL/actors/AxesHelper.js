﻿import {Mesh} from "./Mesh.js";
import {Material} from "../materials/Material.js";
import {parseObj} from "../loaders/loadObj.js";
import {Geometry} from "../geometries/Geometry.js";

const axesHelperGeometryData = `
# Blender 3.3.1
# www.blender.org
o Cube
v 2.000000 0.031250 -0.031250
v 2.000000 -0.031250 -0.031250
v -0.125000 -0.125000 0.125000
v -0.125000 0.125000 0.125000
v 2.000000 0.031250 0.031250
v 2.000000 -0.031250 0.031250
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
v -0.125000 0.125000 -0.125000
v 0.125000 -0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v 0.031250 0.031250 2.000000
v 0.031250 -0.031250 2.000000
v -0.031250 0.031250 2.000000
v -0.031250 -0.031250 2.000000
v -0.031250 2.000000 0.031250
v 0.031250 2.000000 0.031250
v -0.031250 2.000000 -0.031250
v 0.031250 2.000000 -0.031250
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
v 0.125000 -0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v -0.125000 0.125000 0.125000
v 0.125000 0.125000 0.125000
v -0.125000 0.125000 -0.125000
v 0.125000 0.125000 -0.125000
v -0.125000 -0.125000 0.125000
v -0.125000 0.125000 0.125000
v 0.125000 -0.125000 0.125000
v 0.125000 0.125000 0.125000
vn 0.0499 -0.0000 -0.9988
vn -0.9988 0.0499 -0.0000
vn 0.0499 -0.9988 -0.0000
vn 0.0499 -0.0000 0.9988
vn 0.0499 0.9988 -0.0000
vn 1.0000 -0.0000 -0.0000
vn 0.9988 -0.0000 0.0499
vn -0.0000 -0.0000 -1.0000
vn -0.0000 0.9988 0.0499
vn -0.0000 -0.9988 0.0499
vn -0.0000 -0.0000 1.0000
vn -0.9988 -0.0000 0.0499
vn -0.0000 -1.0000 -0.0000
vn -0.0000 1.0000 -0.0000
vn -0.0000 0.0499 0.9988
vn 0.9988 0.0499 -0.0000
vn -0.0000 0.0499 -0.9988
vn -1.0000 -0.0000 -0.0000
vt 0.114221 0.031000
vt 0.179909 0.031000
vt 0.081377 0.739333
vt 0.147065 0.031000
vt 0.114221 0.656000
vt 0.081377 0.656000
vt 0.311911 0.000000
vt 0.441550 0.000000
vt 0.409140 0.000000
vt 0.657406 0.000000
vt 0.592467 0.000000
vt 0.376730 0.000000
vt 0.048533 0.656000
vt 0.147065 0.031000
vt 0.048533 0.739333
vt 0.048533 0.656000
vt 0.081377 0.656000
vt 0.409140 0.625000
vt 0.081377 0.031000
vt 0.344321 0.000000
vt 0.048533 0.031000
vt 0.344321 0.000000
vt 0.592467 0.000000
vt 0.147065 0.656000
vt 0.376730 0.625000
vt 0.689875 0.000000
vt 0.559997 0.000000
vt 0.657406 0.000000
vt 0.147065 0.656000
vt 0.114221 0.031000
vt 0.179909 0.656000
vt 0.114221 0.656000
vt 0.624936 0.000000
vt 0.376730 0.000000
vt 0.344321 0.625000
vt 0.344321 0.708333
vt 0.409140 0.000000
vt 0.344321 0.625000
vt 0.376730 0.625000
vt 0.311911 0.708333
vt 0.409140 0.625000
vt 0.311911 0.625000
vt 0.441550 0.625000
vt 0.657406 0.708333
vt 0.592467 0.625000
vt 0.657406 0.625000
vt 0.624936 0.708333
vt 0.689875 0.625000
vt 0.592467 0.625000
vt 0.559997 0.625000
vt 0.657406 0.625000
vt 0.624936 0.625000
vt 0.114221 0.656000
vt 0.114221 0.739333
vt 0.081377 0.656000
vt 0.081377 0.739333
vt 0.657406 0.708333
vt 0.689875 0.708333
vt 0.657406 0.625000
vt 0.689875 0.625000
vt 0.376730 0.625000
vt 0.376730 0.708333
vt 0.344321 0.625000
vt 0.344321 0.708333
s 0
f 11/32/1 2/4/1 10/29/1
f 4/11/2 18/50/2 9/27/2
f 10/30/3 6/17/3 7/19/3
f 7/19/4 5/13/4 8/21/4
f 8/24/5 1/2/5 11/31/5
f 2/6/6 5/15/6 6/16/6
f 8/25/7 13/37/7 7/18/7
f 31/64/8 28/61/8 29/62/8
f 4/12/9 12/35/9 8/22/9
f 7/20/10 15/42/10 3/7/10
f 13/38/11 14/40/11 15/42/11
f 3/8/12 14/41/12 4/9/12
f 26/59/13 25/58/13 24/57/13
f 17/47/14 18/51/14 16/44/14
f 8/26/15 16/46/15 4/10/15
f 11/33/16 17/49/16 8/23/16
f 9/28/17 19/52/17 11/33/17
f 23/56/18 20/53/18 21/54/18
f 11/32/1 1/1/1 2/4/1
f 4/11/2 16/45/2 18/50/2
f 10/30/3 2/5/3 6/17/3
f 7/19/4 6/17/4 5/13/4
f 8/24/5 5/14/5 1/2/5
f 2/6/6 1/3/6 5/15/6
f 8/25/7 12/34/7 13/37/7
f 31/64/8 30/63/8 28/61/8
f 4/12/9 14/39/9 12/35/9
f 7/20/10 13/38/10 15/42/10
f 13/38/11 12/36/11 14/40/11
f 3/8/12 15/43/12 14/41/12
f 26/59/13 27/60/13 25/58/13
f 17/47/14 19/52/14 18/51/14
f 8/26/15 17/48/15 16/46/15
f 11/33/16 19/52/16 17/49/16
f 9/28/17 18/51/17 19/52/17
f 23/56/18 22/55/18 20/53/18
`;

export class AxesHelper extends Mesh {
    constructor({ gpu }) {
        const objData = parseObj(axesHelperGeometryData);
        const geometry = new Geometry({
            gpu,
            attributes: [
                {
                    name: "position",
                    data: objData.positions,
                    size: 3
                }, {
                    name: "uv",
                    data: objData.uvs,
                    size: 2
                }
            ],
            indices: objData.indices,
            drawCount: objData.indices.length
        });
        console.log("geom", geometry)
        const material = new Material({
            gpu,
            vertexShader: `#version 300 es
            layout (location = 0) in vec3 aPosition;
            layout (location = 1) in vec2 aUv;
            uniform mat4 uWorldMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            out vec2 vUv;
            void main() {
                vUv = aUv;
                gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
            }
            `,
            fragmentShader: `#version 300 es
            precision mediump float;
            in vec2 vUv;
            out vec4 outColor;
            void main() {
                vec3 color = vec3(1., 0., 0.);
                if(vUv.x > .5) {
                    color = vec3(0., 1., 0.);
                } else if(vUv.x > .25) {
                    color = vec3(0., 0., 1.);
                }
                outColor = vec4(color, 1.);
            }
            `,
        });
        super({ geometry, material });
    }
}