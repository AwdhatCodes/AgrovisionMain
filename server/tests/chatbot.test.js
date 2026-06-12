import { chatbotResponse } from '../chatbot.js';

describe('Chatbot NLP Logic', () => {
  it('should return a friendly greeting in English', () => {
    const response = chatbotResponse('hello', {}, 'EN');
    expect(response.intent).toBe('greeting');
    expect(response.text).toMatch(/Hello|Hi|Good morning|Good evening/);
  });

  it('should return a friendly greeting in Swahili', () => {
    const response = chatbotResponse('habari', {}, 'SW');
    expect(response.intent).toBe('greeting');
    expect(response.text).toMatch(/Habari|Asubuhi|jioni/);
  });

  it('should detect a known disease and provide treatment advice', () => {
    const response = chatbotResponse('my plant has early blight', {}, 'EN');
    expect(response.intent).toBe('disease');
    expect(response.disease).toBe('early blight');
    expect(response.text).toContain('Early Blight');
  });

  it('should provide a fallback response for unknown input', () => {
    const response = chatbotResponse('random gibberish', {}, 'EN');
    expect(response.intent).toBe('fallback');
  });
});
