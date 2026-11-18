/**
 * @jest-environment node
 */
import path from 'path';
import { ESLint } from 'eslint';

// The lint rule that keeps a failed request's response out of the browser console, where it
// would publish the participant's bearer token and request body. CI does not run the linter,
// so this test is what holds the rule in place.
const root = path.resolve(__dirname, '..', '..');
const RULE = 'no-restricted-syntax';

const restrictedIn = async (code: string): Promise<number> => {
  const eslint = new ESLint({ cwd: root });
  const [result] = await eslint.lintText(code, { filePath: path.join(root, 'src', 'sample.ts') });
  return result.messages.filter((m) => m.ruleId === RULE).length;
};

describe('logging of failed requests', () => {
  it.each([
    'try { f(); } catch (e: any) { console.error(e.response); }',
    'try { f(); } catch (e: any) { console.log("failed", e.response); }',
    'try { f(); } catch (e: any) { console.warn(e.config); }',
    'try { f(); } catch (e: any) { console.error(e.request); }',
  ])('is refused by the lint configuration: %s', async (code) => {
    await expect(restrictedIn(code)).resolves.toBe(1);
  });

  it.each([
    'try { f(); } catch (e) { logRequestFailure("loading", e); }',
    'console.error("failed", { status: 500 });',
    'const response = 1; console.log(response);',
  ])('lets the safe forms through: %s', async (code) => {
    await expect(restrictedIn(code)).resolves.toBe(0);
  });

  it('finds no failed request logged whole anywhere in the sources', async () => {
    const eslint = new ESLint({ cwd: root });
    const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);
    const offending = results.flatMap((r) =>
      r.messages
        .filter((m) => m.ruleId === RULE)
        .map((m) => `${path.relative(root, r.filePath)}:${m.line}`),
    );
    expect(offending).toEqual([]);
  }, 60000);
});
