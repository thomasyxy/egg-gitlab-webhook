
🥚Egg plugin for processing gitlab Webhooks. 

## Installation

```
npm install egg-gitlab-webhook
```

```
yarn add egg-gitlab-webhook
```

## Usage

```js
// plugin.js
gitlabWebhook: {
  enable: true,
  package: 'egg-gitlab-webhook',
}
```

```js
// config.default.js
gitlabWebhook: {
  path: '/',
  secret: '', // gitlab 秘钥
  event: {
    // push: './scripts/webhook.js',
    push: () => {
    },
    push: function (event) {
    },
  }
}
```

## Example

```js
event: {
  push: (event) => {
    if (event.payload) {
      console.log(event.payload);
    }
  };
}
```
