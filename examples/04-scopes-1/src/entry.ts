import { Entry, Template } from 'wane'

@Entry()
@Template(`

  <h1>Info</h1>

  <p>
    Foo is {{ foo }}/{{ max }}
  </p>

  <h2>Others</h2>

  <ul>
    <W@for foo of foos>
      <li>{{ foo }}/{{ max }}</li>
    </W@for>
  </ul>

`)
export class AppCmp {
  foo = 6
  foos = [5, 3, 8, 2, 1]
  max = 99
}
