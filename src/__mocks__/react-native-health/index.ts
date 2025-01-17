const AppleHealthKit = {
  initHealthKit: jest.fn((options, callback) => callback(null)),
  getStepCount: jest.fn((options, callback) => callback(null, { value: 1000 })),
  getDistanceWalkingRunning: jest.fn((options, callback) => callback(null, { value: 1000 })),
  getActiveEnergyBurned: jest.fn((options, callback) => callback(null, [{ value: 500 }])),
  getHeartRateSamples: jest.fn((options, callback) => callback(null, [{ value: 75 }])),
};

module.exports = {
  AppleHealthKit,
}; 