const environments = {
  development: {
    port: process.env.PORT || 5000,
    facebook: {
      pageAccessToken: "EAAIhSZBqtaS0BAKlpzNyw93lIZCA4d7S23m80NtDyCmy6d4DzrZBT9eGh2GH8ZAZBIBWv8sHZAp9JiIvR2N9Ifr6WbageIlQ5gdbtEwJmpdwc2WaXAsXZBZAPdpFx192Md50uO51Qj16fm4mZAvZAqGM5ZCSvc1nJntw8qZCeOG4NMGiBAZDZD",
      verifyToken: "0JnWimhayLJUarCcho8qo9yZcJoJrsp4euo+S8A6kkQ="
    },
    google: {
      projectId: "robotic-sky-150512",
      credentials: require("./key-file.json")
    },
    apiai: {
      clientToken: "80612ce5b58d4f89a2194d87162643b1"
    },
    luis: {
      appId: "8240a877-09e9-43a9-ace8-def655d6c4c5",
      subscriptionKey: "a43c4bb7ea5c46898f48ea0c70e8aa98"
    }
  },
  production: {
    port: process.env.PORT || 80,
    facebook: {
      pageAccessToken: process.env.FB_ACCESS_TOKEN,
      verifyToken: process.env.FB_VERIFY_TOKEN
    },
    google: {
      projectId: process.env.GOOGLE_PROJECTID,
      credentials: require("./key-file.json")
    },
    apiai: {
      clientToken: process.env.APIAI_CLIENT_TOKEN
    },
    luis: {
      appId: process.env.LUIS_APPID,
      subscriptionKey: process.env.LUIS_SUBSCRIPTION_KEY
    }
  }
};

module.exports = environments[process.env.NODE_ENV || "development"];
