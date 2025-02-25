﻿import {
    Camera,
    createCamera,
    FrustumVectors,
    GetFrustumVectorsFunc,
    setCameraSize,
    UpdateProjectionMatrixFunc,
} from '@/PaleGL/actors/camera.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.js';
import { CameraTypes } from '@/PaleGL/constants';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { updateProjectionMatrix } from '@/PaleGL/actors/cameraBehaviours.ts';
import { setSizeActor, SetSizeActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';

// export class PerspectiveCamera extends Camera {
//     fov: number; // degree
//     aspect: number = 1; // w / h
//     fixedAspect: boolean = false;
//
//     constructor(fov: number, aspect: number, near: number, far: number, name?: string) {
//         super({ name, cameraType: CameraTypes.Perspective });
//         this.fov = fov;
//         this.aspect = aspect; // TODO: setSizeを呼ぶ必要がある
//         this.near = near;
//         this.far = far;
//         // TODO: いらないはず
//         // this.setSize(aspect);
//         this.setPerspectiveSize(aspect);
//         // TODO: set width
//     }
//
//     /**
//      *
//      * @param aspect
//      */
//     setPerspectiveSize(aspect: number) {
//         this.aspect = aspect;
//         this.updateProjectionMatrix();
//         // this.setSize(width, height);
//     }
//
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         super.setSize(width, height);
//         // this.aspect = width / height;
//         if (!this.fixedAspect) {
//             this.setPerspectiveSize(width / height);
//         }
//         // this.#updateProjectionMatrix();
//     }
//
//     /**
//      *
//      */
//     updateProjectionMatrix() {
//         this.projectionMatrix = Matrix4.getPerspectiveMatrix(
//             (this.fov * Math.PI) / 180,
//             this.aspect,
//             this.near,
//             this.far
//         );
//     }
//
//     getFrustumLocalPositions(): FrustumVectors {
//         const localForward = Vector3.back;
//         const localRight = Vector3.right;
//         const localUp = Vector3.up;
//
//         const tan = ((this.fov / 2) * Math.PI) / 180;
//
//         const nearHalfHeight = this.near * tan;
//         const nearHalfWidth = nearHalfHeight * this.aspect;
//         const farHalfHeight = this.far * tan;
//         const farHalfWidth = farHalfHeight * this.aspect;
//
//         const nearClipCenter = localForward.clone().scale(this.near);
//         const farClipCenter = localForward.clone().scale(this.far);
//
//         const nearClipRightOffset = localRight.clone().scale(nearHalfWidth);
//         const nearClipUpOffset = localUp.clone().scale(nearHalfHeight);
//
//         const farClipRightOffset = localRight.clone().scale(farHalfWidth);
//         const farClipUpOffset = localUp.clone().scale(farHalfHeight);
//
//         const nearLeftTop = Vector3.addVectors(nearClipCenter, nearClipRightOffset.clone().negate(), nearClipUpOffset);
//         const nearRightTop = Vector3.addVectors(nearClipCenter, nearClipRightOffset, nearClipUpOffset);
//
//         const nearLeftBottom = Vector3.addVectors(
//             nearClipCenter,
//             nearClipRightOffset.clone().negate(),
//             nearClipUpOffset.clone().negate()
//         );
//
//         const nearRightBottom = Vector3.addVectors(
//             nearClipCenter,
//             nearClipRightOffset,
//             nearClipUpOffset.clone().negate()
//         );
//
//         const farLeftTop = Vector3.addVectors(farClipCenter, farClipRightOffset.clone().negate(), farClipUpOffset);
//
//         const farRightTop = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset);
//
//         const farLeftBottom = Vector3.addVectors(
//             farClipCenter,
//             farClipRightOffset.clone().negate(),
//             farClipUpOffset.clone().negate()
//         );
//
//         const farRightBottom = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset.clone().negate());
//
//         return {
//             nlt: nearLeftTop,
//             nrt: nearRightTop,
//             nlb: nearLeftBottom,
//             nrb: nearRightBottom,
//             flt: farLeftTop,
//             frt: farRightTop,
//             flb: farLeftBottom,
//             frb: farRightBottom,
//         };
//     }
// }

export type PerspectiveCamera = Camera & {
    fov: number; // degree
    aspect: number; // w  /h
    fixedAspect: boolean;
};

export function createPerspectiveCamera(fov: number, aspect: number, near: number, far: number, name?: string) {
    const camera = createCamera({ name, cameraType: CameraTypes.Perspective });

    const fixedAspect: boolean = false;

    // setCameraPerspectiveSize(camera, aspect);

    const perspectiveCamera: PerspectiveCamera = {
        ...camera,
        fov,
        aspect, // w  /h
        fixedAspect,
        near,
        far,
        // // overrides
        // setSize,
        // updateProjectionMatrix,
        // getFrustumLocalPositions,
        // getFrustumWorldPositions,
    };

    updateProjectionMatrix(perspectiveCamera);

    return perspectiveCamera;
}

export const updatePerspectiveCameraProjectionMatrix: UpdateProjectionMatrixFunc = (camera: Camera) => {
    const perspectiveCamera = camera as PerspectiveCamera;
    perspectiveCamera.projectionMatrix = Matrix4.getPerspectiveMatrix(
        (perspectiveCamera.fov * Math.PI) / 180,
        perspectiveCamera.aspect,
        perspectiveCamera.near,
        perspectiveCamera.far
    );
};

export const setSizePerspectiveCamera: SetSizeActorFunc = (actor: Actor, width: number, height: number) => {
    setSizeActor(actor, width, height);

    const camera = actor as PerspectiveCamera;
    setCameraSize(camera, width, height);
    // this.aspect = width / height;
    if (!camera.fixedAspect) {
        camera.aspect = width / height;
        updateProjectionMatrix(camera);
    }
    // this.#updateProjectionMatrix();
};

export const getPerspectiveFrustumLocalPositions: GetFrustumVectorsFunc = (camera: Camera): FrustumVectors | null => {
    const perspectiveCamera = camera as PerspectiveCamera;

    const localForward = Vector3.back;
    const localRight = Vector3.right;
    const localUp = Vector3.up;

    const tan = ((perspectiveCamera.fov / 2) * Math.PI) / 180;

    const nearHalfHeight = camera.near * tan;
    const nearHalfWidth = nearHalfHeight * perspectiveCamera.aspect;
    const farHalfHeight = camera.far * tan;
    const farHalfWidth = farHalfHeight * perspectiveCamera.aspect;

    const nearClipCenter = localForward.clone().scale(camera.near);
    const farClipCenter = localForward.clone().scale(camera.far);

    const nearClipRightOffset = localRight.clone().scale(nearHalfWidth);
    const nearClipUpOffset = localUp.clone().scale(nearHalfHeight);

    const farClipRightOffset = localRight.clone().scale(farHalfWidth);
    const farClipUpOffset = localUp.clone().scale(farHalfHeight);

    const nearLeftTop = Vector3.addVectors(nearClipCenter, nearClipRightOffset.clone().negate(), nearClipUpOffset);
    const nearRightTop = Vector3.addVectors(nearClipCenter, nearClipRightOffset, nearClipUpOffset);

    const nearLeftBottom = Vector3.addVectors(
        nearClipCenter,
        nearClipRightOffset.clone().negate(),
        nearClipUpOffset.clone().negate()
    );

    const nearRightBottom = Vector3.addVectors(nearClipCenter, nearClipRightOffset, nearClipUpOffset.clone().negate());

    const farLeftTop = Vector3.addVectors(farClipCenter, farClipRightOffset.clone().negate(), farClipUpOffset);

    const farRightTop = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset);

    const farLeftBottom = Vector3.addVectors(
        farClipCenter,
        farClipRightOffset.clone().negate(),
        farClipUpOffset.clone().negate()
    );

    const farRightBottom = Vector3.addVectors(farClipCenter, farClipRightOffset, farClipUpOffset.clone().negate());

    return {
        nlt: nearLeftTop,
        nrt: nearRightTop,
        nlb: nearLeftBottom,
        nrb: nearRightBottom,
        flt: farLeftTop,
        frt: farRightTop,
        flb: farLeftBottom,
        frb: farRightBottom,
    };
};

export const setPerspectiveSize = (perspectiveCamera: PerspectiveCamera, aspect: number) => {
    perspectiveCamera.aspect = aspect;
    updateProjectionMatrix(perspectiveCamera);
};
// -------------------------------------------------------
