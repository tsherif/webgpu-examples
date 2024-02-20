const DEFAULT_SAMPLE_COUNT = 50;

export class Timer {
    static PASS_START = 1;
    static PASS_END = 2;

    constructor(device, sampleCount = DEFAULT_SAMPLE_COUNT) {
        this.device = device;
        this.sampleCount = sampleCount;
        this.hasGPUTimer = device.features.has("timestamp-query");
        this.cpuTimers = {};
        this.cpuTimes = {};
        this.gpuTimers = {};
        this.gpuTimes = {}
    }

    gpuPassDescriptor(timerName, flags = Timer.PASS_START | Timer.PASS_END) {
        if (!this.gpuTimers[timerName]) {
            const querySet = this.device.createQuerySet({
                type: "timestamp",
                count: 2
            });
    
            const resolveBuffer = this.device.createBuffer({
                size: querySet.count * 8,
                usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
            });
    
            const resultBuffer = this.device.createBuffer({
                size: resolveBuffer.size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });   

            this.gpuTimers[timerName] = {
                querySet,
                resolveBuffer,
                resultBuffer,
                time: 0,
                timeCount: 0,
            }

            this.gpuTimes[timerName] = 0;
        }

        const timer = this.gpuTimers[timerName];

        const descriptor = {
            querySet: timer.querySet
        };

        if (flags & Timer.PASS_START) {
            descriptor.beginningOfPassWriteIndex = 0;
        }

        if (flags & Timer.PASS_END) {
            descriptor.endOfPassWriteIndex = 1;
        }

        return descriptor;
    }

    gpuBeforeSubmit(commandEncoder, timerNames = Object.keys(this.gpuTimers)) {
        timerNames.forEach(timerName => {
            const timer = this.gpuTimers[timerName];

            if (timer && timer.resultBuffer.mapState === "unmapped") {
                const { querySet, resolveBuffer, resultBuffer } = timer;

                commandEncoder.resolveQuerySet(querySet, 0, querySet.count, resolveBuffer, 0);
                commandEncoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, resultBuffer.size);
            }
        });
    }

    gpuAfterSubmit(timerNames = Object.keys(this.gpuTimers)) {
        timerNames.forEach(timerName => {
            const timer = this.gpuTimers[timerName];

            if (timer && timer.resultBuffer.mapState === "unmapped") {
                const { resultBuffer } = timer;
                resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
                    const [start, end] = new BigInt64Array(resultBuffer.getMappedRange());
                    resultBuffer.unmap();
    
                    const time = Number(end - start);
    
                    if (time >= 0) {
                        timer.time += time;
                        ++timer.timeCount;
                    } else {
                        timer.time = 0;
                        timer.timeCount = 0;
                    }
    
                    if (timer.timeCount === this.sampleCount) {
                        this.gpuTimes[timerName] = timer.time / this.sampleCount / 1000000;
                        timer.time = 0;
                        timer.timeCount = 0;
                    }
                });
            }
        });
    }

    cpuTimeStart(timerName) {
        this.cpuTimers[timerName] ??= {
            startTime: 0,
            time: 0,
            timeCount: 0
        };
        this.cpuTimes[timerName] ??= 0;

        this.cpuTimers[timerName].startTime = performance.now();
    }


    cpuTimeEnd(timerName) {
        const timer = this.cpuTimers[timerName];

        timer.time += performance.now() - timer.startTime;
        ++timer.timeCount;

        if (timer.timeCount === this.sampleCount) {
            this.cpuTimes[timerName] = timer.time / this.sampleCount;
            timer.time = 0;
            timer.timeCount = 0;
        }
    }

}