const { expect } = require('chai');
const sinon = require('sinon');
const ai = require('../controllers/ai');

describe('AI Controller basic tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      flash: sinon.stub(),
    };

    res = {
      render: sinon.stub(),
      redirect: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render AI index page', () => {
    ai.getAi(req, res);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('ai/index');
    expect(res.render.firstCall.args[1]).to.deep.equal({ title: 'AI Examples' });
  });

  it('should render moderation page with default values', () => {
    ai.getOpenAIModeration(req, res);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('ai/openai-moderation');

    const model = res.render.firstCall.args[1];
    expect(model.result).to.equal(null);
    expect(model.error).to.equal(null);
  });

  it('should return error when OPENAI_API_KEY is missing', async () => {
    process.env.OPENAI_API_KEY = ''; // simulate missing key
    req.body.inputText = 'Hello World';

    await ai.postOpenAIModeration(req, res);

    expect(res.render.calledOnce).to.be.true;

    const model = res.render.firstCall.args[1];
    expect(model.error).to.equal('OpenAI API key is not set in environment variables.');
  });

  it('should return error when text input is empty', async () => {
    process.env.OPENAI_API_KEY = 'abc'; // simulate valid key
    req.body.inputText = '   ';

    await ai.postOpenAIModeration(req, res);

    const model = res.render.firstCall.args[1];
    expect(model.error).to.equal('Text for input modaration check:');
  });
});

describe('Additional AI controller tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      file: null,
      flash: sinon.stub(),
    };

    res = {
      render: sinon.stub(),
      redirect: sinon.stub(),
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render together AI camera page', () => {
    ai.getTogetherAICamera(req, res);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('ai/togetherai-camera');
  });

  it('should render together AI classifier page', () => {
    ai.getTogetherAIClassifier(req, res);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('ai/togetherai-classifier');
  });

  it('should fail when no image is provided', async () => {
    req.file = null;

    await ai.postTogetherAICamera(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.firstCall.args[0]).to.deep.equal({ error: 'No image provided' });
  });

  it('should return error when classifier input is empty', async () => {
    req.body.inputText = '   ';
    process.env.TOGETHERAI_API_KEY = 'a';
    process.env.TOGETHERAI_MODEL = 'b';

    await ai.postTogetherAIClassifier(req, res);

    expect(res.render.calledOnce).to.be.true;
    const args = res.render.firstCall.args[1];

    expect(args.error).to.equal('Please enter the customer message to classify.');
  });

  it('should reject empty question and redirect with flash error', async () => {
    req.body.question = '   ';

    await ai.postRagAsk(req, res);

    // Verifica redirecionamento
    expect(res.redirect.calledOnce).to.be.true;
    expect(res.redirect.firstCall.args[0]).to.equal('/ai/rag');

    // Verifica mensagem flash
    expect(req.flash.calledOnce).to.be.true;
    expect(req.flash.firstCall.args[0]).to.equal('errors');
    expect(req.flash.firstCall.args[1]).to.deep.equal({
      msg: 'Please enter a question.',
    });
  });
});

describe('postTogetherAICamera', () => {
  let req, res;

  beforeEach(() => {
    req = {
      file: { buffer: Buffer.from('fakeimage') },
      body: {},
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    sinon.restore();
  });

  it('should return 400 if no image is provided', async () => {
    req.file = null;

    await ai.postTogetherAICamera(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ error: 'No image provided' })).to.be.true;
  });

  it('should return 500 if TogetherAI API key is missing', async () => {
    req.file = { buffer: Buffer.from('img') };

    const oldKey = process.env.TOGETHERAI_API_KEY;
    delete process.env.TOGETHERAI_API_KEY;

    await ai.postTogetherAICamera(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ error: 'TogetherAI API key is not set' })).to.be.true;

    // Restore key
    process.env.TOGETHERAI_API_KEY = oldKey;
  });
});
