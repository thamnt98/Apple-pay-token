const { Client, Config } = require('@adyen/api-library');

// Create a simple test function
async function testAdyenAPI() {
  try {
    console.log('Testing Adyen API structure...');
    
    // Create config
    const config = new Config();
    config.apiKey = 'test_api_key';
    config.environment = 'TEST';
    
    // Create client
    const client = new Client({ config });
    
    // Check if client.request is a function
    console.log('Is client.request a function?', typeof client.request === 'function');
    
    // Log the methods on client
    console.log('Methods on client:', Object.keys(client));
    
    // Log the version of the API library
    console.log('Adyen API Library version:', require('@adyen/api-library/package.json').version);
    
  } catch (error) {
    console.error('Error testing Adyen API:', error);
  }
}

// Run the test
testAdyenAPI(); 