export default (config, env, helpers) => {
  saveFile();
  let uglify = helpers.getPluginsByName(config, 'UglifyJsPlugin')[0];
  if (uglify) {
    uglify.plugin.options.sourceMap = false;
  }
};

// FIXME... this is a pretty bad place to do this :|
async function saveFile() {
  require('dotenv').config();
  if (!process.env.FIREBASE_LOGIN_URL || process.env.FIREBASE_LOGIN_URL === 'https://example.com') {
    return;
  }
  const firebaseAuth = await fetch(process.env.FIREBASE_LOGIN_URL, {
    body: JSON.stringify({
      email: process.env.FIREBASE_USER_EMAIL,
      password: process.env.FIREBASE_USER_PASSWORD,
      returnSecureToken: true,
    }),
    method: 'POST',
  });
  const firebaseAuthResult = await firebaseAuth.json();
  var firebaseAuthToken = firebaseAuthResult.idToken;

  const fs = require('fs');
  await fetch(`${process.env.FIREBASE_URL}/podcasts.json?auth=${firebaseAuthToken}`, {
    method: 'get',
  })
    .then((resp) => resp.json())
    .then(function (data) {
      let keyArray = Object.keys(data);
      let newDataArray = [];
      for (let i = 0; i < keyArray.length; i++) {
        let pc = data[keyArray[i]];
        pc.name = pc.title;
        newDataArray.push(pc);
      }
      fs.writeFileSync(
        './assets/data/podcasts.json',
        JSON.stringify({
          podcasts: newDataArray,
        })
      );
      console.log('--- new podcasts.json saved --');
    });
}
