/**
 * Test Script for Accident Detection Endpoint
 * 
 * This script tests the POST /api/accident-detected endpoint
 * by sending a multipart/form-data request with test data.
 * 
 * Usage: node test-accident-endpoint.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function testAccidentDetected() {
  console.log('🧪 Testing POST /api/accident-detected endpoint...\n');

  // Create a test image (1x1 PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  const testImagePath = path.join(__dirname, 'test-accident-image.png');
  fs.writeFileSync(testImagePath, testImageBuffer);

  try {
    // Test Case 1: Valid Request
    console.log('✅ Test Case 1: Valid accident detection request');
    const formData = new FormData();
    formData.append('lat', '24.7136');
    formData.append('long', '46.6753');
    formData.append('lanNumber', '2');
    formData.append('nodeId', '101');
    formData.append('image', fs.createReadStream(testImagePath));

    const response = await axios.post(`${BASE_URL}/api/accident-detected`, formData, {
      headers: formData.getHeaders(),
    });

    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('✅ Test Case 1 PASSED\n');

    // Test Case 2: Missing Image
    console.log('❌ Test Case 2: Missing image (should fail)');
    const formData2 = new FormData();
    formData2.append('lat', '24.7136');
    formData2.append('long', '46.6753');
    formData2.append('lanNumber', '2');
    formData2.append('nodeId', '101');

    try {
      await axios.post(`${BASE_URL}/api/accident-detected`, formData2, {
        headers: formData2.getHeaders(),
      });
      console.log('❌ Test Case 2 FAILED (should have returned error)\n');
    } catch (error) {
      console.log('Expected Error:', error.response?.data);
      console.log('✅ Test Case 2 PASSED\n');
    }

    // Test Case 3: Invalid lanNumber
    console.log('❌ Test Case 3: Invalid lanNumber (should fail)');
    const formData3 = new FormData();
    formData3.append('lat', '24.7136');
    formData3.append('long', '46.6753');
    formData3.append('lanNumber', 'abc');
    formData3.append('nodeId', '101');
    formData3.append('image', fs.createReadStream(testImagePath));

    try {
      await axios.post(`${BASE_URL}/api/accident-detected`, formData3, {
        headers: formData3.getHeaders(),
      });
      console.log('❌ Test Case 3 FAILED (should have returned error)\n');
    } catch (error) {
      console.log('Expected Error:', error.response?.data);
      console.log('✅ Test Case 3 PASSED\n');
    }

    // Test Case 4: Wrong file type
    console.log('❌ Test Case 4: Wrong file type (should fail)');
    const testTextPath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testTextPath, 'This is not an image');

    const formData4 = new FormData();
    formData4.append('lat', '24.7136');
    formData4.append('long', '46.6753');
    formData4.append('lanNumber', '2');
    formData4.append('nodeId', '101');
    formData4.append('image', fs.createReadStream(testTextPath), {
      filename: 'test.txt',
      contentType: 'text/plain',
    });

    try {
      await axios.post(`${BASE_URL}/api/accident-detected`, formData4, {
        headers: formData4.getHeaders(),
      });
      console.log('❌ Test Case 4 FAILED (should have returned error)\n');
    } catch (error) {
      console.log('Expected Error:', error.response?.data);
      console.log('✅ Test Case 4 PASSED\n');
    }

    // Cleanup
    fs.unlinkSync(testImagePath);
    fs.unlinkSync(testTextPath);

    console.log('🎉 All tests completed!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    
    // Cleanup
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
  }
}

// Run tests
testAccidentDetected();
