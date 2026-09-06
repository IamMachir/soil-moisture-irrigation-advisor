jest.mock('../src/models/readingModel');
jest.mock('../src/utils/irrigationAdvisor');

const { addReading } = require('../src/models/readingModel');
const { evaluateZone } = require('../src/utils/irrigationAdvisor');
const { submitReading } = require('../src/controllers/readingController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('submitReading', () => {
  it('rejects a request missing zoneId or moisturePercent', async () => {
    const req = { body: { zoneId: 1 } };
    const res = mockRes();

    await submitReading(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(addReading).not.toHaveBeenCalled();
  });

  it('stores the reading and runs it through the advisor', async () => {
    evaluateZone.mockResolvedValue({ watered: true, threshold: 30 });
    const req = { body: { zoneId: 1, moisturePercent: 25 } };
    const res = mockRes();

    await submitReading(req, res);

    expect(addReading).toHaveBeenCalledWith({ zoneId: 1, moisturePercent: 25 });
    expect(evaluateZone).toHaveBeenCalledWith({ zoneId: 1, moisturePercent: 25 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Reading recorded',
      advisorResult: { watered: true, threshold: 30 },
    });
  });
});
