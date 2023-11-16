const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const http = require('http');
let  docUrl = '';

http.createServer(function (req, res) {
     
    // http header
    res.writeHead(200, {'Content-Type': 'text/html'}); 
     
    const url = req.url;
     
    if(url ==='/getForm') {
        authorize().then(
            printDocTitle
        ).finally(data=>{
            console.log(data);
            res.write(docUrl);
            res.end();
        })
            
        }
    
}).listen(10000, function() {
     
    // The server object listens on port 3000
    console.log("server start at port 3000");
});
// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/documents'];
const SCOPES = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/documents'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
async function printDocTitle(auth) {
    let newDoc = 'Form'+Date.now();
  const docs = google.docs({version: 'v1', auth});
  const drive = google.drive({version: 'v3', auth});
  await docs.documents.get({
    documentId: '1OP58emARFbUEHPbESoEJt2eQDMvWrD7NWFr2use0UbI',
  }).then(async res=>{
    
    await drive.files.copy({
        fileId:res.data.documentId,
        requestBody:{
            name: newDoc,
        }
    }).then(data=>{
        docUrl = "https://docs.google.com/document/d/"+data.data.id+"/edit";
    }
    )
  })
}

