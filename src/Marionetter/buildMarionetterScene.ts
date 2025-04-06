import {createVector3, createVector3FromRaw} from '@/PaleGL/math/vector3';
import {createQuaternion, Quaternion, qw, qx, qy, qz} from '@/PaleGL/math/quaternion.ts';
import {
    MarionetterCameraComponentInfo,
    MarionetterComponentType,
    MarionetterDirectionalLightComponentInfo,
    MarionetterLightComponentInfo,
    MarionetterMeshFilterComponentInfo,
    MarionetterMeshRendererComponentInfo,
    MarionetterObjectInfo,
    MarionetterObjectMoveAndLookAtControllerComponentInfo,
    MarionetterPlayableDirectorComponentInfo,
    MarionetterScene,
    MarionetterSceneStructure,
    MarionetterSpotLightComponentInfo,
    MarionetterTimeline,
    // ORIGINAL
    // MarionetterVolumeComponentInfo,
    // MarionetterVolumeLayerBloom,
    // MarionetterVolumeLayerDepthOfField,
} from '@/Marionetter/types';
import { buildMarionetterTimeline } from '@/Marionetter/timeline.ts';
import { ActorTypes, LightTypes } from '@/PaleGL/constants.ts';
import {Actor, addActorComponent, addChildActor, createActor} from "@/PaleGL/actors/actor.ts";
import {Light} from "@/PaleGL/actors/lights/light.ts";
import {Gpu} from "@/PaleGL/core/gpu.ts";
import {Geometry} from "@/PaleGL/geometries/geometry.ts";
import {Material} from "@/PaleGL/materials/material.ts";
import {createBoxGeometry} from "@/PaleGL/geometries/boxGeometry.ts";
import {createPlaneGeometry} from "@/PaleGL/geometries/planeGeometry.ts";
import {createGBufferMaterial} from "@/PaleGL/materials/gBufferMaterial.ts";
import {createColorFromHex} from "@/PaleGL/math/color.ts";
import {createMesh} from "@/PaleGL/actors/meshes/mesh.ts";
import {createPerspectiveCamera} from "@/PaleGL/actors/cameras/perspectiveCamera.ts";
import {createDirectionalLight} from "@/PaleGL/actors/lights/directionalLight.ts";
import {createSpotLight} from "@/PaleGL/actors/lights/spotLight.ts";
import {setRotation, setScaling} from "@/PaleGL/core/transform.ts";
import {createRotatorFromQuaternion} from "@/PaleGL/math/rotator.ts";
import {createObjectMoveAndLookAtController} from "@/PaleGL/components/objectMoveAndLookAtController.ts";
// // ORIGINAL
// // import { PostProcessPassType } from '@/PaleGL/constants.ts';
// import { Light } from '@/PaleGL/actors/Light.ts';
// // ORIGINAL
// // import { generateDefaultBloomPassParameters } from '@/PaleGL/postprocess/BloomPass.ts';
// // import { maton } from '@/PaleGL/utilities/maton.ts';
// // import { PostProcessVolume } from '@/PaleGL/actors/PostProcessVolume.ts';
// // import { generateDepthOfFieldPassParameters } from '@/PaleGL/postprocess/DepthOfFieldPass.ts';

// import { createObjectMoveAndLookAtController } from '@/PaleGL/components/objectMoveAndLookAtController.ts';

export function tryParseJsonString<T>(str: string) {
    let json: T | null = null;
    try {
        json = JSON.parse(str) as T;
    } catch (e) {
        console.error('Failed to parse JSON string');
    }
    return json;
}

export function resolveInvertRotationLeftHandAxisToRightHandAxis(
    q: Quaternion,
    actor: Actor,
    needsFlip: boolean
): Quaternion {
    if (!needsFlip) {
        return q;
    }

    // quaternionの反転が必要ならケースを列挙
    if (actor.type == ActorTypes.Light) {
        const light = actor as Light;
        if (light.lightType === LightTypes.Spot) {
            // NOTE: なぜか逆にしないといけない
            const x1 = qx(q);
            const y1 = qy(q);
            const z1 = qz(q);
            const w1 = qw(q);
            const x2 = 1;
            const y2 = 0;
            const z2 = 0;
            const w2 = 0;
            const w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
            const x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
            const y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
            const z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;
            return createQuaternion(x, y, z, w);
        }
    }

    return q;
}

function findMarionetterComponent<T>(obj: MarionetterObjectInfo, componentType: MarionetterComponentType): T | null {
    return (obj.co.find((c) => c.t === componentType) as T) || null;
}

// ORIGINAL
// function buildPostProcessVolumeActor({
//     name,
//     volumeComponent,
// }: {
//     name: string;
//     volumeComponent: MarionetterVolumeComponentInfo;
// }) {
//     console.log(volumeComponent);
//     const parameters = maton(
//         volumeComponent.vl.map((volumeLayer) => {
//             switch (volumeLayer.l) {
//                 case 'Bloom':
//                     const bloomLayer = volumeLayer as MarionetterVolumeLayerBloom;
//                     return {
//                         type: PostProcessPassType.Bloom,
//                         parameters: generateDefaultBloomPassParameters({
//                             bloomAmount: bloomLayer.bl_i,
//                         }),
//                     };
//                 case 'DepthOfField':
//                     const depthOfFieldLayer = volumeLayer as MarionetterVolumeLayerDepthOfField;
//                     return {
//                         type: PostProcessPassType.DepthOfField,
//                         parameters: generateDepthOfFieldPassParameters({
//                             focusDistance: depthOfFieldLayer.dof_fd,
//                         }),
//                     };
//                 default:
//                     return null;
//             }
//         })
//     )
//         .compact()
//         .value();
//     return new PostProcessVolume({ name, parameters });
// }

/**
 *
 * @param gpu
 * @param scene
 */
export function buildMarionetterScene(
    gpu: Gpu,
    marionetterScene: MarionetterScene
    // placedScene: Scene
): MarionetterSceneStructure {
    const actors: Actor[] = [];

    function recursiveBuildActor(
        obj: MarionetterObjectInfo,
        parentActor: Actor | null = null,
        needsFlip: boolean = false
    ) {
        const name = obj.n;
        const mfComponent = findMarionetterComponent<MarionetterMeshFilterComponentInfo>(
            obj,
            MarionetterComponentType.MeshFilter
        );
        const mrComponent = findMarionetterComponent<MarionetterMeshRendererComponentInfo>(
            obj,
            MarionetterComponentType.MeshRenderer
        );
        const cameraComponent = findMarionetterComponent<MarionetterCameraComponentInfo>(
            obj,
            MarionetterComponentType.Camera
        );
        const lightComponent = findMarionetterComponent<MarionetterLightComponentInfo>(
            obj,
            MarionetterComponentType.Light
        );
        // ORIGINAL
        // const volumeComponent = findMarionetterComponent<MarionetterVolumeComponentInfo>(
        //     obj,
        //     MarionetterComponentType.Volume
        // );
        const objectMoveAndLookAtControllerComponent =
            findMarionetterComponent<MarionetterObjectMoveAndLookAtControllerComponentInfo>(
                obj,
                MarionetterComponentType.ObjectMoveAndLookAtController
            );

        let actor: Actor | null = null;

        //
        // component情報
        //

        if (mrComponent && mfComponent) {
            const meshFilter = mfComponent;
            const meshRenderer = mrComponent;

            let geometry: Geometry | null = null;
            let material: Material | null = null;

            // build geometry
            switch (meshFilter.mn) {
                case 'Cube':
                    geometry = createBoxGeometry({ gpu });
                    break;
                case 'Quad':
                    geometry = createPlaneGeometry({ gpu, width: 1, height: 1 });
                    break;
            }

            // build material
            switch (meshRenderer.mn) {
                case 'Lit':
                    const m = meshRenderer.m;
                    material = createGBufferMaterial({
                        baseColor: createColorFromHex(m.c),
                        metallic: m.m,
                        roughness: m.r,
                        receiveShadow: !!m.rs,
                    });
                    break;
                default:
                    // TODO: fallback
                    material = createGBufferMaterial({});
                    break;
            }

            if (geometry && material) {
                actor = createMesh({ name, geometry, material });
            }
        } else if (cameraComponent) {
            const camera = cameraComponent;
            if (camera.ct === 'Perspective') {
                // TODO: near, far を受け取りたい
                actor = createPerspectiveCamera(camera.f, 1, 0.1, 1000, name);
            } else {
                console.error(`[buildMarionetterActors] invalid camera type: ${camera.ct}`);
            }
        } else if (lightComponent) {
            // light
            const light = lightComponent;
            switch (light.l) {
                case 'Directional':
                    const directionalLightInfo = light as MarionetterDirectionalLightComponentInfo;
                    actor = createDirectionalLight({
                        name,
                        intensity: directionalLightInfo.i,
                        color: createColorFromHex(directionalLightInfo.c),
                    });
                    break;
                case 'Spot':
                    // TODO: デフォルト値を渡してるのはよくない
                    const spotLightInfo = light as MarionetterSpotLightComponentInfo;
                    actor = createSpotLight({
                        name,
                        color: createColorFromHex(spotLightInfo.c),
                        intensity: spotLightInfo.i,
                        distance: spotLightInfo.r,
                        coneAngle: spotLightInfo.sa,
                        penumbraAngle: spotLightInfo.isa,
                    });
                    break;
                default:
                    console.error(`[buildMarionetterActors] invalid light type: ${light.l}`);
            }
            // ORIGINAL: volumeも一旦生のactorとみなす
            // } else if (volumeComponent) {
            //     actor = buildPostProcessVolumeActor({ name, volumeComponent });
        } else {
            // others
            actor = createActor({ name });
        }

        //
        // component関連
        //

        if (objectMoveAndLookAtControllerComponent) {
            const objectMoveAndLookAdController = createObjectMoveAndLookAtController({
                localPosition: createVector3FromRaw(objectMoveAndLookAtControllerComponent.lp),
                lookAtTargetName: objectMoveAndLookAtControllerComponent.tn,
            });
            if (actor) {
            addActorComponent(actor, objectMoveAndLookAdController);
            }
        }

        //
        // transform情報
        //

        if (actor) {
            // actors.push(actor);
            setScaling(actor.transform, createVector3(obj.t.ls.x, obj.t.ls.y, obj.t.ls.z));
            // euler ver
            // actor.transform.rotation.setV(
            //     new Vector3(obj.transform.localRotation.x, obj.transform.localRotation.y, obj.transform.localRotation.z)
            // );
            // quaternion ver
            // const q = new Quaternion(
            //     obj.transform.localRotation.x,
            //     obj.transform.localRotation.y,
            //     obj.transform.localRotation.z,
            //     obj.transform.localRotation.w
            // );
            // console.log('hogehoge', obj.transform.localRotation, q, q.toEulerDegree());
            // if (needsSomeActorsConvertLeftHandAxisToRightHandAxis) {
            // } else {
            // }
            // actor.transform.rotation = Rotator.fromQuaternion(
            //     new Quaternion(
            //         obj.transform.localRotation.x,
            //         obj.transform.localRotation.y,
            //         obj.transform.localRotation.z,
            //         obj.transform.localRotation.w
            //     )
            // );
            setRotation(actor.transform, createRotatorFromQuaternion(
                resolveInvertRotationLeftHandAxisToRightHandAxis(
                    createQuaternion(obj.t.lr.x, obj.t.lr.y, obj.t.lr.z, obj.t.lr.w),
                    actor,
                    needsFlip
                )
            ));
            actor.transform.position = createVector3(obj.t.lp.x, obj.t.lp.y, obj.t.lp.z);

            // 親が存在する場合は親に追加、親がない場合はシーン直下に配置したいので配列に追加
            if (parentActor) {
                addChildActor(parentActor, actor);
            } else {
                actors.push(actor);
            }

            // 子要素があれば再帰的に処理
            for (let i = 0; i < obj.ch.length; i++) {
                recursiveBuildActor(obj.ch[i], actor, needsFlip);
            }

            return;
        }

        console.error(`[recursiveBuildActor] actor is null - name: ${obj.n}`);
    }

    //
    // parse scene
    //

    for (let i = 0; i < marionetterScene.o.length; i++) {
        const obj = marionetterScene.o[i];
        // recursiveBuildActor(obj, null, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
        recursiveBuildActor(obj, null, true);
        // actors.push(actor);
    }

    // scene.objects.forEach((obj) => {
    //     const actor = recursiveBuildActor(obj, null, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
    //     actors.push(actor);
    // });

    //
    // parse timeline
    // NOTE: timelineは一個という想定
    //
    const marionetterTimeline = buildMarionetterTimelineFromScene(
        marionetterScene,
        actors
        // placedScene
    );

    return { actors, marionetterTimeline };
}

export function buildMarionetterTimelineFromScene(
    marionetterScene: MarionetterScene,
    marionetterSceneActors: Actor[]
    // placedScene: Scene
): MarionetterTimeline | null {
    let marionetterTimeline: MarionetterTimeline | null = null;
    marionetterScene.o.forEach((obj) => {
        const timelineComponent = obj.co.find((c) => c.t === MarionetterComponentType.PlayableDirector);
        if (timelineComponent) {
            marionetterTimeline = buildMarionetterTimeline(
                marionetterSceneActors,
                timelineComponent as MarionetterPlayableDirectorComponentInfo
                // placedScene
                // needsSomeActorsConvertLeftHandAxisToRightHandAxis
            );
        }
    });
    return marionetterTimeline;
}
