<p align=center>
  <img align=center src="logo.svg" alt=Wane width=200>
</p>

# Wane

**Wane** is a framework, compiler and a bundler: all at the same time.
It aims to become the only tool you need to build a front-end application.

See what makes it special after the Hello World introduction below.

**WARNING!** This is still just an early prototype.
Beware of super experimental stuff ahead, including bugs and obvious missing features.
Feel free to play around, ask questions and report bugs in the issues section.

## Hello World

To get started, create an empty folder for your project and do the usual `yarn init` ceremony.
Then, install `wane`, create a new folder `src`, and within it a file `index.ts`.

```bash
$ yarn add wane
$ mkdir src
$ touch src/index.ts
```

Open it and write the following.

```typescript
// src/index.ts

import { Template } from 'wane'

@Template(`Hello, {{ someone }}!`)
export default class App {
  someone = 'World'
}
```

Save the file and run the wane dev server.

```bash
$ yarn wane start
```

If everything went fine, you're now running the dev server
which will watch for changes you make to the source code,
re-compile the app and reload the browser for you.

You can also create the production build.

```bash
$ yarn wane build
```

The built app is contained within the newly created `dist` folder.
Open the `dist/index.html` file from your browser to see the app in action.

The generated JavaScript file is only **272 bytes**.
Yes, that's less than 0.3kB. 
If you run that through gzip, you get **207 bytes**.
With brotli, you're down to only **166 bytes**.
Here's it again: 

```text
 272 index.js
 207 index.js.gz
 166 index.js.br
``` 

And it can only get better.

Below is a short overview of how it's achieved.

## How's it different

The thing is, there's no _framework_ in the traditional sense.
It just feels like one because it lets you write TypeScript, which you should be already comfortable with.
Add in some decorators and magic happens!

However, behind the scenes, the code you write is treated as a string.
With help of the TypeScript compiler (and the awesome wrapper [`ts-simple-ast`](https://github.com/dsherret/ts-simple-ast)), it statically analyzes your code and completely code-generates everything.

This means that there is **no framework code** at all. 
All code that makes it to the final bundle is **written just for your app**.

In theory, this means that there is nothing stopping Wane from generating the best possible code without any overhead and without any unnecessary code:

- You have an output (an event) on a component that no component listens to? Let's remove it then.
- There is no method that can update the string that you've used for interpolation (`someone` in the Hello World example above)? Then there will be no code generating for updating it: it will be the same as if you've written the value (`"World"`) right there in the template.
- Your component can never be destroyed because it's not inside a `w:if` directive? Then it won't generate the `destroy` method for it.
- Say when you fire an event, you change a variable. A variable that is not bound to the view. So let's not even run the change detection algorithm or re-render anything. Let's only update your model. 

And the best thing is, improvements like these are happening in the compiler.
When a new feature is implemented, you could just run the compiler again over the same code and you could get a smaller bundle and a faster application.

## How to explore

Until I (or someone else) gets around to writing examples and tutorials, your best shot at seeing what is currently implemented are apps created for end-to-end tests under `tests/e2e/apps`.

There's also a work-in-progress website: [wane.app](https://www.wane.app).
