﻿import {BlendTypes, FaceSide, PrimitiveTypes, UniformTypes} from "./../constants.js";
import {Texture} from "./Texture.js";

const createWhite1x1 = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1;
    canvas.height = 1;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1, 1);
    return canvas;
};

export class GPU {
    gl;
    #shader;
    #vao;
    #ibo;
    #uniforms;
    dummyTexture;

    constructor({gl}) {
        this.gl = gl;
        this.dummyTexture = new Texture({ gpu: this, img: createWhite1x1() });
    }

    setShader(shader) {
        this.#shader = shader;
    }

    setVertexArrayObject(vao) {
        this.#vao = vao;
    }

    setIndexBufferObject(ibo) {
        this.#ibo = ibo;
    }

    setUniforms(uniforms) {
        this.#uniforms = uniforms;
    }

    setSize(x, y, width, height) {
        this.gl.viewport(x, y, width, height);
    }
    
    setFramebuffer(framebuffer) {
        const gl = this.gl;
        !!framebuffer
            ? gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject)
            : gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    flush() {
        this.gl.flush();
    }

    clear(r, g, b, a) {
        const gl = this.gl;
        // TODO: mask設定は外側からやった方がよい気がする
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    #getGLPrimitive(primitiveType) {
        const gl = this.gl;
        switch (primitiveType) {
            case PrimitiveTypes.Points:
                return gl.POINTS;
            case PrimitiveTypes.Lines:
                return gl.LINES;
            case PrimitiveTypes.Triangles:
                return gl.TRIANGLES;
            default:
                throw "invalid primitive type";
        }
    }
   
    draw(drawCount, primitiveType, depthTest, depthWrite, blendType, faceSide, startOffset = 0) {
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        const gl = this.gl;
       
        // culling
        switch(faceSide) {
            case FaceSide.Front:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Back:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Double:
                gl.disable(gl.CULL_FACE);
                gl.frontFace(gl.CCW);
                break;
            default:
                throw "invalid face side";
        }

        // depth write
        gl.depthMask(depthWrite);
        // for debug
        // console.log(gl.getParameter(gl.DEPTH_WRITEMASK));

        // depth test
        if(depthTest) {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL); // TODO: set by arg
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
     
        // TODO: renderer側でやるべき？
        // blend
        // gl.blendFunc(src, dest)
        // - src: current draw
        // - dest: drawn 
        switch(blendType) {
            case BlendTypes.Opaque:
                gl.disable(gl.BLEND);
                // pattern_2: for enabled blend
                // gl.enable(gl.BLEND);
                // gl.blendFunc(gl.ONE, gl.ZERO);
                break;
            case BlendTypes.Transparent:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case BlendTypes.Additive:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            default:
                throw "invalid blend type";
        }

        gl.useProgram(this.#shader.glObject);
        
        let activeTextureIndex = 0;
    
        const setUniformValue = (type, uniformName, value) => {
            const gl = this.gl;
            const location = gl.getUniformLocation(this.#shader.glObject, uniformName);
            // TODO: nullなとき,値がおかしいときはセットしない
            switch(type) {
                case UniformTypes.Float:
                    gl.uniform1f(location, value);
                    break;
                case UniformTypes.Vector3:
                    gl.uniform3fv(location, value.elements);
                    break;
                case UniformTypes.Matrix4:
                    // arg[1] ... use transpose.
                    gl.uniformMatrix4fv(location, false, value.elements);
                    break;
                case UniformTypes.Color:
                    gl.uniform4fv(location, value.elements);
                    break;
                case UniformTypes.Texture:
                    if(value) {
                        gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                        gl.bindTexture(
                            gl.TEXTURE_2D,
                            value ? value.glObject : this.dummyTexture.glObject
                        );
                        gl.uniform1i(location, activeTextureIndex);
                        activeTextureIndex++;
                    }
                    break;
                case UniformTypes.CubeMap:
                    if(value) {
                        gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                        gl.bindTexture(
                            gl.TEXTURE_CUBE_MAP,
                            // TODO: needs dummy texture for cubemap ?
                            value ? value.glObject : this.dummyTexture.glObject
                        );
                        gl.uniform1i(location, activeTextureIndex);
                        activeTextureIndex++;
                    }
                    break;
                default:
                    throw "invalid uniform type";
            }
        };
 
        // uniforms
        Object.keys(this.#uniforms).forEach(uniformName => {
            const uniform = this.#uniforms[uniformName];
            if(uniform.type === UniformTypes.Struct) {
                Object.keys(uniform.value).forEach(key => setUniformValue(uniform.value[key].type, `${uniformName}.${key}`, uniform.value[key].value));
            } else {
                setUniformValue(uniform.type, uniformName, uniform.value);
            }
        });
        
        // set vertex
        gl.bindVertexArray(this.#vao.glObject);

        if (this.#ibo) { // draw by indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo.glObject);
            gl.drawElements(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset);
        } else { // draw by array
            gl.drawArrays(glPrimitiveType, startOffset, drawCount);
        }
       
        // unbind when end render
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
}