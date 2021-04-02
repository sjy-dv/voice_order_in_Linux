const Porcupine = require("@picovoice/porcupine-node");
const { COMPUTER } = require("@picovoice/porcupine-node/builtin_keywords");
const recorder = require("node-record-lpcm16");

const porcupineInstance = new Porcupine([COMPUTER], [0.5]);

const frameLength = porcupineInstance.frameLength;
const sampleRate = porcupineInstance.sampleRate;

const recording = recorder.record({
  sampleRate: sampleRate,
  channels: 1,
  audioType: "raw",
  recorder: "sox",
});

let frameAccumulator = [];

const chunkArray = (array, size) => {
  return Array.from({ length: Math.ceil(array.length / size) }, (v, index) =>
    array.slice(index * size, index * size + size)
  );
};

recording.stream().on("data", (data) => {
  let newFrames16 = new Array(data.length / 2);
  for (let i = 0; i < data.length; i += 2) {
    newFrames16[i / 2] = data.readInt16LE(i);
  }

  frameAccumulator = frameAccumulator.concat(newFrames16);
  let frames = chunkArray(frameAccumulator, frameLength);

  if (frames[frames.length - 1].length != frameLength) {
    frameAccumulator = frames.pop();
  } else {
    frameAccumulator = [];
  }
  for (const frame of frames) {
    let index = porcupineInstance.process(frame);
    if (index != -1) {
      console.log(`Detected 'Computer'`);
    }
  }
});
console.log(`Listening for 'COMPUTER'...`);
process.stdin.resume();
console.log("Press ctrl+c to exit.");
