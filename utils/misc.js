export function getColorString(AString) {
  if(!AString) {
    return 'rgba(50,50,50,.75)';
  }
  let idNrTxt = AString.split('').map(c => c.charCodeAt()).reduce((v1, v2) => v1 + v2)+'';
  let offset = 140;
  let nr1 = parseInt(idNrTxt.substr(0,2));
  let nr2 = parseInt(idNrTxt.substr(-2));
  let r=(offset+nr1-90), g=(offset-nr1+AString.length),b=(offset+nr2);
  return 'rgba('+r+','+g+','+b+',.75)';
}

export function getUrlQueryParameterByName(AName, AUrl) {
  AName = AName.replace(/[\[\]]/g, "\\$&");
  if(AUrl[0]!='?' && AUrl[0]!='&') {
    AUrl = '?' + AUrl;
  }
  var regex = new RegExp("[?&]" + AName + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(AUrl);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function isValidUrl(AStr) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~:+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(AStr);
}

export function removeHtml(AString) {
  if (!AString) return null;
  var temporalDivElement = document.createElement('div');
  temporalDivElement.innerHTML = AString;
  return temporalDivElement.textContent || temporalDivElement.innerText || '';
}

export function getTime(APart1, APart2) {
  if(!APart2) {
    APart2 = 0;
  }
  APart1 += '';
  APart2 += '';
  return `${APart1.padStart(2,'0')}:${APart2.padStart(2,'0')}`
}

export function getTimeFromSeconds(ASeconds) {
  if(!ASeconds) {
    return getTime(0, 0);
  }
  return getTime(Math.floor(ASeconds/60), Math.floor(ASeconds%60));
}