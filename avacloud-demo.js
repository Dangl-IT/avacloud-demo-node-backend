var avaCloudClient = require('@dangl/avacloud-client-node');
var fs = require('fs');

// This is the Dangl.Identity OpenID token endpoint
const danglIdentityTokenEndpoint = 'https://identity.dangl-it.com/connect/token';

async function returnAvaProject(clientId, clientSecret, gaebFile) {
    const accessToken = await getOAuth2AccessToken(clientId, clientSecret);
    if (!accessToken) {
        return { error: 'Failed to get access token' };
    }

    const avaProject = await getAvaProject(accessToken, gaebFile);

    if (!avaProject) {
        return { error: 'Failed to convert GAEB to AVA' };
    }

    return avaProject;
}

// This function retrieves the JWT Token
async function getOAuth2AccessToken(
    clientId,
    clientSecret
  ) {
    if (!clientId || !clientSecret) {
      console.log(
        "Please provide values for clientId and clientSecret. You can find more info in the tutorial at www.dangl-it.com or the AVACloud documenation."
      );
      throw new Error("Missing clientId or clientSecret");
    }
    try {
      const tokenResponseRaw = await fetch(danglIdentityTokenEndpoint, {
        method: "POST",
        body: "grant_type=client_credentials&scope=avacloud",
        headers: {
          Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      if (tokenResponseRaw.status !== 200) {
        throw new Error(
          "Failed to obtain an access token, status code: " +
            tokenResponseRaw.status
        );
      }
  
      const jsonResponse = await tokenResponseRaw.json();
      const accessToken = jsonResponse["access_token"];
      if (!accessToken) {
        console.log(
          "Failed to obtain an access token. Have you read the documentation and set up your OAuth2 client?"
        );
      }
  
      return accessToken;
    } catch {
      console.log(
        "Failed to obtain an access token. Have you read the documentation and set up your OAuth2 client?"
      );
  
      throw new Error("Failed to obtain an access token");
    }
  }

// This function sends the GAEB file to AVACloud and returns the project model
async function getAvaProject(accessToken, gaebFile) {
    const apiClient = new avaCloudClient.GaebConversionApi();
    apiClient.accessToken = accessToken;

    var gaebFileParam = getGaebFile(gaebFile)

    var avaConversionResult = await apiClient.gaebConversionConvertToAva(gaebFileParam);

    if (avaConversionResult.status < 200 || avaConversionResult.status >= 300) {
        console.log('Failed to convert the GAEB input file');
        return null;
    } else {
        return avaConversionResult.result;
    }
}

function getGaebFile(gaebFile) {
  // Files sent to the Node backend are saved as temporary files,
  // here it's being read again
  const gaebFileBuffer = fs.readFileSync(gaebFile.path);
  const fileParam = {
    data: new Blob([gaebFileBuffer]),
    fileName: gaebFile.name
  };
  return fileParam;
}

module.exports = {
    returnAvaProject: returnAvaProject
};
