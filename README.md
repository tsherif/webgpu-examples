WebGPU Examples
===============

Small examples of SPIR-V compatible WebGPU usage.

- [Blank](https://tsherif.github.io/webgpu-examples/blank.html): Setting up a swap chain and clearing the canvas.
- [Point](https://tsherif.github.io/webgpu-examples/point.html): Creating a pipeline and drawing a single point.
- [Triangle](https://tsherif.github.io/webgpu-examples/triangle.html): Creating vertex buffers and drawing a triangle.
- [Cube](https://tsherif.github.io/webgpu-examples/cube.html): Creating vertex and uniform buffers, and animating a cube.
- [Textured, Lit Cube](https://tsherif.github.io/webgpu-examples/cube-texture-lighting.html): Creating a texture from a DOM image, setting up vertex and uniform buffers, and animating a cube.
- [Particles](https://tsherif.github.io/webgpu-examples/particles.html): Simulating gravity on instanced particles using a compute shader.

Examples currently only run in [Chrome Canary](https://www.google.com/chrome/canary/) with the `enable-unsafe-webgpu` flag enabled. See the [Implementation Status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) page for updates on support. 

All examples are implemented as simple HTML pages and can be run locally by simply running a local development server, e.g. `python -m SimpleHTTPServer`.

