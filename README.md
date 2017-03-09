# ng-component-loader <a href="https://www.npmjs.com/package/ng-component-loader"><img src="https://img.shields.io/npm/dt/ng-component-loader.svg" alt="Downloads"></a> <a href="https://www.npmjs.com/package/ng-component-loader"><img src="https://img.shields.io/npm/v/ng-component-loader.svg" alt="Version"></a> <a href="https://www.npmjs.com/package/ng-component-loader"><img src="https://img.shields.io/npm/l/ng-component-loader.svg" alt="License"></a>

`ng-component-loader` is a loader for Webpack that can transform `*.ng` files into [AngularJs Components](https://docs.angularjs.org/guide/component).

## What is Webpack?

webpack is a tool to build JavaScript modules in your application. To start using `webpack` from its [cli](https://webpack.js.org/api/cli) or [api](https://webpack.js.org/api/node), follow the [Installation instructions](https://webpack.js.org/guides/installation).
webpack simplifies your workflow by quickly constructing a dependency graph of your application and bundling them in the right order. webpack can be configured to customise optimisations to your code, to split vendor/css/js code for production, run a development server that hot-reloads your code without page refresh and many such cool features. Learn more about [why you should use webpack](https://webpack.js.org/guides/why-webpack).

## Understanding Loaders 

Loaders are transformations that are applied on a resource file of your application. They are functions (running in Node.js) that take the source of a resource file as the parameter and return the new source.
Learn more about [loaders](https://webpack.js.org/concepts/loaders/).

## Install

```
npm install --save-dev ng-component-loader 
```

## Usage

Use the loader either via your Webpack config.

#### Via webpack config (recommended)

```
module.exports = {
  module: {
    rules: [
      {
        test: /\.ng$/,
        use: [ 'ng-component-loader' ]
      }
    ]
  }
}
```

#### Passing parameters: 

```
	{
        test: /\.ng$/, 
        use: ['ng-component-loader?map=false']
    }
```

### Angular Component

In AngularJS, a Component is a special kind of [directive](https://docs.angularjs.org/guide/directive) that uses a simpler
configuration which is suitable for a component-based application structure.

This makes it easier to write an app in a way that's similar to using Web Components or using the new Angular's
style of application architecture.

Advantages of Components:
- simpler configuration than plain directives
- promote sane defaults and best practices
- optimized for component-based architecture
- writing component directives will make it easier to upgrade to Angular

You can see the full documentation [here](https://docs.angularjs.org/guide/component).

##### The `*.ng` file

A `*.ng` file is a custom file format that uses HTML-like syntax to describe a angular component. Each `*.ng` file consists of three types of top-level language blocks: `<template>`, `<script>` and `<style>`:

```html
<!-- ./src/components/my-component.ng -->
<template>
    <h1>My component {{ $ctrl.description }}</h1>
</template>

<style>
    h1 {
        color: #8f8f8f;
    }
</style>

<script>

    module.exports = {
        controller: () => {
            this.description = 'AngularJs';
        }
    };

</script>
```

ng-component-loader will parse the file, extract each language block, pipe them through other loaders if necessary, and finally assemble them back into a CommonJS module whose module.exports is a [AngularJs Component](https://docs.angularjs.org/guide/component) options object.

### Language Blocks

#### `<template>`

- Default language: `html`.

- Each `*.ng` file can contain at most one `<template>` block at a time.

- Contents will be extracted as a string and used as the `template` option for the compiled AngularJs Component.

#### `<script>`

- Default language: `js` (ES2015 is supported automatically if `babel-loader` or `buble-loader` is detected).

- Each `*.ng` file can contain at most one `<script>` block at a time.

- The script is executed in a CommonJS like environment (just like a normal `.js` module bundled via Webpack), which means you can `require()` other dependencies. And with ES2015 support, you can also use the `import` and `export` syntax.

```js
    // tag script inside ng file ./src/components/my-component.ng
    exports default {
        controller: () => {
            this.description = 'AngularJs';
        }
    };
```
Registering your component:

```js
import * as angular from 'angular';

import myComponent from './components/my-component.ng';

angular.module('app', []).component('myComponent', myComponent);
```

You can also return an array with the component data. The first item represents the component name and the second component options.

```js
    // tag script inside ng file ./src/components/my-component.ng
    exports default ['myComponent', {
        controller: () => {
            this.description = 'AngularJs';
        }
    }];
```

Registering:

```js
import * as angular from 'angular';

import myComponent from './components/my-component.ng';

angular.module('app', []).component.apply(this, myComponent);

// ES2015
// .component(...myComponent)
```

#### `<style>`

- Default Language: `css`;
- Multiple `<style>` tags are supported in a single `*.ng` file;
- By default, contents will be extracted and dynamically inserted into the document's `<head>` as an actual `<style>` tag using `style-loader`;

#### The component

```html
<my-component></my-component>
```

### Syntax Highlighting

You can treat `*.ng` files as HTML in your editor.

![syntax-highlighting](https://raw.githubusercontent.com/owen-it/ng-component-loader/master/syntax-highlighting.png)

### License

[MIT](http://opensource.org/licenses/MIT)
