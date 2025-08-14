describe('Jest Setup', () => {
  it('should be able to run tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support TypeScript', () => {
    const message: string = 'Hello Jest!';
    expect(message).toBe('Hello Jest!');
  });
});
