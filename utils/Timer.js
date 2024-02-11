const FRAME_COUNT = 20;

export class Timer {
    static PASS_START = 1;
    static PASS_END = 2;

    constructor(device) {
        this.hasGPUTimer = false;
        this.querySet = null;
        this.resolveBuffer = null;
        this.resultBuffer = null;
        this.cpuTime = 0;
        this.cpuTimeCount = 0;
        this.cpuAverage = 0;
        this.gpuTime = 0;
        this.gpuTimeCount = 0;
        this.gpuAverage = 0;
        this.frameStartTime = 0;

        if (device.features.has("timestamp-query")) {
            this.hasGPUTimer = true;

            this.querySet = device.createQuerySet({
                type: "timestamp",
                count: 2
            });
    
            this.resolveBuffer = device.createBuffer({
                size: this.querySet.count * 8,
                usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
            });
    
            this.resultBuffer = device.createBuffer({
                size: this.resolveBuffer.size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });
        }
    }

    passDescriptor(flags) {
        if (!this.hasGPUTimer) {
            return undefined;
        }

        const descriptor = {
            querySet: this.querySet
        };

        if (flags & Timer.PASS_START) {
            descriptor.beginningOfPassWriteIndex = 0
        }

        if (flags & Timer.PASS_END) {
            descriptor.endOfPassWriteIndex = 1
        }

        return descriptor;
    }

    frameStart() {
        this.frameStartTime = performance.now();
    }

    beforeSubmit(commandEncoder) {
        if (this.hasGPUTimer && this.resultBuffer.mapState === "unmapped") {
            commandEncoder.resolveQuerySet(this.querySet, 0, this.querySet.count, this.resolveBuffer, 0);
            commandEncoder.copyBufferToBuffer(this.resolveBuffer, 0, this.resultBuffer, 0, this.resultBuffer.size);
        }
    }

    frameEnd() {
        if (this.hasGPUTimer && this.resultBuffer.mapState === "unmapped") {
            this.resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
                const [start, end] = new BigInt64Array(this.resultBuffer.getMappedRange());
                this.resultBuffer.unmap();

                const time = Number(end - start);

                if (time >= 0) {
                    this.gpuTime += time;
                    ++this.gpuTimeCount;
                } else {
                    this.gpuTime = 0;
                    this.gpuTimeCount = 0;
                }

                if (this.gpuTimeCount === FRAME_COUNT) {
                    this.gpuAverage = this.gpuTime / FRAME_COUNT / 1000000;
                    this.gpuTime = 0;
                    this.gpuTimeCount = 0;
                }
            });
        }

        this.cpuTime += performance.now() - this.frameStartTime;
        ++this.cpuTimeCount;

        if (this.cpuTimeCount === FRAME_COUNT) {
            this.cpuAverage = this.cpuTime / FRAME_COUNT;
            this.cpuTime = 0;
            this.cpuTimeCount = 0;
        }
    }

}