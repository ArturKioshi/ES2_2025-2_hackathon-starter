const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

describe('AI Controller Tests', () => {
  let req;
  let res;
  let aiController;

  let fsMock;
  let collectionMock;
  let dbMock;
  let mongoClientMock;
  let vectorSearchMock;
  let chatTogetherAIMock;
  let pdfLoaderMock;
  let textSplitterMock;
  let embeddingsMock;

  const mockCursor = (data = []) => ({
    toArray: sinon.stub().resolves(data),
  });

  beforeEach(() => {
    sinon.restore();

    const controllerPath = require.resolve('../controllers/ai');
    if (require.cache[controllerPath]) {
      delete require.cache[controllerPath];
    }

    fsMock = {
      existsSync: sinon.stub(),
      mkdirSync: sinon.stub(),
      readdirSync: sinon.stub(),
      readFileSync: sinon.stub(),
      renameSync: sinon.stub(),
    };

    // MongoDB Mocks
    collectionMock = {
      countDocuments: sinon.stub(),
      createSearchIndex: sinon.stub(),
      createIndex: sinon.stub(),
      listSearchIndexes: sinon.stub(),
      distinct: sinon.stub(),
      findOne: sinon.stub(),
      updateSearchIndex: sinon.stub(),
    };

    dbMock = {
      collection: sinon.stub().returns(collectionMock),
      listCollections: sinon.stub(),
      createCollection: sinon.stub().returns(collectionMock),
    };

    mongoClientMock = {
      connect: sinon.stub(),
      db: sinon.stub().returns(dbMock),
      close: sinon.stub(),
    };

    class MockMongoClient {
      constructor() {
        // eslint-disable-next-line no-constructor-return
        return mongoClientMock;
      }
    }

    /* eslint-disable class-methods-use-this */
    pdfLoaderMock = class {
      load() {
        return Promise.resolve([{ pageContent: 'text', metadata: {} }]);
      }
    };

    textSplitterMock = class {
      splitDocuments() {
        return Promise.resolve([{ pageContent: 'chunk', metadata: {} }]);
      }
    };

    embeddingsMock = class {};

    vectorSearchMock = {
      fromDocuments: sinon.stub().resolves(),
      similaritySearch: sinon.stub().resolves([{ pageContent: 'context info' }]),
    };

    const MockVectorSearchClass = class {
      similaritySearch(...args) {
        return vectorSearchMock.similaritySearch(...args);
      }
    };

    MockVectorSearchClass.fromDocuments = vectorSearchMock.fromDocuments;

    chatTogetherAIMock = class {
      generate() {
        return Promise.resolve({ generations: [[{ text: 'RAG Answer' }], [{ text: 'General Answer' }]] });
      }

      invoke() {
        return Promise.resolve({ content: 'RAG Answer' });
      }
    };
    /* eslint-enable class-methods-use-this */

    sinon.spy(chatTogetherAIMock.prototype, 'generate');
    sinon.spy(chatTogetherAIMock.prototype, 'invoke');

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

    mongoClientMock.connect.resolves();
    mongoClientMock.close.resolves();

    dbMock.listCollections.returns(mockCursor([]));
    collectionMock.listSearchIndexes.returns(mockCursor([{ name: 'default', status: 'READY' }]));
    collectionMock.countDocuments.resolves(0);
    collectionMock.createSearchIndex.resolves();
    collectionMock.createIndex.resolves();
    collectionMock.distinct.resolves([]);
    collectionMock.findOne.resolves(null);

    fsMock.existsSync.returns(false);
    fsMock.mkdirSync.returns(true);
    fsMock.readdirSync.returns([]);
    fsMock.readFileSync.returns(Buffer.from(''));
    fsMock.renameSync.returns(true);

    if (!global.fetch) {
      global.fetch = sinon.stub();
    } else {
      sinon.stub(global, 'fetch');
    }

    aiController = proxyquire('../controllers/ai', {
      fs: fsMock,
      path,
      // eslint-disable-next-line global-require
      crypto: require('crypto'),
      mongodb: { MongoClient: MockMongoClient },
      '@langchain/community/document_loaders/fs/pdf': { PDFLoader: pdfLoaderMock },
      '@langchain/textsplitters': { RecursiveCharacterTextSplitter: textSplitterMock },
      '@langchain/community/embeddings/hf': { HuggingFaceInferenceEmbeddings: embeddingsMock },
      '@langchain/mongodb': {
        MongoDBAtlasVectorSearch: MockVectorSearchClass,
        MongoDBAtlasSemanticCache: class {},
        MongoDBStore: class {},
      },
      '@langchain/community/chat_models/togetherai': { ChatTogetherAI: chatTogetherAIMock },
      'pdfjs-dist/legacy/build/pdf.mjs': {},
    });
  });

  afterEach(() => {
    sinon.restore();
    if (global.fetch && global.fetch.restore) global.fetch.restore();
  });

  describe('Basic Routes', () => {
    it('should render AI index page', () => {
      aiController.getAi(req, res);
      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('ai/index');
    });

    it('should render moderation page', () => {
      aiController.getOpenAIModeration(req, res);
      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('ai/openai-moderation');
    });

    it('should render together AI camera page', () => {
      aiController.getTogetherAICamera(req, res);
      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('ai/togetherai-camera');
    });

    it('should render together AI classifier page', () => {
      aiController.getTogetherAIClassifier(req, res);
      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('ai/togetherai-classifier');
    });
  });

  describe('OpenAI Moderation', () => {
    it('should return error when OPENAI_API_KEY is missing', async () => {
      const oldKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      req.body.inputText = 'Hello World';

      await aiController.postOpenAIModeration(req, res);

      expect(res.render.calledOnce).to.be.true;
      const model = res.render.firstCall.args[1];
      expect(model.error).to.include('API key is not set');
      process.env.OPENAI_API_KEY = oldKey;
    });

    it('should handle successful moderation API response', async () => {
      process.env.OPENAI_API_KEY = 'valid_key';
      req.body.inputText = 'Some text';

      global.fetch.resolves({
        ok: true,
        json: async () => ({ results: [{ flagged: true, categories: { hate: true } }] }),
      });

      await aiController.postOpenAIModeration(req, res);

      expect(res.render.calledOnce).to.be.true;
      const args = res.render.firstCall.args[1];
      expect(args.result.flagged).to.be.true;
    });
  });

  describe('TogetherAI Classifier', () => {
    it('should classify text successfully with JSON response', async () => {
      process.env.TOGETHERAI_API_KEY = 'key';
      req.body.inputText = 'My order is late';

      global.fetch.resolves({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ department: 'Shipping' }) } }],
        }),
      });

      await aiController.postTogetherAIClassifier(req, res);

      const args = res.render.firstCall.args[1];
      expect(args.result.department).to.equal('Shipping');
    });
  });

  describe('TogetherAI Camera', () => {
    it('should fail when no image is provided', async () => {
      req.file = null;
      await aiController.postTogetherAICamera(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });
  });

  describe('RAG - getRag', () => {
    it('should handle DB errors gracefully in getRag', async () => {
      fsMock.existsSync.returns(true);
      mongoClientMock.connect.rejects(new Error('Connection failed'));

      await aiController.getRag(req, res);

      const args = res.render.firstCall.args[1];
      expect(args.ingestedFiles).to.deep.equal([]);
    });
  });

  describe('RAG - postRagIngest', () => {
    it('should redirect with info if no files found', async () => {
      fsMock.readdirSync.returns([]);

      await aiController.postRagIngest(req, res);

      expect(req.flash.calledWith('info')).to.be.true;
      expect(res.redirect.calledWith('/ai/rag')).to.be.true;
    });
  });

  describe('RAG - postRagAsk', () => {
    it('should reject empty question', async () => {
      req.body.question = '   ';
      await aiController.postRagAsk(req, res);
      expect(res.redirect.called).to.be.true;
    });

    it('should redirect if no files indexed', async () => {
      req.body.question = 'Valid question';
      collectionMock.distinct.resolves([]);

      await aiController.postRagAsk(req, res);

      expect(req.flash.calledWith('errors')).to.be.true;
    });

    it('should process question successfully via LLM', async () => {
      req.body.question = 'Valid question';

      collectionMock.distinct.resolves(['file.pdf']);
      collectionMock.listSearchIndexes.returns(mockCursor([{ name: 'default', status: 'READY' }]));
      collectionMock.findOne.resolves({ embedding: [0.1] });
      vectorSearchMock.similaritySearch.resolves([{ pageContent: 'Mock Context' }]);

      await aiController.postRagAsk(req, res);

      expect(res.render.calledOnce, 'res.render was not called').to.be.true;
      const args = res.render.firstCall.args[1];

      expect(args.ragResponse).to.exist;
    });
  });
});
