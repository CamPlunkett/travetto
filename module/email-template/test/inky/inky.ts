import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import { cleanseOutput, cleanseTemplate } from './util';
import { ComponentFactory } from '../../src/inky/factory';

@Suite('Inky')
class InkyTest {

  @Test('can take in settings in the constructor')
  testSettings() {

    const factory = new ComponentFactory(
      16,
      { columns: 'col' }
    );

    assert.equal(factory.componentTags.columns, 'col', 'Sets custom component tags');
    assert.equal(factory.columnCount, 16, 'Sets a custom column count');
  }

  @Test(`doesn't choke on inline elements`)
  testInline() {
    const input = '<container>This is a link to <a href="#">ZURB.com</a>.</container>';
    const expected = `
      <table align="center" class="container">
        <tbody>
          <tr>
            <td>This is a link to <a href="#">ZURB.com</a>.</td>
          </tr>
        </tbody>
      </table>
    `;

    assert(cleanseTemplate(input) === cleanseOutput(expected));
  }

  @Test(`doesn't choke on special characters`)
  testSpecial() {
    const input = '<container>This is a link tö <a href="#">ZURB.com</a>.</container>';
    const expected = `
      <table align="center" class="container">
        <tbody>
          <tr>
            <td>This is a link tö <a href="#">ZURB.com</a>.</td>
          </tr>
        </tbody>
      </table>
    `;

    assert(cleanseTemplate(input) === cleanseOutput(expected));
  }

  @Test(`doesn't convert these characters into entities`)
  testEntities() {
    const input = `<container>There's &nbsp; some amazing things here!</container>`;
    const expected = `
      <table align="center" class="container">
        <tbody>
          <tr>
            <td>There's &nbsp; some amazing things here!</td>
          </tr>
        </tbody>
      </table>
    `;

    assert(cleanseTemplate(input) === cleanseOutput(expected));
  }

  @Test(`doesn't decode entities if non default cheerio config is given`)
  testDecode() {
    const input = '<container>"should not replace quotes"</container>';
    const expected = `
      <table align="center" class="container">
        <tbody>
          <tr>
            <td>"should not replace quotes"</td>
          </tr>
        </tbody>
      </table>
    `;

    assert(cleanseTemplate(input) === cleanseOutput(expected));
  }

  @Test(`doesn't muck with stuff inside raw`)
  doTest() {
    const input = '<raw><%= test %></raw>';
    const expected = '<%= test %>';

    assert(cleanseTemplate(input) === cleanseOutput(expected));
  }

  @Test(`can handle multiple raw tags`)
  testMultipleRaw() {
    const input = '<h1><raw><%= test %></raw></h1><h2>< raw >!!!</ raw ></h2>';
    const expected = '<h1><%= test %></h1><h2>!!!</h2>';

    assert(cleanseTemplate(input) === cleanseOutput(expected));
  }
}