///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2020 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {

    let translateMat;
    let rotateXMat;
    let rotateYMat;
    let rotateZMat;
    let scaleMat;

    if (window.mat4) {
        translateMat = mat4.create();
        rotateXMat = mat4.create();
        rotateYMat = mat4.create();
        rotateZMat = mat4.create();
        scaleMat = mat4.create();
    }

    const ZEROS = [0, 0, 0];
    const ONES = [1, 1, 1];

    let textureDataCanvas = document.createElement("canvas");
    let textureDataCtx = textureDataCanvas.getContext("2d");

    window.utils = {
        checkSupport() {
            if (!navigator.gpu) {
                document.body.innerHTML = `
                    <h1>WebGPU not supported!</h1>
                    <div>
                        SPIR-V WebGPU is currently only supported in <a href="https://www.google.com/chrome/canary/">Chrome Canary</a>
                        with the flag "enable-unsafe-webgpu" enabled.
                    </div>
                    <div>
                        See the <a href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status">Implementation Status</a> page for more details.
                    </div>
                `;

                throw new Error("WebGPU not supported");
            }
        },

        addDescription(title, description, url) {
            title = `WebGPU Example: ${title}`;

            const titleElement = document.createElement("title");
            titleElement.innerText = title;
            document.head.appendChild(titleElement);

            const descriptionElement = document.createElement("div");
            descriptionElement.id = "description";
            descriptionElement.style.width = "400px";
            descriptionElement.innerHTML = `
                <h2>${title}</h2>
                <div>${description}</div>
                <div><a href="https://github.com/tsherif/webgpu-examples/blob/gh-pages/${url}">Source Code</a></div>
            `;
            document.body.appendChild(descriptionElement);
        },

        xformMatrix(xform, translate, rotate, scale) {
            translate = translate || ZEROS;
            rotate = rotate || ZEROS;
            scale = scale || ONES;

            mat4.fromTranslation(translateMat, translate);
            mat4.fromXRotation(rotateXMat, rotate[0]);
            mat4.fromYRotation(rotateYMat, rotate[1]);
            mat4.fromZRotation(rotateZMat, rotate[2]);
            mat4.fromScaling(scaleMat, scale);

            mat4.multiply(xform, rotateXMat, scaleMat);
            mat4.multiply(xform, rotateYMat, xform);
            mat4.multiply(xform, rotateZMat, xform);
            mat4.multiply(xform, translateMat, xform);
        },

        getImageData(img) {
            textureDataCanvas.width = img.width;
            textureDataCanvas.height = img.height;
            textureDataCtx.drawImage(img, 0, 0);
            return textureDataCtx.getImageData(0, 0, img.width, img.height).data;
        },

        createCube(options) {
            options = options || {};

            let dimensions = options.dimensions || [1, 1, 1];
            let position = options.position || [-dimensions[0] / 2, -dimensions[1] / 2, -dimensions[2] / 2];
            let x = position[0];
            let y = position[1];
            let z = position[2];
            let width = dimensions[0];
            let height = dimensions[1];
            let depth = dimensions[2];

            let fbl = {x: x,         y: y,          z: z + depth};
            let fbr = {x: x + width, y: y,          z: z + depth};
            let ftl = {x: x,         y: y + height, z: z + depth};
            let ftr = {x: x + width, y: y + height, z: z + depth};
            let bbl = {x: x,         y: y,          z: z };
            let bbr = {x: x + width, y: y,          z: z };
            let btl = {x: x,         y: y + height, z: z };
            let btr = {x: x + width, y: y + height, z: z };

            let positions = new Float32Array([
                //front
                fbl.x, fbl.y, fbl.z,
                fbr.x, fbr.y, fbr.z,
                ftl.x, ftl.y, ftl.z,
                ftl.x, ftl.y, ftl.z,
                fbr.x, fbr.y, fbr.z,
                ftr.x, ftr.y, ftr.z,

                //right
                fbr.x, fbr.y, fbr.z,
                bbr.x, bbr.y, bbr.z,
                ftr.x, ftr.y, ftr.z,
                ftr.x, ftr.y, ftr.z,
                bbr.x, bbr.y, bbr.z,
                btr.x, btr.y, btr.z,

                //back
                fbr.x, bbr.y, bbr.z,
                bbl.x, bbl.y, bbl.z,
                btr.x, btr.y, btr.z,
                btr.x, btr.y, btr.z,
                bbl.x, bbl.y, bbl.z,
                btl.x, btl.y, btl.z,

                //left
                bbl.x, bbl.y, bbl.z,
                fbl.x, fbl.y, fbl.z,
                btl.x, btl.y, btl.z,
                btl.x, btl.y, btl.z,
                fbl.x, fbl.y, fbl.z,
                ftl.x, ftl.y, ftl.z,

                //top
                ftl.x, ftl.y, ftl.z,
                ftr.x, ftr.y, ftr.z,
                btl.x, btl.y, btl.z,
                btl.x, btl.y, btl.z,
                ftr.x, ftr.y, ftr.z,
                btr.x, btr.y, btr.z,

                //bottom
                bbl.x, bbl.y, bbl.z,
                bbr.x, bbr.y, bbr.z,
                fbl.x, fbl.y, fbl.z,
                fbl.x, fbl.y, fbl.z,
                bbr.x, bbr.y, bbr.z,
                fbr.x, fbr.y, fbr.z
            ]);

            let uvs = new Float32Array([
                //front
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,

                //right
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,

                //back
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,

                //left
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,

                //top
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,

                //bottom
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1
            ]);

            let normals = new Float32Array([
                // front
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,

                // right
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,

                // back
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,

                // left
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,

                // top
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,

                // bottom
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0
            ]);

            return {
                positions,
                normals,
                uvs
            };

        },

        createSphere(options) {
            options = options || {};

            let longBands = options.longBands || 32;
            let latBands = options.latBands || 32;
            let radius = options.radius || 1;
            let lat_step = Math.PI / latBands;
            let long_step = 2 * Math.PI / longBands;
            let num_positions = longBands * latBands * 4;
            let num_indices = longBands * latBands * 6;
            let lat_angle, long_angle;
            let positions = new Float32Array(num_positions * 3);
            let normals = new Float32Array(num_positions * 3);
            let uvs = new Float32Array(num_positions * 2);
            let indices = new Uint16Array(num_indices);
            let x1, x2, x3, x4,
                y1, y2,
                z1, z2, z3, z4,
                u1, u2,
                v1, v2;
            let i, j;
            let k = 0, l = 0;
            let vi, ti;

            for (i = 0; i < latBands; i++) {
                lat_angle = i * lat_step;
                y1 = Math.cos(lat_angle);
                y2 = Math.cos(lat_angle + lat_step);
                for (j = 0; j < longBands; j++) {
                    long_angle = j * long_step;
                    x1 = Math.sin(lat_angle) * Math.cos(long_angle);
                    x2 = Math.sin(lat_angle) * Math.cos(long_angle + long_step);
                    x3 = Math.sin(lat_angle + lat_step) * Math.cos(long_angle);
                    x4 = Math.sin(lat_angle + lat_step) * Math.cos(long_angle + long_step);
                    z1 = Math.sin(lat_angle) * Math.sin(long_angle);
                    z2 = Math.sin(lat_angle) * Math.sin(long_angle + long_step);
                    z3 = Math.sin(lat_angle + lat_step) * Math.sin(long_angle);
                    z4 = Math.sin(lat_angle + lat_step) * Math.sin(long_angle + long_step);
                    u1 = 1 - j / longBands;
                    u2 = 1 - (j + 1) / longBands;
                    v1 = 1 - i / latBands;
                    v2 = 1 - (i + 1) / latBands;
                    vi = k * 3;
                    ti = k * 2;

                    positions[vi] = x1 * radius;
                    positions[vi+1] = y1 * radius;
                    positions[vi+2] = z1 * radius; //v0

                    positions[vi+3] = x2 * radius;
                    positions[vi+4] = y1 * radius;
                    positions[vi+5] = z2 * radius; //v1

                    positions[vi+6] = x3 * radius;
                    positions[vi+7] = y2 * radius;
                    positions[vi+8] = z3 * radius; // v2


                    positions[vi+9] = x4 * radius;
                    positions[vi+10] = y2 * radius;
                    positions[vi+11] = z4 * radius; // v3

                    normals[vi] = x1;
                    normals[vi+1] = y1;
                    normals[vi+2] = z1;

                    normals[vi+3] = x2;
                    normals[vi+4] = y1;
                    normals[vi+5] = z2;

                    normals[vi+6] = x3;
                    normals[vi+7] = y2;
                    normals[vi+8] = z3;

                    normals[vi+9] = x4;
                    normals[vi+10] = y2;
                    normals[vi+11] = z4;

                    uvs[ti] = u1;
                    uvs[ti+1] = v1;

                    uvs[ti+2] = u2;
                    uvs[ti+3] = v1;

                    uvs[ti+4] = u1;
                    uvs[ti+5] = v2;

                    uvs[ti+6] = u2;
                    uvs[ti+7] = v2;

                    indices[l    ] = k;
                    indices[l + 1] = k + 1;
                    indices[l + 2] = k + 2;
                    indices[l + 3] = k + 2;
                    indices[l + 4] = k + 1;
                    indices[l + 5] = k + 3;

                    k += 4;
                    l += 6;
                }
            }

            return {
                positions,
                normals,
                uvs,
                indices
            };
        }
    }

})();
