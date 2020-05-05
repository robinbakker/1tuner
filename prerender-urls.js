module.exports = async function() {
  let urlArray = [{
    url: '/',
    title: '1tuner | listen to radio, podcasts and create playlists',
    description: 'Listen to radio, podcasts and create playlists.',
    logo: 'https://1tuner.com/assets/icons/icon-512x512.png'
  }, {
    url: '/about',
    title: 'About 1tuner | one web app to listen to audio streams',
    description: 'Listen to radio, podcasts and create playlists.',
    logo: 'https://1tuner.com/assets/icons/icon-512x512.png'
  }, {
    url: '/radio-stations',
    title: 'Radio stations - 1tuner | listen to the radio',
    description: 'Listen to radio, podcasts and create playlists.',
    logo: 'https://1tuner.com/assets/icons/icon-512x512.png'
  }, {
    url: '/podcasts',
    title: 'Podcasts - 1tuner | listen to podcasts',
    description: 'Listen to radio, podcasts and create playlists.',
    logo: 'https://1tuner.com/assets/icons/icon-512x512.png'
  }, {
    url: '/playlists',
    title: 'Playlists - 1tuner | take control',
    description: 'Listen to radio, podcasts and create playlists.',
    logo: 'https://1tuner.com/assets/icons/icon-512x512.png'
  }, {
    url: '/settings',
    title: 'Settings - 1tuner | one web app to listen to audio streams',
    description: 'Listen to radio, podcasts and create playlists.',
    logo: 'https://1tuner.com/assets/icons/icon-512x512.png'
  }];
  await fetch('https://raw.githubusercontent.com/robinbakker/1tuner/master/assets/data/stations.json', {
    method: 'get'
  }).then((resp) => resp.json()).then(function(items) {
    for (let item in items) {
      urlArray.push({
        url: '/radio-station/' + item,
        title: items[item].name + ' - Radio station - 1tuner',
        description: 'Listen now to ' + items[item].name + ' at 1tuner.com',
        logo: items[item].logosource
      });
    }
  });
  // await fetch('https://raw.githubusercontent.com/robinbakker/1tuner/master/assets/data/podcasts.json', {
  //   method: 'get'
  // }).then((resp) => resp.json()).then(function(data) {
  //   for (let item in data.podcasts) {
  //     let pc = data.podcasts[item];
  //     urlArray.push({
  //       url: '/podcast/' + encodeURIComponent(pc.name) + '/?feedurl=' + pc.feedUrl,
  //       title: pc.name + ' - Podcast - 1tuner',
  //       description: 'Listen now to ' + pc.name + ' at 1tuner.com',
  //       logo: pc.artworkUrl
  //     });
  //   }
  // });
  return urlArray;
};
