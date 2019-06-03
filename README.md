# vue-hypermodel
Module for REST APIs, that are build on top of the application architecture HATEOAS.
Vue-hypermodel delivers you the possibility to transform the json you get from you api, to models.


## Getting started
first add package with yarn or npm
```
yarn add vue-hypermodel
npm install vue-hypermodel
```

create vue.config.js file in main directory of your project with following content:

```javascript
module.exports = {
  transpileDependencies: [
    'vue-hypermodel'
  ]
}
```
