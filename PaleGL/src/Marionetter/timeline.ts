import { curveUtilityEvaluateCurve } from '@/Marionetter/curveUtilities.ts';
import {
    copyVector3,
    createVector3One,
    createVector3Zero, negateVector3,
    setV3x,
    setV3y,
    setV3z, v3x, v3y, v3z,
    Vector3
} from '@/PaleGL/math/vector3.ts';
import {Actor, getActorComponent} from '@/PaleGL/actors/actor.ts';
import { Light } from '@/PaleGL/actors/lights/light.ts';
import {findActorByName, Scene} from '@/PaleGL/core/scene.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera';
import {
    MarionetterActivationControlClip,
    MarionetterActivationControlClipInfo,
    MarionetterAnimationClip,
    MarionetterAnimationClipInfo,
    MarionetterAnimationClipType,
    MarionetterClipArgs,
    MarionetterClipInfoKinds,
    MarionetterClipInfoType,
    MarionetterClipKinds,
    MarionetterDefaultTrackInfo,
    MarionetterLightControlClip,
    MarionetterLightControlClipInfo,
    MarionetterMarkerTrackInfo,
    MarionetterObjectMoveAndLookAtClip,
    MarionetterObjectMoveAndLookAtClipInfo,
    MarionetterObjectMoveAndLookAtClipInfoProperty,
    MarionetterPlayableDirectorComponentInfo,
    // MarionetterPostProcessBloom,
    // MarionetterPostProcessDepthOfField,
    // MarionetterPostProcessVignette,
    // MarionetterPostProcessVolumetricLight,
    MarionetterSignalEmitter,
    MarionetterTimeline,
    MarionetterTimelineDefaultTrack,
    MarionetterTimelineMarkerTrack,
    MarionetterTimelineSignalEmitter,
    MarionetterTimelineTrackExecuteArgs,
    MarionetterTimelineTrackKinds,
    MarionetterTrackInfoType,
} from '@/Marionetter/types';
import {
    PROPERTY_COLOR_A,
    PROPERTY_COLOR_B,
    PROPERTY_COLOR_G,
    PROPERTY_COLOR_R,
    PROPERTY_FIELD_OF_VIEW,
    PROPERTY_LIGHT_INTENSITY,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_X,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_Y,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_Z,
    PROPERTY_LOCAL_POSITION_X,
    PROPERTY_LOCAL_POSITION_Y,
    PROPERTY_LOCAL_POSITION_Z,
    PROPERTY_LOCAL_SCALE_X,
    PROPERTY_LOCAL_SCALE_Y,
    PROPERTY_LOCAL_SCALE_Z,
    PROPERTY_MATERIAL_BASE_COLOR_A,
    PROPERTY_MATERIAL_BASE_COLOR_B,
    PROPERTY_MATERIAL_BASE_COLOR_G,
    PROPERTY_MATERIAL_BASE_COLOR_R,
    PROPERTY_SPOTLIGHT_RANGE,
} from '@/Marionetter/constants.ts';
import {isTimeInClip} from "@/Marionetter/timelineUtilities.ts";
import {
    postProcessActorTimeline,
    preProcessActorTimeline,
    processActorPropertyBinder
} from "@/PaleGL/actors/actorBehaviours.ts";
import {updateProjectionMatrix} from "@/PaleGL/actors/cameras/cameraBehaviours.ts";
import {
    createRotationXMatrix,
    createRotationYMatrix,
    createRotationZMatrix,
    multiplyMat4Array
} from "@/PaleGL/math/matrix4.ts";
import {ActorTypes, DEG_TO_RAD, LightTypes} from "@/PaleGL/constants.ts";
import {
    createQuaternionIdentity,
    createQuaternionInvertAxis,
    rotationMatrixToQuaternion
} from "@/PaleGL/math/quaternion.ts";
import {createRotator, createRotatorFromQuaternion} from "@/PaleGL/math/rotator.ts";
import {setRotation} from "@/PaleGL/core/transform.ts";
import {
    createColor, getColorA,
    getColorB,
    getColorG,
    getColorR,
    setColorA,
    setColorB,
    setColorG,
    setColorR
} from "@/PaleGL/math/color.ts";
import {SpotLight} from "@/PaleGL/actors/lights/spotLight.ts";
import {ObjectMoveAndLookAtController} from "@/PaleGL/components/objectMoveAndLookAtController.ts";


// import { resolveInvertRotationLeftHandAxisToRightHandAxis } from '@/Marionetter/buildMarionetterScene.ts';

/**
 *
 * @param marionetterPlayableDirectorComponentInfo
 */
export function buildMarionetterTimeline(
    marionetterActors: Actor[],
    marionetterPlayableDirectorComponentInfo: MarionetterPlayableDirectorComponentInfo
    // placedScene: Scene
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterTimeline {
    const tracks: MarionetterTimelineTrackKinds[] = [];

    // for debug
    // console.log(
    //     `[buildMarionetterTimeline] marionetterPlayableDirectorComponentInfo:`,
    //     marionetterPlayableDirectorComponentInfo,
    //     marionetterActors
    // );

    const buildSignalEmitter = (signalEmitter: MarionetterSignalEmitter): MarionetterTimelineSignalEmitter => {
        let triggered = false;
        const execute = (time: number) => {
            if (time > signalEmitter.t && triggered) {
                triggered = true;
            }
        };
        return {
            name: signalEmitter.n,
            time: signalEmitter.t,
            // ...signalEmitter,
            triggered,
            execute,
        };
    };

    //
    // build track
    //

    for (let i = 0; i < marionetterPlayableDirectorComponentInfo.ts.length; i++) {
        const track = marionetterPlayableDirectorComponentInfo.ts[i];

        if (track.t === MarionetterTrackInfoType.MarkerTrack) {
            const signalEmitters = (track as MarionetterMarkerTrackInfo).ses;
            tracks.push({
                signalEmitters: signalEmitters.map((signalEmitter) => {
                    return buildSignalEmitter(signalEmitter);
                }),
                execute: () => {},
            } as MarionetterTimelineMarkerTrack);
        } else {
            const targetName = (track as MarionetterDefaultTrackInfo).tn;
            const clips = (track as MarionetterDefaultTrackInfo).cs;
            const targetActors = [
                findActorByName(marionetterActors, targetName),
                // Scene.find(placedScene.children, targetName),
            ];
            //const marionetterClips = createMarionetterClips(clips, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
            const marionetterClips = createMarionetterClips(clips);
            if (targetActors.length < 1) {
                console.warn(`[buildMarionetterTimeline] target actor is not found: ${targetName}`);
            }

            // for debug
            // console.log(
            //     `[buildMarionetterTimeline] targetName: ${targetName}, targetActor:`,
            //     targetActors,
            //     marionetterClips
            // );

            const data = {
                targetName,
                targetActors,
                clips: marionetterClips,
                // exec track
                // TODO: clip間の mixer,interpolate,extrapolate の挙動が必要
                execute: (args: MarionetterTimelineTrackExecuteArgs) => {
                    targetActors.forEach((targetActor) => {
                        const { time, scene } = args;
                        const clipAtTime = marionetterClips.find(
                            // (clip) => clip.clipInfo.s <= time && time < clip.clipInfo.s + clip.clipInfo.d
                            (clip) => isTimeInClip(time, clip.clipInfo.s, clip.clipInfo.s + clip.clipInfo.d)
                        );

                        // NOTE: 渡されるtimeそのものがframeTimeになった
                        // const frameTime = time % marionetterPlayableDirectorComponentInfo.d;

                        // まずactorのprocessTimelineを実行
                        if (targetActor) {
                            preProcessActorTimeline(targetActor, time)
                        }

                        if (track.t === MarionetterTrackInfoType.ActivationControlTrack) {
                            if (targetActor != null) {
                                // const clipAtTime = marionetterClips.find(
                                //     (clip) => clip.clipInfo.s < time && time < clip.clipInfo.s + clip.clipInfo.d
                                // );
                                if (clipAtTime) {
                                    targetActor.enabled = true;
                                } else {
                                    targetActor.enabled = false;
                                }
                            }
                        } else {
                            if (targetActor != null) {
                                // // tmp
                                // for (let j = 0; j < marionetterClips.length; j++) {
                                //     marionetterClips[j].execute({ actor: targetActor, time, scene });
                                // }
                                clipAtTime?.execute({ actor: targetActor, time, scene });
                            }
                        }

                        // clipの実行後にupdate
                        if(targetActor) {
                            postProcessActorTimeline(targetActor, time);
                        }
                    });
                },
            } as MarionetterTimelineDefaultTrack;
            tracks.push(data);
        }
    }

    //
    // exec timeline
    //

    const execute = (args: { time: number; scene: Scene }) => {
        const { time, scene } = args;
        // pattern1: use frame
        // const spf = 1 / fps;
        // const frameTime = Math.floor(rawTime / spf) * spf;
        // pattern2: use raw time
        const frameTime = time % marionetterPlayableDirectorComponentInfo.d;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].execute({ time: frameTime, scene });
        }
    };

    const bindActors = (actors: Actor[]) => {
        actors.forEach((actor) => {
            const targetName = actor.name;
            tracks.forEach((track) => {
                // TODO: ここなんかうまいことやりたい
                if (Object.hasOwn(track, 'targetName')) {
                    const t = track as MarionetterTimelineDefaultTrack;
                    if (t.targetName === targetName) {
                        t.targetActors.push(actor);
                    }
                }
            });
        });
    };

    // return { tracks, execute, bindActor };
    return { tracks, execute, bindActors };
}

/**
 *
 * @param clips
 */
function createMarionetterClips(
    clips: MarionetterClipInfoKinds[]
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterClipKinds[] {
    const marionetterClips = [] as MarionetterClipKinds[];

    for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        switch (clip.t) {
            case MarionetterClipInfoType.AnimationClip:
                marionetterClips.push(
                    createMarionetterAnimationClip(
                        clip as MarionetterAnimationClipInfo
                        // needsSomeActorsConvertLeftHandAxisToRightHandAxis
                    )
                );
                break;
            case MarionetterClipInfoType.LightControlClip:
                marionetterClips.push(createMarionetterLightControlClip(clip as MarionetterLightControlClipInfo));
                break;
            case MarionetterClipInfoType.ActivationControlClip:
                marionetterClips.push(
                    createMarionetterActivationControlClip(clip as MarionetterActivationControlClipInfo)
                );
                break;
            case MarionetterClipInfoType.ObjectMoveAndLookAtClip:
                marionetterClips.push(
                    createMarionetterObjectMoveAndLookAtClip(clip as MarionetterObjectMoveAndLookAtClipInfo)
                );
                break;
            default:
                console.error(`[createMarionetterClips] invalid animation clip type`);
        }
    }

    return marionetterClips;
}

/**
 *
 * @param animationClip
 */
function createMarionetterAnimationClip(
    animationClip: MarionetterAnimationClipInfo
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterAnimationClip {
    // actorに直接valueを割り当てる関数
    const execute = (args: MarionetterClipArgs) => {
        const { actor, time } = args;
        let hasLocalPosition: boolean = false;
        let hasLocalRotationEuler: boolean = false;
        let hasLocalScale: boolean = false;
        const localPosition: Vector3 = createVector3Zero();
        const localRotationEulerDegree: Vector3 = createVector3Zero();
        const localScale: Vector3 = createVector3One();

        const start = animationClip.s;
        const bindings = animationClip.b;

        // TODO: typeがあった方がよい. ex) animation clip, light control clip
        bindings.forEach((binding) => {
            const propertyName = binding.n;
            const keyframes = binding.k;
            const value = curveUtilityEvaluateCurve(time - start, keyframes);

            switch (propertyName) {
                case PROPERTY_LOCAL_POSITION_X:
                    hasLocalPosition = true;
                    setV3x(localPosition, value);
                    break;
                case PROPERTY_LOCAL_POSITION_Y:
                    hasLocalPosition = true;
                    setV3y(localPosition, value);
                    break;
                case PROPERTY_LOCAL_POSITION_Z:
                    hasLocalPosition = true;
                    setV3z(localPosition, value);
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_X:
                    hasLocalRotationEuler = true;
                    setV3x(localRotationEulerDegree, value);
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
                    hasLocalRotationEuler = true;
                    setV3y(localRotationEulerDegree, value);
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
                    hasLocalRotationEuler = true;
                    setV3z(localRotationEulerDegree, value);
                    break;
                case PROPERTY_LOCAL_SCALE_X:
                    hasLocalScale = true;
                    setV3x(localScale, value);
                    break;
                case PROPERTY_LOCAL_SCALE_Y:
                    hasLocalScale = true;
                    setV3y(localScale, value);
                    break;
                case PROPERTY_LOCAL_SCALE_Z:
                    hasLocalScale = true;
                    setV3z(localScale, value);
                    break;
                case PROPERTY_FIELD_OF_VIEW:
                    (actor as PerspectiveCamera).fov = value;
                    updateProjectionMatrix(actor as PerspectiveCamera);
                    break;
                case PROPERTY_MATERIAL_BASE_COLOR_R:
                case PROPERTY_MATERIAL_BASE_COLOR_G:
                case PROPERTY_MATERIAL_BASE_COLOR_B:
                case PROPERTY_MATERIAL_BASE_COLOR_A:
                    // TODO: GBufferMaterialとの連携？
                    break;
                // TODO: marionetter じゃなくてもいいかもしれない
                // case MarionetterPostProcessBloom.bloomIntensity:
                //     const bloomParams = (actor as PostProcessVolume).findParameter<BloomPassParameters>(
                //         PostProcessPassType.Bloom
                //     );
                //     if (bloomParams) {
                //         bloomParams.bloomAmount = value;
                //     }
                //     break;
                // case MarionetterPostProcessDepthOfField.focusDistance:
                //     break;
                // case MarionetterPostProcessVignette.vignetteIntensity:
                //     break;
                // case MarionetterPostProcessVolumetricLight.volumetricLightRayStep:
                //     const volumetricLightParams = (
                //         actor as PostProcessVolume
                //     ).findParameter<VolumetricLightPassParameters>(PostProcessPassType.VolumetricLight);
                //     if (volumetricLightParams) {
                //         volumetricLightParams.rayStep = value;
                //     }
                //     console.log(actor)
                //     break;
                default:
                    // // 厳しい場合、propertyが紐づいていない場合はエラーを出す
                    // // console.error(`[createMarionetterAnimationClip] invalid declared property: ${propertyName}, value: ${value}`);
                    // 特に紐づいてない場合はactorに流す
                    processActorPropertyBinder(actor, propertyName, value);
            }
        });

        if (hasLocalScale) {
            copyVector3(actor.transform.scale, localScale);
        } else {
            copyVector3(actor.transform.scale, createVector3One());
        }

        // TODO: なぜか一回行列に落とさないとうまく動かない. まわりくどいかつ余計な計算が走るが
        if (hasLocalRotationEuler) {
            const rm = multiplyMat4Array(
                // // TODO: 本当はc#側でxyを反転させて渡したいが、なぜかうまくいかないのでここだけフロント側で反転
                // createRotationYMatrix(v3y(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD),
                // createRotationXMatrix(v3x(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD),
                // createRotationZMatrix(v3z(localRotationEulerDegree) * DEG_TO_RAD)
                // TODO: 本当はc#側yzを反転させて渡したいが、なぜかうまくいかないのでここだけフロント側で反転
                // 旧PaleGLだとxy反転だったが
                createRotationYMatrix(v3y(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD),
                createRotationXMatrix(v3x(localRotationEulerDegree) * DEG_TO_RAD),
                createRotationZMatrix(v3z(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD)
            );
            const q = rotationMatrixToQuaternion(rm);
            setRotation(actor.transform, createRotator(
                // actor.type === ActorTypes.Light && (actor as Light).lightType === LightTypes.Spot ? q.invertAxis() : q
                actor.type === ActorTypes.Light &&
                ((actor as Light).lightType === LightTypes.Spot ||
                    (actor as Light).lightType === LightTypes.Directional)
                    ? createQuaternionInvertAxis(q)
                    : q
            ));
        } else {
            setRotation(actor.transform, createRotatorFromQuaternion(createQuaternionIdentity()));
        }

        if (hasLocalPosition) {
            // localPosition.z *= -1;
            copyVector3(actor.transform.position, localPosition);
        } else {
            copyVector3(actor.transform.position, createVector3Zero());
        }
    };

    return {
        type: MarionetterAnimationClipType.AnimationClip,
        clipInfo: animationClip,
        // bind,
        execute,
    };
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterLightControlClip(
    lightControlClip: MarionetterLightControlClipInfo
): MarionetterLightControlClip {
    // let obj: Light | null;
    // const bind = (targetObj: Light) => {
    //     obj = targetObj;
    // };
    const execute = (args: MarionetterClipArgs) => {
        const { actor, time } = args;
        const light = actor as Light;
        let hasPropertyColorR: boolean = false;
        let hasPropertyColorG: boolean = false;
        let hasPropertyColorB: boolean = false;
        let hasPropertyColorA: boolean = false;
        let hasPropertyLightIntensity: boolean = false;
        // let hasPropertyBounceIntensity: boolean = false;
        let hasPropertySpotLightRange: boolean = false;

        const color = createColor();
        let lightIntensity = 0;
        // let bounceIntensity = 0;
        // let range = 0;
        let spotLightRange = 0;

        // const { start, bindings } = lightControlClip;
        const start = lightControlClip.s;
        const bindings = lightControlClip.b;

        // TODO: typeがあった方がよい. ex) animation clip, light control clip
        bindings.forEach((binding) => {
            const propertyName = binding.n;
            const keyframes = binding.k;
            const value = curveUtilityEvaluateCurve(time - start, keyframes);

            switch (propertyName) {
                case PROPERTY_COLOR_R:
                    hasPropertyColorR = true;
                    setColorR(color, value);
                    break;
                case PROPERTY_COLOR_G:
                    hasPropertyColorG = true;
                    setColorG(color, value);
                    break;
                case PROPERTY_COLOR_B:
                    hasPropertyColorB = true;
                    setColorB(color, value);
                    break;
                case PROPERTY_COLOR_A:
                    hasPropertyColorA = true;
                    setColorA(color, value);
                    break;
                case PROPERTY_LIGHT_INTENSITY:
                    hasPropertyLightIntensity = true;
                    lightIntensity = value;
                    break;
                case PROPERTY_SPOTLIGHT_RANGE:
                    hasPropertySpotLightRange = true;
                    spotLightRange = value;
                    break;
                // case PROPERTY_BOUNCE_INTENSITY:
                //     hasPropertyBounceIntensity = true;
                //     bounceIntensity = value;
                //     break;
                // case PROPERTY_RANGE:
                //     hasPropertyRange = true;
                //     range = value;
                //     break;
            }
        });

        if (hasPropertyColorR) {
            setColorR(light.color, getColorR(color));
        }
        if (hasPropertyColorG) {
            setColorG(light.color, getColorG(color));
        }
        if (hasPropertyColorB) {
            setColorB(light.color, getColorB(color));
        }
        if (hasPropertyColorA) {
            setColorA(light.color, getColorA(color));
        }
        if (hasPropertyLightIntensity) {
            light.intensity = lightIntensity;
        }
        if (hasPropertySpotLightRange) {
            (light as SpotLight).distance = spotLightRange;
        }
        // if(hasPropertyBounceIntensity) {
        //     obj.bounceIntensity = bounceIntensity;
        // }
        // for spot light
        // if(hasPropertyRange) {
        //     obj.range = range;
        // }
    };

    return {
        type: MarionetterAnimationClipType.LightControlClip,
        clipInfo: lightControlClip,
        // bind,
        execute,
    };
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterActivationControlClip(
    activationControlClip: MarionetterActivationControlClipInfo
): MarionetterActivationControlClip {
    // let obj: Light | null;
    // const bind = (targetObj: Light) => {
    //     obj = targetObj;
    // };
    // const execute = (actor: Actor, time: number) => {
    //     // const { start, duration} = activationControlClip;
    //     // console.log(start, duration, actor, time)
    // };

    return {
        type: MarionetterAnimationClipType.ActivationControlClip,
        clipInfo: activationControlClip,
        execute: () => {},
    };
}

function createMarionetterObjectMoveAndLookAtClip(
    objectMoveAndLookAtClip: MarionetterObjectMoveAndLookAtClipInfo
): MarionetterObjectMoveAndLookAtClip {
    return {
        type: MarionetterAnimationClipType.ObjectMoveAndLookAtClip,
        clipInfo: objectMoveAndLookAtClip,
        execute: (args: { actor: Actor; time: number; scene: Scene }) => {
            const { actor, time, scene } = args;

            // let hasLocalPosition: boolean = false;
            // let hasLocalRotationEuler: boolean = false;
            // let hasLocalScale: boolean = false;
            // const localPosition: Vector3 = Vector3.zero;
            // const localRotationEulerDegree: Vector3 = Vector3.zero;
            // const localScale: Vector3 = Vector3.one;

            // const start = animationClip.s;
            // const bindings = animationClip.b;

            const localPosition: Vector3 = createVector3Zero();

            const start = objectMoveAndLookAtClip.s;
            const bindings = objectMoveAndLookAtClip.b;

            // TODO: typeがあった方がよい. ex) animation clip, light control clip
            bindings.forEach((binding) => {
                const propertyName = binding.n;
                const keyframes = binding.k;
                const value = curveUtilityEvaluateCurve(time - start, keyframes);

                switch (propertyName) {
                    case MarionetterObjectMoveAndLookAtClipInfoProperty.localPositionX:
                        setV3x(localPosition, value);
                        break;
                    case MarionetterObjectMoveAndLookAtClipInfoProperty.localPositionY:
                        setV3y(localPosition, value);
                        break;
                    case MarionetterObjectMoveAndLookAtClipInfoProperty.localPositionZ:
                        setV3z(localPosition, value);
                        break;
                    default:
                        // propertyが紐づいていない場合はエラーにする
                        console.error(`[createMarionetterAnimationClip] invalid declared property: ${propertyName}`);
                }
            });

            const component = getActorComponent<ObjectMoveAndLookAtController>(actor);
            component?.execute({ actor, scene, localPosition });
        },
    };
}
