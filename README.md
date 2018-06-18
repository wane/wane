# Wane

**Wane** is a framework, compiler and a bundler: all at the same time.
It aims to become the only tool you need to be a front-end application.

**WARNING!** This is still just an early prototype.
Beware of super experimental stuff ahead, including bugs and obvious missing features.
Feel free to play around, ask question and report bugs in the issues section.

## Hello World

To get started, create an empty folder for your project and do the usual `npm init` ceremony.
Then install `wane`, create a new folder `src` and within it a file `entry.ts`.

```
$ npm i @wane/core
$ mkdir src
$ touch src/entry.ts
```

Open the `src/entry.ts` file and write the following.

```typescript
import { Entry, Template } from '@wane/core'

@Entry()
@Template(`Hello, {{ someone }}!`)
export class App {
  someone = 'World'
}
```

Save the file and run the wane compiler.
You can do this quickly by utilizing `npx`.

```
$ npx wane
```

If everything went fine, you should see the success message in green:

```
✔ Compiled successfully.
```

The built app it contained within the newly created `dist` folder.
Open the `dist/index.html` file from your browser to see the app in action.

## How to explore

Until I (or someone else) gets around to writing examples and tutorials, your best shot a seeing what is currently implemented are apps created for end-to-end tests under `tests/e2e/apps`.
