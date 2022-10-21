﻿import {Camera} from "./Camera.js";
import {Matrix4} from "../Math/Matrix4.js";

export class PerspectiveCamera extends Camera {
    fov;
    aspect;
    near;
    far;
    
    constructor(fov, aspect, near, far) {
        super();
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.#updateProjectionMatrix(aspect);
    }
    
    setSize(width, height) {
        this.#updateProjectionMatrix(width / height);
    }
    
    #updateProjectionMatrix(aspect) {
        this.aspect = aspect;
        this.projectionMatrix = Matrix4.getPerspectiveMatrix(this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    }
  
    updateTransform() {
        super.updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
    }
}