WebGPU Examples
===============

Rendering algorithms implemented in WebGPU.

- [Triangle](https://tsherif.github.io/webgpu-examples/triangle.html): Creating vertex buffers and drawing a triangle.
- [Cube](https://tsherif.github.io/webgpu-examples/cube.html): Creating a texture from an ImageBitmap, setting up vertex and uniform buffers, and animating a 3D cube.
- [Particles](https://tsherif.github.io/webgpu-examples/particles.html): Simulating gravity on instanced particles using a compute shader.
- [Multiple Canvases](https://tsherif.github.io/webgpu-examples/multi-canvas.html): Rendering to multiple canvases with a single device instance.
- [Picking](https://tsherif.github.io/webgpu-examples/pick.html): Interact with rendered objects using color picking.
- [Deferred Rendering](https://tsherif.github.io/webgpu-examples/deferred.html): Rendering mesh data to a multisampled gBuffer then lighting in a separate pass.

Examples currently only run without special flags in Chrome on Windows and OSX. See the [Implementation Status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) page for updates on support. 

All examples are implemented in a single HTML file with minimal use of functions, modules, classes or other abstractions. The goal is to allow the reader to easily see, in sequential order, all WebGPU calls that are made. They can be run locally by serving them from a local HTTP server, e.g. `python -m http.server`.

