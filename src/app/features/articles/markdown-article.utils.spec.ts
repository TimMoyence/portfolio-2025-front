import { renderArticleMarkdown } from './markdown-article.utils';

describe('renderArticleMarkdown', () => {
  it('renders the editorial blocks used by Morning-Brief', () => {
    const html = renderArticleMarkdown(
      '# Une édition utile\n\nUne **idée forte** avec [une source](https://example.com).\n\n- Premier point\n- Deuxième point\n\n> À retenir',
    );

    expect(html).toContain('<h2>Une édition utile</h2>');
    expect(html).toContain('<p>Une <strong>idée forte</strong> avec <a href="https://example.com"');
    expect(html).toContain('<ul><li>Premier point</li><li>Deuxième point</li></ul>');
    expect(html).toContain('<blockquote><p>À retenir</p></blockquote>');
  });

  it('escapes raw HTML and rejects unsafe links', () => {
    const html = renderArticleMarkdown(
      '<script>alert(1)</script>\n\n[ne pas suivre](javascript:alert(1))',
    );

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('[ne pas suivre](javascript:alert(1))');
  });
});
