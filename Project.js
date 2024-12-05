
class RateLimiter {
  constructor() {
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.MAX_REQUESTS = 10;
    this.RATE_LIMIT_WINDOW = 60000; // 1 minute
  }

  canSend() {
    const now = Date.now();
    if (now - this.lastResetTime > this.RATE_LIMIT_WINDOW) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount < this.MAX_REQUESTS) {
      this.requestCount++;
      return true;
    }
    return false;
  }
}

class MockProvider1 {
  async sendEmail(to, subject, body) {
    if (Math.random() < 0.3) throw new Error('Provider 1 failed');
    console.log(`Provider 1: Sending email to ${to}`);
    return true;
  }
}

class MockProvider2 {
  async sendEmail(to, subject, body) {
    if (Math.random() < 0.2) throw new Error('Provider 2 failed');
    console.log(`Provider 2: Sending email to ${to}`);
    return true;
  }
}

class EmailService {
  constructor(providers) {
    this.providers = providers;
    this.sentEmails = new Set();
    this.rateLimiter = new RateLimiter();
    this.emailQueue = [];
  }

  async sendEmail(to, subject, body) {
    const emailId = this.generateUniqueId(); 
    console.log("Email Id: " + emailId);
    // creating unique id of each email will prevent duplicate sends.
    if (this.sentEmails.has(emailId)) {
      console.log('Duplicate email detected');
      return false;
    }

    if (!this.rateLimiter.canSend()) {
      this.queueEmail(emailId, to, subject, body);
      return false;
    }

    const emailMessage = {
      id: emailId,
      to,
      subject,
      body,
      attempts: 0,
      status: 'pending',
      timestamp: Date.now()
    };

    return this.sendEmailWithRetry(emailMessage);
  }

  async sendEmailWithRetry(emailMessage) {
    for (const provider of this.providers) {
      try {
        emailMessage.attempts++;
        const result = await this.executeWithExponentialBackoff(
          () => provider.sendEmail(emailMessage.to, emailMessage.subject, emailMessage.body),
          emailMessage.attempts
        );

        if (result) {
          this.sentEmails.add(emailMessage.id);
          emailMessage.status = 'sent';
          return true;
        }
      } catch (error) {
        console.error(`Send attempt failed: ${error}`);
        emailMessage.status = 'failed';
      }
    }
    return false;
  }

  async executeWithExponentialBackoff(fn, attempt, maxAttempts = 3) {
    if (attempt > maxAttempts) return false;

    try {
      return await fn();
    } catch (error) {
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.executeWithExponentialBackoff(fn, attempt + 1, maxAttempts);
    }
  }

  generateUniqueId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    let length = 10;
    for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
    }
    return result;
  }

  queueEmail(id, to, subject, body) {
    this.emailQueue.push({
      id,
      to,
      subject,
      body,
      attempts: 0,
      status: 'pending',
      timestamp: Date.now()
    });
  }

  async processEmailQueue() {
    while (this.emailQueue.length > 0) {
      const email = this.emailQueue.shift();
      if (email) {
        await this.sendEmail(email.to, email.subject, email.body);
      }
    }
  }
}

// Usage example
async function main() {
  const providerA = new MockProvider1();
  const providerB = new MockProvider2();
  
  const emailService = new EmailService([providerA, providerB]);
  
  await emailService.sendEmail(
    'user@example.com', 
    'Test Subject', 
    'Test email body'
  );
}

module.exports = { EmailService, MockProviderA: MockProvider1, MockProviderB: MockProvider2 };