const { EmailService, MockProviderA, MockProviderB } = require('./Project');

async function runTest() {
  // Creating mock providers for testing code
  const providerA = new MockProviderA();
  const providerB = new MockProviderB();
  
  // Initializing email service and their constructor with both providers
  const emailService = new EmailService([providerA, providerB]);

  // Test email sending
  console.log('Test 1: Sending a single email');
  const result1 = await emailService.sendEmail(
    'test1@priyanshu.com', 
    'Test Subject 1', 
    'This is a test email body'
  );
  console.log('Email send result:', result1);

  // Test duplicate prevention
  console.log('\nTest 2: Sending duplicate email');
  const result2 = await emailService.sendEmail(
    'test1@priyanshu.com', 
    'Test Subject 1', 
    'This is a test email body'
  );
  console.log('Duplicate email result:', result2);

  // Test rate limiting (send more emails than limit)
  console.log('\nTest 3: Rate limiting test');
  for (let i = 0; i < 15; i++) {
    const result = await emailService.sendEmail(
      `test${i}@priyanshu.com`, 
      `Test Subject ${i}`, 
      `This is test email ${i}`
    );
    console.log(`Email ${i + 1} send result:`, result);
  }
}
runTest().catch(console.error);