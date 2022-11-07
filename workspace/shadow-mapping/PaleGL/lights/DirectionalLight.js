﻿import {Light} from "./Light.js";
import {OrthographicCamera} from "../core/OrthographicCamera.js";
import {PerspectiveCamera} from "../core/PerspectiveCamera.js";
import {Vector3} from "../math/Vector3.js";

export class DirectionalLight extends Light {
    constructor() {
        super();

        this.shadowCamera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1);
        // ライトが向いている方向と逆を向かせたいので(projectionの過程でz軸が逆になるから)
        this.shadowCamera.transform.setRotationY(180);
        this.shadowCamera.visibleFrustum = true;
        this.addChild(this.shadowCamera);
    }
  
    setSize(width, height) {
    }
   
    // TODO: shadow map のサイズに応じてorthoのサイズ調整すべき？
    setShadowSize(width, height, near, far) {
        this.shadowCamera.setSize(-width, width, -height, height);
        this.shadowCamera.near = near;
        this.shadowCamera.far = far;
    }
    
    afterUpdatedTransform() {
        super.afterUpdatedTransform();
        this.shadowCamera.near = 1;
        this.shadowCamera.far = 10;
        this.shadowCamera.setSize(1, 1, -5, 5, -5, 5);
        const frustumWorldPositions = this.shadowCamera.getFrustumWorldPositions();
    }
}