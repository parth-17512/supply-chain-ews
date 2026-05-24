// Test environment setup — point to a no-op DB so server.js doesn't block
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/ews_test_never_connects';
process.env.PORT = '0';               // let OS assign a free port
process.env.ML_SERVICE_URL = 'http://localhost:9999'; // non-existent → triggers fallback
process.env.NODE_ENV = 'test';
