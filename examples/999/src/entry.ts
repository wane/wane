import { Template, Entry, Register } from 'wane'

@Entry()
@Template(`
  <div>
    <W@if e>
      <pre>a: {{ a }}</pre>
      <pre>d: {{ d }}</pre>
    </W@if>

    <pre>f, g, a, b {{ f }} {{ g }} {{ a }} {{ b }}</pre>
  </div>

  <div>
    <W@if !a>
      <b>a is false</b>
    </W@if>

    <W@if a>
      <b>a is true</b>
      <W@if b>
        <W@for cc of c>
          <pre>c.foo: {{ cc.foo }}</pre>
          <pre>c.bar: {{ cc.bar }}</pre>
          <pre>d: {{ d }}</pre>
        </W@for>
      </W@if>
    </W@if>
  </div>

  <W@if a>
    <pre>c: {{ c }}</pre>
    <pre>d: {{ d }}</pre>
  </W@if>
`)
class AppCmp {
  a = false
  b = false
  c = [{foo: 1, bar: 'a'}, {foo: 2, bar: 'b'}]
  d = false
  e = false
  f = false
}
