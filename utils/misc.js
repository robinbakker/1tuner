export function getColorString(AString) {
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