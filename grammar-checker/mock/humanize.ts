import { MockMethod } from 'vite-plugin-mock';

export default [
  {
    url: '/api/edit/humanize',
    method: 'post',
    response: ({ body }) => {
      const { text, tone, strength } = body;

      // Simulate AI processing delay
      const delay = Math.random() * 1000 + 500;

      // Simulate token usage
      const tokens = text.split(/\s+/).length;

      // Basic mock logic
      let humanizedText = `[${tone}, ${strength}] ${text}`;
      if (strength === 'strong') {
        humanizedText = humanizedText.toUpperCase();
      }

      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            text: humanizedText,
            meta: {
              tokens: tokens,
              model: 'mock-humanizer-v1',
            },
          });
        }, delay);
      });
    },
  },
] as MockMethod[];