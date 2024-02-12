const DEFAULT_SAMPLE_COUNT = 50;

export class Timer {
    constructor(device, passNames, sampleCount = DEFAULT_SAMPLE_COUNT) {
        this.passNames = passNames.slice();
        this.sampleCount = sampleCount;
        this.hasGPUTimer = false;
        this.cpuTimers = {};
        this.cpuTimes = {};
        this.passTimers = {};
        this.gpuTimes = {}

        if (device.features.has("timestamp-query")) {
            this.hasGPUTimer = true;

            passNames.forEach(passName => {
                const querySet = device.createQuerySet({
                    type: "timestamp",
                    count: 2
                });
        
                const resolveBuffer = device.createBuffer({
                    size: querySet.count * 8,
                    usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
                });
        
                const resultBuffer = device.createBuffer({
                    size: resolveBuffer.size,
                    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
                });   

                this.passTimers[passName] = {
                    querySet,
                    resolveBuffer,
                    resultBuffer,
                    time: 0,
                    timeCount: 0,
                }

                this.gpuTimes[passName] = 0;
            });

           
        }
    }

    passDescriptor(passName) {
        const passTimer = this.passTimers[passName];

        if (!passTimer) {
            return undefined;
        }

        return {
            querySet: passTimer.querySet,
            beginningOfPassWriteIndex: 0,
            endOfPassWriteIndex: 1
        };
    }

    beforeSubmit(commandEncoder, passNames = this.passNames) {
        passNames.forEach(passName => {
            const passTimer = this.passTimers[passName];

            if (passTimer && passTimer.resultBuffer.mapState === "unmapped") {
                const { querySet, resolveBuffer, resultBuffer } = passTimer;

                commandEncoder.resolveQuerySet(querySet, 0, querySet.count, resolveBuffer, 0);
                commandEncoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, resultBuffer.size);
            }
        });
    }

    afterSubmit(passNames = this.passNames) {
        passNames.forEach(passName => {
            const passTimer = this.passTimers[passName];

            if (passTimer && passTimer.resultBuffer.mapState === "unmapped") {
                const { resultBuffer } = passTimer;
                resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
                    const [start, end] = new BigInt64Array(resultBuffer.getMappedRange());
                    resultBuffer.unmap();
    
                    const time = Number(end - start);
    
                    if (time >= 0) {
                        passTimer.time += time;
                        ++passTimer.timeCount;
                    } else {
                        passTimer.time = 0;
                        passTimer.timeCount = 0;
                    }
    
                    if (passTimer.timeCount === this.sampleCount) {
                        this.gpuTimes[passName] = passTimer.time / this.sampleCount / 1000000;
                        passTimer.time = 0;
                        passTimer.timeCount = 0;
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